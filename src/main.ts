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

    // TBD: Remove key when there is key without value
    const daprConfig: {
      appPort?: number,
      appProtocol?: string,
      enabled: boolean
    } = {
      appPort: taskParams.daprAppPort, 
      appProtocol: taskParams.daprAppProtocol, 
      enabled: taskParams.daprEnabled
    };
    if (isNaN(taskParams.daprAppPort)) {
      delete daprConfig.appPort
    };
    if (taskParams.daprAppProtocol == "") {
      delete daprConfig.appProtocol
    };

    // TBD: Remove key when there is key without value
    const ingresConfig: {
      external: boolean,
      targetPort?: number,
      traffic?: any[],
      customDomains?: any[]
    } = {
      external: taskParams.ingressExternal, 
      targetPort: taskParams.ingressTargetPort, 
      // traffic: taskParams.ingressTraffic, 
      // customDomains: taskParams.ingressCustomDomains
    };
    if (taskParams.ingressTraffic.length == 0) {
      delete ingresConfig.traffic
    };

    let scaleRules = taskParams.scaleRules
    // TBD: Remove key when there is key without value
    const scaleConfig: {
      maxReplicas: number,
      minReplicas: number,
      rules: any[]
    } = {
      maxReplicas: taskParams.scaleMaxReplicas, 
      minReplicas: taskParams.scaleMinReplicas, 
      rules: scaleRules 
    };

    let networkConfig: {
      dapr: object,
      ingress?: object
    } = {
      dapr: daprConfig,
      ingress: ingresConfig
    };
    if (taskParams.ingressExternal == false) {
      delete networkConfig.ingress
    };

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