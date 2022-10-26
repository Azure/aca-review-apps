# \[Azure/aca-review-apps\] Tryout!

## Preparation

### Build Environment

Fork or clone this repository and create your own repository as follows:

```bash
cp -rf sample-project <appropriate path>
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin <your-repository-url>
git push -u origin main
```

### Login to Azure CLI

```bash
az login
```

### Set Environment Variables

```bash
SUBSCRIPTION_ID="your-subscription-id"
RESOURCE_GROUP="your-resource-group-name"
LOCATION="your-rg-location"
CONTAINERAPPS_ENVIRONMENT="your-container-app-environment-name"
CONTAINER_APP_NAME="your-container-app-namae"
CONTAINER_REGISTRY="your-container-registry-name"
REPOSITORY_NAME="your-repository-name"
SERVICE_PRINCIPAL_NAME="your-service-principal-name"
```

### Create a resource group

```bash
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### Create a container registry

```bash
az acr create --resource-group $RESOURCE_GROUP --name $CONTAINER_REGISTRY --sku Basic --admin-enabled true
```

### Log in to registry

```bash
az acr login --name $CONTAINER_REGISTRY
```

### Build image and tag it

```bash
docker build -t $REPOSITORY_NAME .
docker tag $REPOSITORY_NAME $CONTAINER_REGISTRY.azurecr.io/$REPOSITORY_NAME:v1
```

### Push image to registry

```bash
docker push $CONTAINER_REGISTRY.azurecr.io/$REPOSITORY_NAME:v1
```

### Create an environment

```bash
az containerapp env create \
  --name $CONTAINERAPPS_ENVIRONMENT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

### Create a container app

```bash
az containerapp create \
  --image $CONTAINER_REGISTRY.azurecr.io/$REPOSITORY_NAME:v1 \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINERAPPS_ENVIRONMENT \
  --ingress external \
  --target-port 80
```

## Preview Deployment Automation using `aca-review-apps` action

### Create a service principa

```bash
az ad sp create-for-rbac --name $SERVICE_PRINCIPAL_NAME \  
                         --role contributor \
                         --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP
```

### Create GitHub secrets

| Secret Name | Value|
| ---- | ---- |
| AZURE_CREDENTIALS | your service principal |
| CONTAINER_REGISTRY_PASSWORD | your container registry user name |
| CONTAINER_REGISTRY_USERNAME | your container registry password |

### Create workflow file

Modify following environment variables in the [sample workflow](.github/workflows/build-deploy-deactivate-revision.yml) to your own values

- CONTAINER_REGISTRY
- RESOURCE_GROUP_NAME
- CONTAINERAPP_NAME

### Push code to main branch

```bash
git add .
git commit -m "update workflow file"
git push origin main
```

## Validate workflow

1. Create a new branch, commit and push
2. Open a Pull Request to main branch
   1. Confirm that the workflow has successfully run and that the revision URL for the preview is pasted in the comments of Pulll request.
   2. Also confirm in Azure Portal that a revision with a traffic weight of 0 has been issued.
3. Close Pull request
   1. Confirm that the workflow has successfully run and that the pull request comments have been updated
   2. Confirm that the revision you created is deactivated on Azure Portal as well.

## Clean up resources

```bash
az group delete --name $RESOURCE_GROUP
```
