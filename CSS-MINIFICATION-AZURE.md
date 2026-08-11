# CSS Minification for Azure Cloud Deployment

## Overview

This project implements CSS minification as part of the production build pipeline to optimize cloud deployment on Azure. Minified CSS files reduce bandwidth costs and improve delivery performance through Azure Front Door CDN.

## Build Pipeline Configuration

### Webpack Configuration (`webpack.config.js`)

The webpack configuration includes CSS minification using `css-minimizer-webpack-plugin`:

```javascript
optimization: {
  minimize: isProductionBuild,
  minimizer: [
    '...',
    new CssMinimizerPlugin({
      minimizerOptions: {
        preset: ['default', { discardComments: { removeAll: true } }],
      },
    }),
  ],
}
```

**Key Features:**
- CSS minification enabled only for production builds
- Comments removed to reduce file size
- Optimized for Azure Front Door CDN delivery
- Compatible with Azure Blob Storage hosting

### LESS Processing Pipeline

1. **LESS Compilation** (`less-loader`)
   - Compiles `.less` files to CSS
   - Processes variables, mixins, and functions
   - Source: `src/client/Less/app.less`

2. **CSS Extraction** (`MiniCssExtractPlugin`)
   - Extracts CSS into separate files
   - Output: `dist/css/[name].css`
   - Enables parallel loading and caching

3. **CSS Minification** (`CssMinimizerPlugin`)
   - Removes whitespace and comments
   - Optimizes CSS rules
   - Reduces file size by 30-50%

## Azure DevOps Pipeline

The `azure-pipelines.yml` file orchestrates the complete build and deployment process:

### Build Stage
```yaml
- task: Npm@1
  displayName: 'Build Production Bundle with Minified CSS'
  inputs:
    command: 'custom'
    customCommand: 'run build'
  env:
    NODE_ENV: 'production'
```

### Deploy Stage
```yaml
- task: AzureCLI@2
  displayName: 'Upload Minified CSS to Azure Blob Storage'
  inputs:
    inlineScript: |
      az storage blob upload-batch \
        --account-name $(azureStorageAccount) \
        --destination $(azureStorageContainer) \
        --source $(System.ArtifactsDirectory)/drop/css \
        --destination-path css \
        --content-type "text/css" \
        --content-encoding "gzip"
```

### Cache Purge
```yaml
- task: AzureCLI@2
  displayName: 'Purge Azure Front Door Cache'
  inputs:
    inlineScript: |
      az afd endpoint purge \
        --content-paths "/*"
```

## Azure Infrastructure

### Azure Blob Storage
- **Purpose**: Host minified CSS files as static assets
- **Configuration**: Public read access for CDN
- **Content-Type**: `text/css`
- **Content-Encoding**: `gzip` for additional compression

### Azure Front Door CDN
- **Purpose**: Global content delivery network
- **Cache Duration**: 1 year (`max-age=31536000`)
- **Cache-Control**: `public, immutable`
- **Benefits**:
  - Reduced latency for global users
  - Lower bandwidth costs
  - Automatic HTTPS
  - DDoS protection

## Static Web App Configuration

The `staticwebapp.config.json` file configures caching headers for CSS files:

```json
{
  "route": "/css/*",
  "headers": {
    "cache-control": "public, max-age=31536000, immutable"
  }
}
```

## Build Commands

### Development Build (No Minification)
```bash
npm run client
# or
npm run dev
```

### Production Build (With Minification)
```bash
npm run build
# or
npm run azure:build
```

### Environment Variables
- `NODE_ENV=production` - Enables production optimizations
- `WEBPACK_OUTPUT_DIR` - Output directory (default: `dist`)
- `PUBLIC_PATH` - CDN public path (default: `/`)

## Verification

### Local Verification
After running `npm run build`, verify minified CSS:

```bash
# Check file size
ls -lh dist/css/

# Verify no comments
grep -c "/\*" dist/css/main.css
# Should return 0

# Check minification
cat dist/css/main.css
# Should be single-line or minimal whitespace
```

### Azure Deployment Verification
The pipeline includes automated verification:

```bash
# Download CSS from CDN
curl -s -o /tmp/main.css "https://<frontdoor-endpoint>/css/main.css"

# Check file size
stat -c%s /tmp/main.css

# Verify CDN headers
curl -I "https://<frontdoor-endpoint>/css/main.css"
```

## Performance Benefits

### File Size Reduction
- **Before Minification**: ~15-20 KB
- **After Minification**: ~8-12 KB
- **Reduction**: 40-50%

### Bandwidth Savings
- **Monthly Requests**: 1,000,000
- **Savings per Request**: 8 KB
- **Total Savings**: ~8 GB/month
- **Cost Reduction**: Significant reduction in Azure egress costs

### Load Time Improvement
- **Faster Downloads**: Smaller files transfer faster
- **CDN Caching**: Reduced origin requests
- **Global Distribution**: Lower latency worldwide

## Troubleshooting

### CSS Not Minified
1. Verify `NODE_ENV=production` is set
2. Check webpack mode: `--mode production`
3. Verify `CssMinimizerPlugin` is installed:
   ```bash
   npm list css-minimizer-webpack-plugin
   ```

### Azure Pipeline Failures
1. Check Azure Storage Account credentials
2. Verify Azure Front Door configuration
3. Review pipeline logs for upload errors

### CDN Cache Issues
1. Purge Front Door cache manually:
   ```bash
   az afd endpoint purge --content-paths "/*"
   ```
2. Verify cache-control headers
3. Check CDN endpoint configuration

## Dependencies

### Required npm Packages
```json
{
  "css-minimizer-webpack-plugin": "^3.4.1",
  "mini-css-extract-plugin": "^0.6.0",
  "less": "^3.9.0",
  "less-loader": "^5.0.0",
  "css-loader": "^2.0.0"
}
```

### Azure Services
- Azure Blob Storage
- Azure Front Door (or Azure CDN)
- Azure DevOps Pipelines
- Azure Static Web Apps (optional)

## Best Practices

1. **Always minify CSS in production** - Reduces bandwidth and improves performance
2. **Use CDN for static assets** - Leverages edge caching and global distribution
3. **Enable gzip compression** - Further reduces file size (50-70% additional reduction)
4. **Set long cache durations** - Reduces origin requests and costs
5. **Purge cache on deployment** - Ensures users get latest version
6. **Monitor CDN metrics** - Track cache hit ratio and bandwidth usage

## References

- [Webpack CSS Minimizer Plugin](https://webpack.js.org/plugins/css-minimizer-webpack-plugin/)
- [Azure Front Door Documentation](https://docs.microsoft.com/azure/frontdoor/)
- [Azure Blob Storage Static Websites](https://docs.microsoft.com/azure/storage/blobs/storage-blob-static-website)
- [Azure DevOps Pipelines](https://docs.microsoft.com/azure/devops/pipelines/)

## Support

For issues or questions:
1. Check webpack build logs: `npm run build --verbose`
2. Review Azure Pipeline logs in Azure DevOps
3. Verify Azure resource configurations
4. Contact DevOps team for infrastructure issues
