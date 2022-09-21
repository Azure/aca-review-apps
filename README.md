# GitHub Action for Creating Azure Container App Revision

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

#### Basic sample to create a revision

```yaml
on: [push, pull_request]
name: Preview Deployment
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    env:
      RESOURCE_GROUP: <YOUR_RESOURCE_GROUP_NAME>
      CONTAINER_APP_NAME: <YOUR_CONTAINER_APP_NAME>
      DOCKER_IMAGE_NAME: <YOUR_DOCKER_IMAGE_NAME>
      # REVISION_NAME_SUFFIX: <YOUR_REVISION_NAME_SUFFIX> # Optional: Default is github commit hash
    steps:
    - name: 'Checkout GitHub Action'
      uses: actions/checkout@master
    - name: 'Login via Azure CLI'
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    - name: 'Create a new Container App revision'
      uses: azure/aca-preview@v0.1
      with:
        resource-group: ${{ env.RESOURCE_GROUP }}
        name: ${{ env.CONTAINER_APP_NAME }}
        image: ${{ env.DOCKER_IMAGE_NAME }}
```

##### Using customize suffice instead of git commit hash

```yaml
- name: 'Create a new Container App revision'
  uses: azure/aca-preview@v0.1
  with:
    resource-group: ${{ env.RESOURCE_GROUP }}
    name: ${{ env.CONTAINER_APP_NAME }}
    image: ${{ env.DOCKER_IMAGE_NAME }}
    revision-name-suffix: ${{ env.REVISION_NAME_SUFFIX }} 
  with:
```

#### Create and Deactivate an action

```yaml
on: [push, pull_request]
name: Preview Deployment
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    env:
      RESOURCE_GROUP: <YOUR_RESOURCE_GROUP_NAME>
      CONTAINER_APP_NAME: <YOUR_CONTAINER_APP_NAME>
      DOCKER_IMAGE_NAME: <YOUR_DOCKER_IMAGE_NAME>
    steps:
    - name: 'Checkout GitHub Action'
      uses: actions/checkout@master
    - name: 'Login via Azure CLI'
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    # Revision Creation
    - name: 'Create a new Container App revision'
      uses: azure/aca-preview@v0.1
      with:
        resource-group: ${{ env.RESOURCE_GROUP }}
        name: ${{ env.CONTAINER_APP_NAME }}
        image: ${{ env.DOCKER_IMAGE_NAME }}
    # Revision Deactivation
    - name: Deactivate Preview Deployment
        if: github.event.action == 'closed'
        uses: azure/aca-preview@v0.0.1
        with:
          deactivate-revision-mode: ture
          resource-group: ${{ env.RESOURCE_GROUP }}
          name: ${{ env.CONTAINER_APP_NAME }}
          image: ${{ env.DOCKER_IMAGE_NAME }}
```

### How to develop/test this Action

#### Debug with breakpoints on Visual Studio Code

This action can be tried on not only GitHub Actions workflow but also your local PC or GitHub Codespaces.

If you use Visual Studio Code, debugging this action with breakpoints can be used by running [`Launch Program` configuration](./.vscode/launch.json#L10).
![image](https://user-images.githubusercontent.com/4566555/189843026-61153630-4151-4e6c-8a1e-16163aec0910.png)

#### Check workflow behavior without pushing to GitHub

Also, you can try to run your workflow with this action by executing [`npm run act`](./package.json#L8) on Visual Studio Code Remote-Container extension or GitHub Codespaces without pushing it to GitHub, because a devcontainer image for this repository includes `Docker-in-Docker` enabled devcontainer and `act`.

For more detail, refer to following links.

* `Docker-in-Docker`: <https://github.com/microsoft/vscode-dev-containers/blob/main/script-library/docs/docker-in-docker.md> .
* `act`: <https://github.com/nektos/act>

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit <https://cla.opensource.microsoft.com>.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
