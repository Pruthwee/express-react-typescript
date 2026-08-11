# CSS Minification for Azure Cloud Deployment

## Overview

This project implements CSS minification in the build pipeline to optimize cloud deployment on Azure. Minified CSS files reduce bandwidth costs and improve delivery performance through Azure Front Door CDN.

## Implementation Details

### 1. Webpack CSS Minification

The project uses `css-minimizer-webpack-plugin` to minify CSS files during production builds:

**Configuration** (`webpack.config.js`):
```javascript
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: ['default', { discardComments: { removeAll: true } }],
        },
      }),
    ],
  },
  // ... rest of config
};
```

**Benefits**:
- Removes all comments and whitespace
- Reduces file size by 30-50%
- Optimizes for CDN caching
- Improves page load times globally

### 2. Azure DevOps Pipeline

The `azure-pipelines.yml` file automates the build and deployment process:

**Pipeline Stages**:

1. **Build Stage**: 
   - Installs Node.js dependencies
   - Runs webpack production build with CSS minification
   - Publishes build artifacts

2. **Deploy Stage**:
   - Uploads minified CSS to Azure Blob Storage
   - Configures proper content-type headers
   - Enables gzip compression
   - Deploys to Azure Front Door CDN

3. **Verify Stage**:
   - Validates CSS minification
   - Checks CDN delivery
   - Verifies cache headers

### 3. Azure Infrastructure Requirements

**Required Azure Resources**:

- **Azure Storage Account**: For hosting static assets
- **Azure Blob Storage Container**: For CSS, JS, and HTML files
- **Azure Front Door**: For global CDN delivery
- **Azure DevOps Service Connection**: For pipeline authentication

**Environment Variables** (configure in Azure DevOps):

```yaml
AZURE_STORAGE_ACCOUNT: your-storage-account-name
AZURE_STORAGE_CONTAINER: $web
AZURE_FRONTDOOR_ENDPOINT: your-frontdoor-endpoint
AZURE_FRONTDOOR_PROFILE: your-frontdoor-profile
AZURE_RESOURCE_GROUP: your-resource-group
AZURE_SERVICE_CONNECTION: your-service-connection-name
```

### 4. Local Development

For local development, CSS is not minified to enable easier debugging:

```bash
# Development mode (CSS not minified)
npm run dev

# Production build (CSS minified)
npm run build
```

### 5. CSS File Processing

**Source Files**:
- `src/client/Less/app.less` - Main LESS stylesheet

**Build Process**:
1. LESS files are compiled to CSS
2. CSS is extracted using `mini-css-extract-plugin`
3. CSS is minified using `css-minimizer-webpack-plugin`
4. Minified CSS is output to `dist/css/main.css`

**Output**:
- Development: `dist/css/main.css` (readable, with comments)
- Production: `dist/css/main.css` (minified, no comments)

### 6. Performance Optimization

**Minification Benefits**:
- **File Size Reduction**: 30-50% smaller CSS files
- **Bandwidth Savings**: Reduced data transfer costs on Azure
- **Faster Load Times**: Quicker downloads from Azure Front Door
- **Better Caching**: Optimized for CDN edge caching
- **Global Performance**: Improved delivery across Azure regions

**Azure Front Door Configuration**:
- Caching rules for CSS files (long TTL)
- Compression enabled (gzip/brotli)
- Global edge locations for low latency
- Automatic cache purging on deployment

### 7. Deployment Workflow

**Automated Deployment**:

1. Developer pushes code to main/master/develop branch
2. Azure DevOps pipeline triggers automatically
3. Build stage compiles and minifies CSS
4. Deploy stage uploads to Azure Blob Storage
5. Front Door cache is purged
6. Verify stage checks deployment success

**Manual Deployment**:

```bash
# Build production bundle
npm run build

# Upload to Azure Blob Storage (using Azure CLI)
az storage blob upload-batch \
  --account-name <storage-account> \
  --destination '$web' \
  --source ./dist/css \
  --destination-path css \
  --content-type "text/css" \
  --overwrite true

# Purge Front Door cache
az afd endpoint purge \
  --resource-group <resource-group> \
  --profile-name <frontdoor-profile> \
  --endpoint-name <endpoint> \
  --content-paths "/*"
```

### 8. Monitoring and Verification

**Verify CSS Minification**:

```bash
# Check if CSS is minified
curl -s https://your-frontdoor-endpoint/css/main.css | head -n 5

# Expected: Single line, no comments, no whitespace
```

**Monitor Performance**:
- Azure Front Door Analytics: Track cache hit ratio
- Azure Monitor: Monitor bandwidth usage
- Application Insights: Track page load times

### 9. Troubleshooting

**Issue**: CSS not minified in production
- **Solution**: Ensure `NODE_ENV=production` is set during build

**Issue**: CSS files not loading from CDN
- **Solution**: Check Azure Front Door origin configuration
- **Solution**: Verify CORS settings on Blob Storage

**Issue**: Old CSS cached after deployment
- **Solution**: Ensure cache purge step runs in pipeline
- **Solution**: Check Front Door caching rules

### 10. Dependencies

**Required npm packages**:
```json
{
  "devDependencies": {
    "css-minimizer-webpack-plugin": "^3.4.1",
    "mini-css-extract-plugin": "^0.6.0",
    "css-loader": "^2.0.0",
    "less-loader": "^5.0.0",
    "webpack": "^4.5.0"
  }
}
```

## Best Practices

1. **Always minify CSS in production** to reduce bandwidth costs
2. **Use Azure Front Door** for global CDN delivery
3. **Enable compression** (gzip/brotli) on Blob Storage
4. **Set appropriate cache headers** for CSS files
5. **Purge CDN cache** after each deployment
6. **Monitor performance** using Azure Monitor
7. **Test locally** before deploying to production

## References

- [Azure Front Door Documentation](https://docs.microsoft.com/azure/frontdoor/)
- [Azure Blob Storage Static Websites](https://docs.microsoft.com/azure/storage/blobs/storage-blob-static-website)
- [css-minimizer-webpack-plugin](https://webpack.js.org/plugins/css-minimizer-webpack-plugin/)
- [Azure DevOps Pipelines](https://docs.microsoft.com/azure/devops/pipelines/)
