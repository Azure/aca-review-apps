import * as core from "@actions/core";
import * as crypto from "crypto";
import { ContainerAppsAPIClient, ContainerApp } from "@azure/arm-appcontainers";
import { TokenCredential, DefaultAzureCredential } from "@azure/identity";

import { TaskParameters } from "./taskparameters";

var prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";

async function main() {

// Please refer to this sample code
// https://github.com/Azure/azure-sdk-for-js/blob/32c07776aa91c302fb2c90ba65e3bb4668b5a792/sdk/appcontainers/arm-appcontainers/samples-dev/containerAppsCreateOrUpdateSample.ts

  try {
    // Set user agent variable.
    let usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
    let actionName = 'DeployAzureContainerApp';
    let userAgentString = (!!prefix ? `${prefix}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
    core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);

    var taskParams = TaskParameters.getTaskParams();
    let credential: TokenCredential = new DefaultAzureCredential()

    // TBD: Need to get subscriptionId not from taskParams, but from credential.
    let subscriptionId = taskParams.subscriptionId

    console.log("Predeployment Steps Started");
    const client = new ContainerAppsAPIClient(credential, taskParams.subscriptionId);

    // Set up a Dapr configuration
    // TBD: Determine what is required and what is optional for each condition and set them appropriately.
    //      For now, it''s off if they don't have everything in place.
    const daprConfig = (taskParams.daprEnabled && taskParams.daprAppPort && taskParams.daprAppProtocol) ? {
      appPort: taskParams.daprAppPort, appProtocol: taskParams.daprAppProtocol, enabled: taskParams.daprEnabled
    } : {
      // If any one of these is missing, leave it empty.
    };

    // Set up an ingress configuration
    // TBD: Determine what is required and what is optional for each condition and set them appropriately.
    //      For now, it's off if they don't have everything in place.
    const ingresConfig = (taskParams.ingressExternal && taskParams.ingressTargetPort && taskParams.ingressTraffic && taskParams.ingressCustomDomains) ? {
      external: taskParams.ingressExternal, 
      targetPort: taskParams.ingressTargetPort, 
      traffic: taskParams.ingressTraffic, 
      customDomains: taskParams.ingressCustomDomains
    } : {
      // If any one of these is missing, leave it empty.
    }

    let networkConfig = {
      //"dapr": daprConfig,
      //"ingress": ingresConfig
    }

    // Set up a scaling setting
    let scaleRules = taskParams.scaleRules

    const scaleConfig = {
      maxReplicas: taskParams.scaleMaxReplicas, 
      minReplicas: taskParams.scaleMinReplicas, 
      rules: scaleRules 
    }

    // TBD: Find a way to get a value instead of json
    const containersConfig = taskParams.containersConfig

    const containerAppEnvelope: ContainerApp = {
      configuration: networkConfig,
      location: taskParams.location,
      managedEnvironmentId:
        `/subscriptions/${subscriptionId}/resourceGroups/${taskParams.resourceGroup}/providers/Microsoft.App/managedEnvironments/${taskParams.managedEnvironmentName}`,
      template: {
        containers: containersConfig,
        scale: scaleConfig
      }
    };

    console.log("Deployment Step Started");

    let containerAppDeploymentResult = await client.containerApps.beginCreateOrUpdateAndWait(
      taskParams.resourceGroup,
      taskParams.containerAppName,
      containerAppEnvelope,
    );

    // TBD: Need to prettify the output.
    console.log("Deployment Succeeded\n\n" + containerAppDeploymentResult);
  }
  catch (error: string | any) {
    console.log("Deployment Failed with Error: " + error);
    core.setFailed(error);
  }
  finally {
    // Reset AZURE_HTTP_USER_AGENT.
    core.exportVariable('AZURE_HTTP_USER_AGENT', prefix);
  }
}

main();