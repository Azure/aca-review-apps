"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const crypto = __importStar(require("crypto"));
const arm_appcontainers_1 = require("@azure/arm-appcontainers");
const identity_1 = require("@azure/identity");
const AuthorizerFactory_1 = require("azure-actions-webclient/AuthorizerFactory");
const taskparameters_1 = require("./taskparameters");
const prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
const MAX_REVISION_NAME_LENGTH = 63;
function main() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Set user agent variable.
            const usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
            const actionName = 'ACAReviewApps';
            const userAgentString = (!!prefix ? `${prefix}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
            core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);
            const endpoint = yield AuthorizerFactory_1.AuthorizerFactory.getAuthorizer();
            const taskParams = taskparameters_1.TaskParameters.getTaskParams(endpoint);
            const credential = new identity_1.DefaultAzureCredential();
            // The revision name format is described in this documentation
            // https://learn.microsoft.com/en-us/azure/container-apps/revisions#revision-name-suffix
            const revisionName = `${taskParams.containerAppName}--${taskParams.revisionNameSuffix}`;
            if (revisionName.length > MAX_REVISION_NAME_LENGTH)
                throw new Error(`The total length of revision name ${revisionName} is ${revisionName.length}. This must be less than 64.`);
            console.log("Predeployment Steps Started");
            const client = new arm_appcontainers_1.ContainerAppsAPIClient(credential, taskParams.subscriptionId);
            const currentAppProperty = yield client.containerApps.get(taskParams.resourceGroup, taskParams.containerAppName);
            if (taskParams.deactivateRevisionMode) {
                yield deactivateRevision({
                    client,
                    resourceGroup: taskParams.resourceGroup,
                    containerAppName: taskParams.containerAppName,
                    traffic: ((_b = (_a = currentAppProperty.configuration) === null || _a === void 0 ? void 0 : _a.ingress) === null || _b === void 0 ? void 0 : _b.traffic) || [],
                    revisionName: `${taskParams.containerAppName}--${taskParams.revisionNameSuffix}`,
                });
                return;
            }
            const traffics = currentAppProperty.configuration.ingress.traffic.filter((traffic) => {
                if (!traffic.weight || traffic.weight === 0)
                    return false;
                if (traffic.latestRevision) {
                    traffic.latestRevision = false;
                    traffic.revisionName = currentAppProperty.latestRevisionName;
                }
                return true;
            }) || [];
            traffics.push({
                revisionName: `${taskParams.containerAppName}--${taskParams.revisionNameSuffix}`,
                weight: 0,
                latestRevision: false
            });
            const ingressConfig = {
                external: currentAppProperty.configuration.ingress.external,
                targetPort: currentAppProperty.configuration.ingress.targetPort,
                traffic: traffics,
                customDomains: currentAppProperty.configuration.ingress.customDomains || []
            };
            const scaleConfig = {
                maxReplicas: currentAppProperty.template.scale.maxReplicas,
                minReplicas: currentAppProperty.template.scale.minReplicas,
                rules: [{
                        "name": 'httpscalingrule',
                        "custom": {
                            "type": 'http',
                            "metadata": {
                                "concurrentRequests": '50'
                            }
                        }
                    }]
            };
            const networkConfig = {
                dapr: currentAppProperty.configuration.dapr,
                ingress: ingressConfig,
                activeRevisionsMode: "Multiple"
            };
            if (ingressConfig.external == false || ingressConfig.external == undefined) {
                delete networkConfig.ingress;
            }
            const containerConfig = [
                {
                    "name": taskParams.containerAppName,
                    "image": taskParams.imageName
                }
            ];
            const containerAppEnvelope = {
                configuration: networkConfig,
                location: currentAppProperty.location,
                managedEnvironmentId: currentAppProperty.managedEnvironmentId,
                template: {
                    containers: containerConfig,
                    scale: scaleConfig,
                    revisionSuffix: taskParams.revisionNameSuffix
                }
            };
            console.log("Deployment Step Started");
            // update
            yield client.containerApps.beginUpdateAndWait(taskParams.resourceGroup, taskParams.containerAppName, containerAppEnvelope);
            // check if added revision is included in revision list
            const addedRevision = yield client.containerAppsRevisions.getRevision(taskParams.resourceGroup, taskParams.containerAppName, `${taskParams.containerAppName}--${taskParams.revisionNameSuffix}`);
            if (!addedRevision)
                throw new Error(`Failed to add revision ${taskParams.containerAppName}--${taskParams.revisionNameSuffix}.`);
            if (ingressConfig.external == true && addedRevision.fqdn) {
                const appUrl = "https://" + addedRevision.fqdn + "/";
                core.setOutput("app-url", appUrl);
                console.log("Your App has been deployed at: " + appUrl);
            }
            console.log("Deployment Succeeded");
        }
        catch (error) {
            console.log("Deployment Failed with Error: " + error);
            core.setFailed(error);
        }
        finally {
            // Reset AZURE_HTTP_USER_AGENT.
            core.exportVariable('AZURE_HTTP_USER_AGENT', prefix);
        }
    });
}
function deactivateRevision(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { client, resourceGroup, containerAppName, traffic, revisionName } = params;
        const targetRevisions = traffic.filter((r) => r.revisionName === revisionName);
        // Check traffic weight of the target revision
        if (targetRevisions.length > 0 && targetRevisions.reduce((prev, curr) => prev + curr.weight, 0) !== 0)
            throw new Error(`Traffic weight of revision ${revisionName} under container app ${containerAppName} is not 0. Set 0 to the traffic weight of the revision before deactivation.`);
        console.log("Deactivation Step Started");
        yield client.containerAppsRevisions.deactivateRevision(resourceGroup, containerAppName, revisionName);
        // check if revision's status is deactived
        const deactiveRevision = yield client.containerAppsRevisions.getRevision(resourceGroup, containerAppName, revisionName);
        if (deactiveRevision.active) {
            throw new Error(`The revision ${revisionName} under container app ${containerAppName} can't be deactivated. Check the Azure Portal for details.`);
        }
        else {
            console.log("Deactivation Step Succeeded");
        }
    });
}
main();
//# sourceMappingURL=main.js.map