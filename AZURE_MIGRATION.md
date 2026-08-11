# Azure Cloud Migration Guide

## Overview
This application has been updated to be fully compatible with Azure cloud deployment. The primary changes address cloud readiness issues related to file system dependencies and hardcoded paths.

## Key Changes Made

### 1. Webpack Configuration (webpack.config.js)
**Issue Fixed:** Rule cr-js-0003 - __dirname for Data Storage

**Changes:**
- Replaced `__dirname` with `process.cwd()` for dynamic path resolution
- Added environment variable support for output directory (`WEBPACK_OUTPUT_DIR`)
- Added configurable public path (`PUBLIC_PATH`)
- Made dev server port and API proxy target configurable via environment variables

**Before:**
```javascript
path: path.join(__dirname, outputDirectory)
```

**After:**
```javascript
path: path.resolve(process.cwd(), outputDirectory)
```

### 2. Azure Blob Storage Integration
**New File:** `src/server/utils/azureStorage.ts`

A comprehensive Azure Blob Storage service has been added to replace any local file system operations with cloud-native storage:

**Features:**
- Upload files to Azure Blob Storage
- Download files from Azure Blob Storage
- Check file existence
- Delete files
- List files with optional prefix filtering
- Generate SAS URLs for temporary access

**Usage Example:**
```typescript
import { uploadFile, downloadFile, fileExists } from './utils/azureStorage';

// Upload a file
await uploadFile('data/config.json', JSON.stringify(config));

// Download a file
const data = await downloadFile('data/config.json');

// Check if file exists
const exists = await fileExists('data/config.json');
```

### 3. Environment Configuration
**New File:** `.env.example`

A comprehensive environment configuration template has been added with:
- Azure Blob Storage connection settings
- Webpack build configuration
- Development server settings
- MongoDB/Cosmos DB configuration
- Azure-specific settings

## Deployment to Azure

### Prerequisites
1. Azure Storage Account for blob storage
2. Azure App Service or Azure Container Apps for hosting
3. Azure Cosmos DB with MongoDB API (optional, if using database)

### Configuration Steps

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure Azure Blob Storage:**
   - Create an Azure Storage Account
   - Get the connection string from Azure Portal
   - Update `AZURE_STORAGE_CONNECTION_STRING` in `.env`
   - Set `AZURE_STORAGE_CONTAINER_NAME` (default: 'app-data')

3. **Configure MongoDB (if using Cosmos DB):**
   - Create Azure Cosmos DB with MongoDB API
   - Get connection string from Azure Portal
   - Update MongoDB settings in `.env`

4. **Build the application:**
   ```bash
   npm install
   npm run build
   ```

5. **Deploy to Azure:**
   - Azure App Service: Use Azure CLI or GitHub Actions
   - Azure Container Apps: Build container and deploy
   - Ensure environment variables are set in Azure Portal

### Azure App Service Deployment

```bash
# Login to Azure
az login

# Create resource group
az group create --name myResourceGroup --location eastus

# Create App Service plan
az appservice plan create --name myAppServicePlan --resource-group myResourceGroup --sku B1 --is-linux

# Create web app
az webapp create --resource-group myResourceGroup --plan myAppServicePlan --name myapp --runtime "NODE|14-lts"

# Configure environment variables
az webapp config appsettings set --resource-group myResourceGroup --name myapp --settings \
  AZURE_STORAGE_CONNECTION_STRING="<your-connection-string>" \
  AZURE_STORAGE_CONTAINER_NAME="app-data" \
  NODE_ENV="production"

# Deploy code
az webapp deployment source config-zip --resource-group myResourceGroup --name myapp --src ./dist.zip
```

## Cloud-Native Features

### 1. Stateless Design
- No local file system dependencies for persistent data
- All persistent storage uses Azure Blob Storage
- Configuration via environment variables

### 2. 12-Factor App Compliance
- ✅ Codebase: Single codebase tracked in version control
- ✅ Dependencies: Explicitly declared in package.json
- ✅ Config: Stored in environment variables
- ✅ Backing Services: Attached resources (Azure Blob, Cosmos DB)
- ✅ Build, Release, Run: Separate stages
- ✅ Processes: Stateless and share-nothing
- ✅ Port Binding: Self-contained with configurable port
- ✅ Concurrency: Scale out via process model
- ✅ Disposability: Fast startup and graceful shutdown
- ✅ Dev/Prod Parity: Keep environments similar
- ✅ Logs: Treat logs as event streams
- ✅ Admin Processes: Run as one-off processes

### 3. Azure-Specific Optimizations
- Azure Blob Storage for persistent file storage
- Compatible with Azure App Service
- Compatible with Azure Container Apps
- Ready for Azure Cosmos DB integration
- Environment-based configuration

## Testing Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up local environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Azure credentials
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Monitoring and Logging

For production deployments on Azure:
- Enable Azure Application Insights for monitoring
- Configure log streaming in Azure Portal
- Use Azure Monitor for alerts and metrics
- Review Azure Storage metrics for blob operations

## Security Considerations

1. **Never commit `.env` file** - it contains sensitive credentials
2. **Use Azure Key Vault** for production secrets management
3. **Enable HTTPS** on Azure App Service
4. **Configure CORS** appropriately for your domain
5. **Use Managed Identity** for Azure resource access (recommended)

## Troubleshooting

### Issue: "Azure Storage not initialized"
**Solution:** Ensure `AZURE_STORAGE_CONNECTION_STRING` is set in environment variables

### Issue: Build fails with path errors
**Solution:** Ensure `WEBPACK_OUTPUT_DIR` is set or use default 'dist'

### Issue: Cannot connect to MongoDB
**Solution:** Check Cosmos DB connection string and ensure SSL is enabled

## Additional Resources

- [Azure Blob Storage Documentation](https://docs.microsoft.com/azure/storage/blobs/)
- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [12-Factor App Methodology](https://12factor.net/)

## Support

For issues related to Azure deployment, consult:
- Azure Portal diagnostics
- Application Insights logs
- Azure Storage metrics
- This README and code comments
