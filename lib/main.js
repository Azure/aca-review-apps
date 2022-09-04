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
            // Sample: 
            //      customDomains: [{name: "www.my-name.com", bindingType: "SniEnabled", certificateId: "/subscriptions/a4deccb1-a1f6-40cb-a923-f55a7d22c32d/resourceGroups/rg/providers/Microsoft.App/managedEnvironments/demokube/certificates/my-certificate-for-my-name-dot-com", }, ],
            const daprConfig = (taskParams.daprEnabled && taskParams.daprAppPort && taskParams.daprAppProtocol) ? {
                appPort: taskParams.daprAppPort, appProtocol: taskParams.daprAppProtocol, enabled: taskParams.daprEnabled
            } : {
            // If any one of these is missing, leave it empty.
            };
            // Set up an ingress configuration
            // TBD: Determine what is required and what is optional for each condition and set them appropriately.
            //      For now, it''s off if they don't have everything in place.
            // Sample: 
            //      traffic: [ { label: "production", revisionName: "testcontainerApp0-ab1234", weight: 100 } ]
            // TBD: Need to decide how to represent the associative array
            //      For now, it's a default payload
            const ingresConfig = (taskParams.ingressExternal && taskParams.ingressTargetPort && taskParams.ingressTraffic && taskParams.ingressCustomDomains) ? {
                external: taskParams.ingressExternal,
                targetPort: taskParams.ingressTargetPort,
                traffic: taskParams.ingressTraffic,
                customDomains: taskParams.ingressCustomDomains
            } : {
            // If any one of these is missing, leave it empty.
            };
            // Set up a container probes
            // TBD: Determine what is required and what is optional for each condition and set them appropriately.
            //      For now, it's a default payload
            let containerProbes = [
                {
                    type: "Liveness",
                    httpGet: {
                        path: "/health",
                        httpHeaders: [{ name: "Custom-Header", value: "Awesome" }],
                        port: 8080
                    },
                    initialDelaySeconds: 3,
                    periodSeconds: 3
                }
            ];
            // Set up a scaling setting
            // TBD: Need to get rules from taskParams. For now, it's a default payload
            // rules = taskParams.scalingRules
            const scaleRules = [{ name: "httpscalingrule", custom: { type: "http", metadata: { concurrentRequests: "50" } } }];
            const scaleConfig = {
                maxReplicas: taskParams.scaleMaxReplicas,
                minReplicas: taskParams.scaleMinReplicas,
                rules: scaleRules
            };
            const containerAppEnvelope = {
                configuration: {
                    dapr: daprConfig,
                    // If the key is defined, key shouldn't be empty. So I commented out this line once.
                    // ingress: ingresConfig
                },
                location: taskParams.location,
                managedEnvironmentId: `/subscriptions/${subscriptionId}/resourceGroups/${taskParams.resourceGroup}/providers/Microsoft.App/managedEnvironments/${taskParams.managedEnvironmentName}`,
                template: {
                    // This is a sample and is hard coded. It should be changed
                    containers: [
                        {
                            name: "simple-hello-world-container",
                            image: "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest",
                            probes: containerProbes,
                        }
                    ],
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
