import * as core from "@actions/core";
import * as crypto from "crypto";
import fs from 'fs'
import YAML from 'yaml'
import { ContainerAppsAPIClient, ContainerApp } from "@azure/arm-appcontainers";
import { TokenCredential, DefaultAzureCredential } from "@azure/identity";
import { AuthorizerFactory } from "azure-actions-webclient/AuthorizerFactory";
import { IAuthorizer } from "azure-actions-webclient/Authorizer/IAuthorizer";

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

    let endpoint: IAuthorizer = await AuthorizerFactory.getAuthorizer();
    var taskParams = TaskParameters.getTaskParams(endpoint);
    let credential: TokenCredential = new DefaultAzureCredential()

    console.log("Predeployment Steps Started");
    const client = new ContainerAppsAPIClient(credential, taskParams.subscriptionId);

    const parametersFile = fs.readFileSync('./src/parameters.yml', 'utf8')
    const parameters = YAML.parse(parametersFile)

    // TBD: Remove key when there is key without value
    const daprConfig: {
      appPort?: number,
      appProtocol?: string,
      enabled: boolean
    } = {
      appPort: parameters["dapr-app-port"],
      appProtocol: parameters["dapr-app-protocol"],
      enabled: parameters["dapr-enabled"]
    }
    if (parameters["dapr-app-port"] == undefined) {
      delete daprConfig.appPort
    }
    if (parameters["dapr-app-protocol"] == undefined) {
      delete daprConfig.appProtocol
    }

    // TBD: Remove key when there is key without value
    const ingresConfig: {
      external: boolean,
      targetPort?: number,
      traffic?: any[],
      customDomains?: any[]
    } = {
      external: parameters["ingress-external"],
      targetPort: parameters["ingress-target-port"],
      traffic: parameters["ingress-traffic-json"],
      customDomains: parameters["ingress-custom-domains-json"]
    }
    if (parameters["ingress-traffic-json"] == undefined) {
      delete ingresConfig.traffic
    }

    // TBD: Remove key when there is key without value
    const scaleConfig: {
      maxReplicas: number,
      minReplicas: number,
      rules: any[]
    } = {
      maxReplicas: parameters["scale-max-replicas"],
      minReplicas: parameters["scale-min-replicas"],
      rules: parameters["scale-rules-json"]
    }

    let networkConfig: {
      dapr: object,
      ingress?: object
    } = {
      dapr: daprConfig,
      ingress: ingresConfig
    }
    if (parameters["ingress-external"] == false || parameters["ingress-external"] == undefined) {
      delete networkConfig.ingress
    }

    // TBD: Find a way to get a value instead of json
    const containesrConfigFile = fs.readFileSync(taskParams.containersConfigPath, 'utf8');
    const containersConfig = YAML.parse(containesrConfigFile);
    let selectedContainerConfig;
    containersConfig.forEach((containerConfig: any) => {
      if (containerConfig.name == "acatest1") {
        selectedContainerConfig = [containerConfig]
      }
    });

    const containerAppEnvelope: ContainerApp = {
      configuration: networkConfig,
      location: parameters["location"],
      managedEnvironmentId:
        `/subscriptions/${taskParams.subscriptionId}/resourceGroups/${taskParams.resourceGroup}/providers/Microsoft.App/managedEnvironments/${parameters["managed-environment-name"]}`,
      template: {
        containers: selectedContainerConfig,
        scale: scaleConfig
      }
    };

    console.log("Deployment Step Started");

    let containerAppDeploymentResult = await client.containerApps.beginCreateOrUpdateAndWait(
      taskParams.resourceGroup,
      taskParams.containerAppName,
      containerAppEnvelope,
    );

    if (containerAppDeploymentResult.provisioningState == "Succeeded") {
      console.log("Deployment Succeeded");

      if (ingresConfig.external == true) {
        let appUrl = "http://"+containerAppDeploymentResult.latestRevisionFqdn+"/"
        core.setOutput("app-url", appUrl);
        console.log("Your App has been deployed at: "+appUrl);
      }
    } else {
      core.debug("Deployment Result: "+containerAppDeploymentResult);
      throw Error("Container Deployment Failed"+containerAppDeploymentResult);
    }
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