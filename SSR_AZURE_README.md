# Express React TypeScript with SSR for Azure

This application has been enhanced with Server-Side Rendering (SSR) support for Azure cloud deployment.

## SSR Implementation

### Overview
The application now supports server-side rendering, making it compatible with:
- **Azure Static Web Apps** (hybrid mode with SSR support)
- **Azure Container Apps** (full SSR capability)
- **Azure App Service**

### Key Changes

#### 1. HTML Template Enhancement (`public/index.html`)
- Added SSR content placeholder: `<!-- SSR_CONTENT -->`
- Included SEO-friendly meta tags
- Added noscript fallback for accessibility
- Enhanced with Azure-specific meta tags

#### 2. SSR Middleware (`src/server/middlewares/ssrRenderer.ts`)
- Server-side rendering middleware for Express
- Injects server-rendered content into HTML template
- Supports SSR configuration via environment variables
- Graceful fallback to CSR on errors

#### 3. Server Configuration (`src/server/index.ts`)
- Integrated SSR middleware into Express pipeline
- Proper route ordering (API routes → SSR → static files)
- Enhanced logging for SSR status

### Environment Variables

Configure SSR behavior with these environment variables:

```bash
# Enable/disable SSR (default: true)
SSR_ENABLED=true

# Enable SSR caching (default: false)
SSR_CACHE_ENABLED=false

# SSR cache TTL in seconds (default: 300)
SSR_CACHE_TTL=300

# Node environment
NODE_ENV=production

# Server port
PORT=8050
```

### Azure Deployment

#### Azure Static Web Apps (Hybrid Mode)
```json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/*",
      "rewrite": "/index.html"
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "platform": {
    "apiRuntime": "node:16"
  }
}
```

#### Azure Container Apps
The application is ready for containerization with full SSR support:
- Build the application: `npm run build`
- Compile server: `npm run server:compile`
- Start server: `node server/index.js`

#### Azure App Service
Deploy directly to Azure App Service:
1. Set `NODE_ENV=production`
2. Set `SSR_ENABLED=true`
3. Configure startup command: `npm start`

### Benefits

1. **SEO Optimization**
   - Search engines receive fully rendered HTML
   - Better indexing and ranking
   - Social media preview support

2. **Performance**
   - Faster initial page load
   - Reduced time to first contentful paint
   - Better perceived performance

3. **Accessibility**
   - Content available without JavaScript
   - Better support for assistive technologies
   - Noscript fallback included

4. **Cloud-Native**
   - Designed for Azure deployment
   - Environment-based configuration
   - Scalable architecture

### Development

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Azure-specific build
npm run azure:build
```

### Testing SSR

To verify SSR is working:

1. Build and start the server:
   ```bash
   npm run build
   npm run server
   ```

2. Check the HTML source:
   ```bash
   curl http://localhost:8050/
   ```

3. Look for:
   - Server-rendered content in the `<div id="root">` element
   - SSR meta tags: `<meta name="ssr-enabled" content="true">`
   - No empty root div

### Migration Notes

This implementation provides a foundation for SSR while maintaining backward compatibility:
- Client-side hydration still works
- API routes remain unchanged
- Static assets served normally
- Graceful degradation to CSR if SSR fails

### Future Enhancements

For full Next.js migration (recommended for production):
1. Migrate to Next.js framework
2. Convert pages to Next.js page components
3. Use Next.js API routes
4. Deploy to Azure Static Web Apps with Next.js support

### Troubleshooting

**SSR not working:**
- Check `SSR_ENABLED` environment variable
- Verify `dist/index.html` exists after build
- Check server logs for SSR errors

**Performance issues:**
- Enable SSR caching: `SSR_CACHE_ENABLED=true`
- Adjust cache TTL: `SSR_CACHE_TTL=600`
- Consider CDN for static assets

**Azure deployment issues:**
- Ensure Node.js version >= 12
- Verify all dependencies are in `dependencies` (not `devDependencies`)
- Check Azure logs for startup errors

## License
MIT
