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
const taskparameters_1 = require("./taskparameters");
var prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Please refer to this sample code
        // https://github.com/Azure/azure-sdk-for-js/blob/32c07776aa91c302fb2c90ba65e3bb4668b5a792/sdk/appcontainers/arm-appcontainers/samples-dev/containerAppsCreateOrUpdateSample.ts
        try {
            // Set user agent variable.
            let usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
            let actionName = 'DeployAzureContainerApp';
            let userAgentString = (!!prefix ? `${prefix}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
            core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);
            var taskParams = taskparameters_1.TaskParameters.getTaskParams();
            let credential = new identity_1.DefaultAzureCredential();
            // TBD: Need to get subscriptionId not from taskParams, but from credential.
            let subscriptionId = taskParams.subscriptionId;
            console.log("Predeployment Steps Started");
            const client = new arm_appcontainers_1.ContainerAppsAPIClient(credential, taskParams.subscriptionId);
            // Set up a Dapr configuration
            // TBD: Determine what is required and what is optional for each condition and set them appropriately.
            //      For now, it''s off if they don't have everything in place.
            const daprConfig = {
                appPort: taskParams.daprAppPort,
                appProtocol: taskParams.daprAppProtocol,
                enabled: taskParams.daprEnabled
            };
            // Set up an ingress configuration
            // TBD: Determine what is required and what is optional for each condition and set them appropriately.
            //      For now, it's off if they don't have everything in place.
            const ingresConfig = {
                external: taskParams.ingressExternal,
                targetPort: taskParams.ingressTargetPort,
                // traffic: taskParams.ingressTraffic, 
                // customDomains: taskParams.ingressCustomDomains
            };
            let networkConfig = {
                "dapr": daprConfig,
                "ingress": ingresConfig
            };
            // Set up a scaling setting
            let scaleRules = taskParams.scaleRules;
            const scaleConfig = {
                maxReplicas: taskParams.scaleMaxReplicas,
                minReplicas: taskParams.scaleMinReplicas,
                rules: scaleRules
            };
            // TBD: Find a way to get a value instead of json
            const containersConfig = taskParams.containersConfig;
            const containerAppEnvelope = {
                configuration: networkConfig,
                location: taskParams.location,
                managedEnvironmentId: `/subscriptions/${subscriptionId}/resourceGroups/${taskParams.resourceGroup}/providers/Microsoft.App/managedEnvironments/${taskParams.managedEnvironmentName}`,
                template: {
                    containers: containersConfig,
                    scale: scaleConfig
                }
            };
            console.log("Deployment Step Started");
            let containerAppDeploymentResult = yield client.containerApps.beginCreateOrUpdateAndWait(taskParams.resourceGroup, taskParams.containerAppName, containerAppEnvelope);
            // TBD: Need to prettify the output.
            console.log("Deployment Succeeded\n\n" + containerAppDeploymentResult);
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
main();
