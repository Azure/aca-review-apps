# (Experimental) GitHub Action for Azure Container App

> :warning: **NOTE**: This repository has just been created and is not guaranteed to work. It also contains some sample code inside. Therefore, it has not yet been published to the marketplace. Please do not use this one in a production environment. Contributions are welcome. A beta version will be released at the end of September.

[GitHub Actions](https://help.github.com/en/articles/about-github-actions) provides the flexibility to build automated workflows for the software development lifecycle.

GitHub Actions can be used to automate the workflow of deploying to [Azure Container App](https://azure.microsoft.com/en-us/services/container-apps/).

Let's get started today with a [free Azure account](https://azure.com/free/open-source)!

This repository contains to deploy to Azure Container App. It supports deploying your container image to an Azure Container App.

This repository contains the [GitHub Action for Deploying to Azure Container App](./action.yml).

The definition of this GitHub Action is in [action.yml](./action.yml).

## End-to-End Sample Workflows

### Dependencies on other GitHub Actions

* [Azure Login](https://github.com/Azure/login) Login with your Azure Credentials for Authentication. Once login is done, the next set of Azure Actions in the workflow can re-use the same session within the job.

### Azure Service Principal for RBAC

For using any credentials like Azure Service Principal in your workflow, add them as [secrets](https://help.github.com/en/articles/virtual-enivronments-for-github-actions#creating-and-using-secrets-encrypted-variables) in the GitHub Repository and then refer them in the workflow.

1. Download Azure CLI from [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest), run `az login` to login with your Azure Credentials.
2. Run Azure CLI command to create an [Azure Service Principal for RBAC](https://docs.microsoft.com/en-us/azure/role-based-access-control/overview):

  ```bash
      az ad sp create-for-rbac --name "myApp" --role contributor \
                               --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
                               --sdk-auth
      
      # Replace {subscription-id}, {resource-group} with the subscription, resource group details of the WebApp
      # The command should output a JSON object similar to this:
  
    {
      "clientId": "<GUID>",
      "clientSecret": "<GUID>",
      "subscriptionId": "<GUID>",
      "tenantId": "<GUID>",
      (...)
    }
  ```

  \* You can further scope down the Azure Credentials to the Web App using scope attribute. For example,

  ```bash
   az ad sp create-for-rbac --name "myApp" --role contributor \
                            --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Web/sites/{app-name} \
                            --sdk-auth

  # Replace {subscription-id}, {resource-group}, and {app-name} with the names of your subscription, resource group, and Azure Web App.
  ```

3. Paste the json response from above Azure CLI to your GitHub Repository > Settings > Secrets > Add a new secret > **AZURE_CREDENTIALS**

1. Now in the workflow file in your branch: `.github/workflows/workflow.yml` replace the secret in Azure login action with your secret (Refer to the example below)

### Build and Deploy a Node.JS App to Azure Container App

```yaml

on: [push]
name: Linux_Container_Workflow

SAMPLE WORKFLOW WILL BE HERE

```

### Example YAML Snippets

#### Deploying a Container from a public registry

```yaml
- name: 'Deploy to Azure Container Apps'
- uses: Azure/aca-deploy@v1
  with:
    resource-group: sample-rg
    name: yuhattor-test
    location: 'East US'
    managed-environment-name: 'my-container-env'
    dapr-app-port: 3000
    dapr-app-protocol: 'http'
    dapr-enabled: true
    ingress-external: true
    ingress-target-port: 3000
    ingress-traffic: ""

```

#### Samples Action 2

```yaml
- name: 'Sample yaml pipeline'
- uses: Azure/aca-deploy@v1
  with:

```

#### Samples Action 3

```yaml
- name: 'Sample yaml pipeline'
- uses: Azure/aca-deploy@v1
  with:

```

#### Samples Action 4

```yaml
- name: 'Sample yaml pipeline'
- uses: Azure/aca-deploy@v1
  with:

```

### How to develop/test this Action
#### Debug with breakpoints on Visual Studio Code
This action can be tried on not only GitHub Actions workflow but also your local PC or GitHub Codespaces.

If you use Visual Studio Code, debugging this action with breakpoints can be used by running [`Launch Program` configuration](./.vscode/launch.json#L10).
![image](https://user-images.githubusercontent.com/4566555/189843026-61153630-4151-4e6c-8a1e-16163aec0910.png)

#### Check workflow behavior without pushing to GitHub
Also, you can try to run your workflow with this action by executing [`npm run act`](./package.json#L8) on Visual Studio Code Remote-Container extension or GitHub Codespaces without pushing it to GitHub, because a devcontainer image for this repository includes `Docker-in-Docker` enabled devcontainer and `act`.

For more detail, refer to following links.
  - `Docker-in-Docker`: https://github.com/microsoft/vscode-dev-containers/blob/main/script-library/docs/docker-in-docker.md .
  - `act`: https://github.com/nektos/act

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

