# GitHub Action for Creating Azure Container App Revision

[GitHub Actions](https://help.github.com/en/articles/about-github-actions) provides the flexibility to build automated workflows for the software development lifecycle.

**aca-review-app** can be used to automate the workflow of creating a new revision of [Azure Container App](https://azure.microsoft.com/en-us/services/container-apps/) for review.
This action runs the code contained in the GitHub pull request as an app in the Container App. The review application is then created as a new revision with a Weight of 0, each with a unique URL that can be shared. This is a great way to review and test code changes. This action allows deactivating an app for review that has been created, triggered by the close of a pull request.

<img width="640" alt="image" src="https://user-images.githubusercontent.com/15963767/195657236-54a6af81-61a2-4638-81c9-5e2313ddd6ed.png">

**aca-review-app** can also be configured to launch automatically with each pull request. By integrating with other github actions, it is also possible not only to create revisions, but also to comment the URL of the created revision in a pull request. For more information, please refer to the [eample workflow](./example/).

Let's get started today with a [free Azure account](https://azure.com/free/open-source)!

The definition of this GitHub Action is in [action.yml](./action.yml).

## End-to-End Sample Workflows

The **[```example/```](./example/)** in this repository contains a sample project to get started. Please read the hands-on documentation and start building.

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

### Integration to leave comments on Pull Request

#### Sample Snipet for the Review Revision Creation

You can pass the app URL for review to subsequent actions as follows.

```yaml
- name: Add revision to ACA
  uses: Azure/aca-review-apps@v0.2.0
  id: aca_new_revision
  with:
    resource-group: <YOUR_RESOURCE_GROUP>
    name: <YOUR_CONTAINER_APP_NAME>
    revision-name-suffix: <SHORT_HASH>
    image: <YOUR_CONTAINER_IMAGE>

- name: add new comment to PR
  uses: peter-evans/create-or-update-comment@v2
  with:
    issue-number: ${{ github.event.pull_request.number }}
    body: |
      Revision ${{ env.CONTAINERAPP_NAME }}--${{ env.SHORT_HASH }} is created.
      ${{ steps.aca_new_revision.outputs.app-url }}
```

#### Sample Snipet for the Review Revision Deactivation

This action can also automatically deactivate revisions.
However, this flow must be triggered only when the pull request is closed. For more information, see the [sample](./example/) implementation.

```yaml
- name: Deactivate Preview revision on ACA
  uses: Azure/aca-review-apps@v0.2.0
  with:
    resource-group: <YOUR_RESOURCE_GROUP>
    name: <YOUR_CONTAINER_APP_NAME>
    revision-name-suffix: <SHORT_HASH>
    image: <YOUR_CONTAINER_IMAGE>
    deactivate-revision-mode: true #IMPORTANT!!

- name: Find Comment
  uses: peter-evans/find-comment@v2
  id: fc
  with:
    issue-number: ${{ github.event.pull_request.number }}
    comment-author: "github-actions[bot]"
    body-includes: Revision ${{ env.CONTAINERAPP_NAME }}--${{ env.SHORT_HASH }} is created.

- name: add new comment to PR
  if: steps.fc.outputs.comment-id != ''
  uses: peter-evans/create-or-update-comment@v2
  with:
    comment-id: ${{ steps.fc.outputs.comment-id }}
    edit-mode: replace
    body: |
      Revision ${{ env.CONTAINERAPP_NAME }}--${{ env.SHORT_HASH }} is deactivated.
```

### How to Develop/Test this Action

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
