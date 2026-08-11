# Azure Deployment Guide - SSR-Enabled Express React TypeScript App

## Overview
This guide covers deploying the SSR-enabled Express React TypeScript application to Azure cloud services.

## Deployment Options

### Option 1: Azure Static Web Apps (Recommended for Hybrid SSR)

Azure Static Web Apps with managed functions provides a cost-effective solution for SSR.

#### Prerequisites
- Azure CLI installed
- Azure subscription
- GitHub repository (for CI/CD)

#### Steps

1. **Prepare the application**
   ```bash
   npm install
   npm run build
   ```

2. **Create Azure Static Web App**
   ```bash
   az staticwebapp create \
     --name my-ssr-app \
     --resource-group my-resource-group \
     --source https://github.com/username/repo \
     --location "East US 2" \
     --branch main \
     --app-location "/" \
     --output-location "dist" \
     --api-location "server"
   ```

3. **Configure Application Settings**
   ```bash
   az staticwebapp appsettings set \
     --name my-ssr-app \
     --setting-names \
       NODE_ENV=production \
       SSR_ENABLED=true \
       PORT=8050
   ```

4. **Deploy**
   - Push to GitHub main branch
   - GitHub Actions will automatically build and deploy

#### Configuration Files
- `staticwebapp.config.json` - Static Web Apps configuration
- `.env.azure.template` - Environment variables template

---

### Option 2: Azure Container Apps (Full SSR Support)

Azure Container Apps provides full control over the SSR implementation.

#### Prerequisites
- Docker installed
- Azure CLI with Container Apps extension
- Azure Container Registry

#### Steps

1. **Create Dockerfile** (if not exists)
   ```dockerfile
   FROM node:16-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   RUN npm run server:compile
   
   EXPOSE 8050
   
   CMD ["node", "server/index.js"]
   ```

2. **Build and push container**
   ```bash
   # Login to Azure
   az login
   
   # Create container registry
   az acr create \
     --resource-group my-resource-group \
     --name myregistry \
     --sku Basic
   
   # Build and push
   az acr build \
     --registry myregistry \
     --image express-react-ssr:latest \
     .
   ```

3. **Create Container App**
   ```bash
   az containerapp create \
     --name my-ssr-app \
     --resource-group my-resource-group \
     --environment my-environment \
     --image myregistry.azurecr.io/express-react-ssr:latest \
     --target-port 8050 \
     --ingress external \
     --env-vars \
       NODE_ENV=production \
       SSR_ENABLED=true \
       PORT=8050
   ```

4. **Configure scaling**
   ```bash
   az containerapp update \
     --name my-ssr-app \
     --resource-group my-resource-group \
     --min-replicas 1 \
     --max-replicas 10
   ```

---

### Option 3: Azure App Service (Traditional Hosting)

Azure App Service provides a managed platform for Node.js applications.

#### Steps

1. **Create App Service Plan**
   ```bash
   az appservice plan create \
     --name my-app-plan \
     --resource-group my-resource-group \
     --sku B1 \
     --is-linux
   ```

2. **Create Web App**
   ```bash
   az webapp create \
     --name my-ssr-app \
     --resource-group my-resource-group \
     --plan my-app-plan \
     --runtime "NODE|16-lts"
   ```

3. **Configure Application Settings**
   ```bash
   az webapp config appsettings set \
     --name my-ssr-app \
     --resource-group my-resource-group \
     --settings \
       NODE_ENV=production \
       SSR_ENABLED=true \
       PORT=8050 \
       WEBSITE_NODE_DEFAULT_VERSION=16-lts
   ```

4. **Deploy from GitHub**
   ```bash
   az webapp deployment source config \
     --name my-ssr-app \
     --resource-group my-resource-group \
     --repo-url https://github.com/username/repo \
     --branch main \
     --manual-integration
   ```

5. **Configure startup command**
   ```bash
   az webapp config set \
     --name my-ssr-app \
     --resource-group my-resource-group \
     --startup-file "npm start"
   ```

---

## Post-Deployment Configuration

### 1. Environment Variables

Set these in Azure Portal or via CLI:

```bash
NODE_ENV=production
SSR_ENABLED=true
SSR_CACHE_ENABLED=true
SSR_CACHE_TTL=600
PORT=8050
MONGODB_URI=<your-cosmos-db-connection-string>
```

### 2. Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name my-ssr-app \
  --resource-group my-resource-group \
  --hostname www.example.com

# Enable HTTPS
az webapp config ssl bind \
  --name my-ssr-app \
  --resource-group my-resource-group \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI
```

### 3. Application Insights (Monitoring)

```bash
# Create Application Insights
az monitor app-insights component create \
  --app my-ssr-app-insights \
  --location eastus \
  --resource-group my-resource-group

# Get instrumentation key
az monitor app-insights component show \
  --app my-ssr-app-insights \
  --resource-group my-resource-group \
  --query instrumentationKey

# Set in app settings
az webapp config appsettings set \
  --name my-ssr-app \
  --resource-group my-resource-group \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=<key>
```

### 4. Database Configuration

For MongoDB, use Azure Cosmos DB:

```bash
# Create Cosmos DB account
az cosmosdb create \
  --name my-cosmos-db \
  --resource-group my-resource-group \
  --kind MongoDB

# Get connection string
az cosmosdb keys list \
  --name my-cosmos-db \
  --resource-group my-resource-group \
  --type connection-strings

# Set in app settings
az webapp config appsettings set \
  --name my-ssr-app \
  --resource-group my-resource-group \
  --settings MONGODB_URI=<connection-string>
```

---

## Verification

### 1. Check SSR is Working

```bash
# Test the deployed app
curl -I https://my-ssr-app.azurewebsites.net/

# Check for SSR meta tags
curl https://my-ssr-app.azurewebsites.net/ | grep "ssr-enabled"
```

### 2. Monitor Logs

```bash
# Stream logs
az webapp log tail \
  --name my-ssr-app \
  --resource-group my-resource-group

# Download logs
az webapp log download \
  --name my-ssr-app \
  --resource-group my-resource-group
```

### 3. Performance Testing

```bash
# Test response time
curl -w "@curl-format.txt" -o /dev/null -s https://my-ssr-app.azurewebsites.net/

# Load testing with Azure Load Testing
az load test create \
  --name my-load-test \
  --resource-group my-resource-group \
  --test-plan-file loadtest.yaml
```

---

## Troubleshooting

### Common Issues

1. **App not starting**
   - Check Node.js version: `az webapp config show`
   - Verify startup command: `az webapp config show --query linuxFxVersion`
   - Check logs: `az webapp log tail`

2. **SSR not working**
   - Verify `SSR_ENABLED=true` in app settings
   - Check build output includes `dist/index.html`
   - Review application logs for SSR errors

3. **Performance issues**
   - Enable SSR caching: `SSR_CACHE_ENABLED=true`
   - Scale up App Service plan
   - Use Azure CDN for static assets

4. **Database connection errors**
   - Verify Cosmos DB connection string
   - Check firewall rules allow Azure services
   - Test connection from Azure Cloud Shell

---

## Cost Optimization

1. **Use appropriate tier**
   - Static Web Apps: Free tier for small apps
   - Container Apps: Pay-per-use pricing
   - App Service: B1 tier for development, P1V2+ for production

2. **Enable caching**
   - Set `SSR_CACHE_ENABLED=true`
   - Use Azure CDN for static assets
   - Configure browser caching headers

3. **Auto-scaling**
   - Configure scale rules based on CPU/memory
   - Set minimum replicas to 0 for dev environments
   - Use Azure Front Door for global distribution

---

## Security Best Practices

1. **Enable HTTPS only**
   ```bash
   az webapp update \
     --name my-ssr-app \
     --resource-group my-resource-group \
     --https-only true
   ```

2. **Use Managed Identity**
   ```bash
   az webapp identity assign \
     --name my-ssr-app \
     --resource-group my-resource-group
   ```

3. **Configure CORS**
   ```bash
   az webapp cors add \
     --name my-ssr-app \
     --resource-group my-resource-group \
     --allowed-origins https://example.com
   ```

4. **Enable authentication**
   ```bash
   az webapp auth update \
     --name my-ssr-app \
     --resource-group my-resource-group \
     --enabled true \
     --action LoginWithAzureActiveDirectory
   ```

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Compile server
      run: npm run server:compile
    
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: my-ssr-app
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: .
```

---

## Support

For issues or questions:
- Azure Documentation: https://docs.microsoft.com/azure
- Azure Support: https://azure.microsoft.com/support
- Application Issues: Check application logs and SSR_AZURE_README.md

---

## Next Steps

1. Set up monitoring with Application Insights
2. Configure custom domain and SSL
3. Implement CDN for static assets
4. Set up automated backups
5. Configure disaster recovery
6. Implement blue-green deployment strategy
