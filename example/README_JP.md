# \[Azure/aca-review-apps\] ハンズオン手順書

## 準備

### 環境構築
このレポジトリをフォークするか，クローンして以下の手順で自分のレポジトリを作成

```bash
cp -rf sample-project <適切な場所>
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin <自分のレポジトリURL>
git push -u origin main
```

### ログイン

```bash
az login
```

### 環境変数設定

```bash
SUBSCRIPTION_ID="サブスクリプションID"
RESOURCE_GROUP="リソースグループ名"
LOCATION="リソースロケーション"
CONTAINERAPPS_ENVIRONMENT="Container Apps環境名"
CONTAINER_APP_NAME="コンテナーアプリ名"
CONTAINER_REGISTRY="コンテナレジストリ名"
REPOSITORY_NAME="レポジトリ名"
SERVICE_PRINCIPAL_NAME="サービスプリンシパル名"
```

### リソースグループ作成

```bash
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### ACRインスタンス作成

```bash
az acr create --resource-group $RESOURCE_GROUP --name $CONTAINER_REGISTRY --sku Basic --admin-enabled true
```

### ACRログイン

```bash
az acr login --name $CONTAINER_REGISTRY
```

### イメージをビル＆タグつける

```bash
docker build -t $REPOSITORY_NAME .
docker tag $REPOSITORY_NAME $CONTAINER_REGISTRY.azurecr.io/$REPOSITORY_NAME:v1
```

### DockerイメージをACRにpush

```bash
docker push $CONTAINER_REGISTRY.azurecr.io/$REPOSITORY_NAME:v1
```

### コンテナーアプリ環境作成

```bash
az containerapp env create \
  --name $CONTAINERAPPS_ENVIRONMENT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

### コンテナーアプリ作成

```bash
az containerapp create \
  --image $CONTAINER_REGISTRY.azurecr.io/$REPOSITORY_NAME:v1 \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINERAPPS_ENVIRONMENT \
  --ingress external \
  --target-port 80
```

## aca-review-appsを仕様したプレビューデプロイ自動化

### サービスプリンシパルを発行

```bash
az ad sp create-for-rbac --name $SERVICE_PRINCIPAL_NAME \  
                         --role contributor \
                         --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP
```

### GitHubシークレットを作成

| シークレット名 | 値 |
| ---- | ---- |
| AZURE_CREDENTIALS | サービスプリンシパル |
| CONTAINER_REGISTRY_PASSWORD | ACRユーザ名 |
| CONTAINER_REGISTRY_USERNAME | ACRパスワード |

### ワークフローを定義

[サンプルワークフロー](./.github/workflows/build-deploy-deactivate-revision.yml)内の環境変数を自分用に修正

- CONTAINER_REGISTRY
- RESOURCE_GROUP_NAME
- CONTAINERAPP_NAME

### mainブランチへpush

```bash
git add .
git commit -m "hoge"
git push origin main
```

## 実際に体験

1. 適当なブランチを切って，適当なコミット（e.g. コメントアウト）をしてpush
2. mainに対してPRを立てる
   1. アクションが正常に動作し，PRのコメントにプレビューURLが貼られることを確認
   2. Azure Potal上でトラフィック0のリビジョンが発行されていることを確認
3. PRをマージしcloseする
   1. アクションが正常に動作し，PRのコメントが更新されていることを確認
   2. Azure Portal上で作成したリビジョンがデアクティブになっていることを確認

## リソースのクリーンアップ

```bash
az group delete --name $RESOURCE_GROUP
```
