# TypeScript Configuration for Azure Cloud Deployment

## Overview
This project uses separate TypeScript configurations to enforce strict type separation between browser DOM code and Node.js/Azure Functions server code.

## Configuration Files

### 1. `tsconfig.json` (Root Configuration)
- **Purpose**: Project references configuration
- **Role**: Orchestrates compilation of both client and server code separately
- Uses TypeScript's project references feature to maintain strict separation

### 2. `tsconfig.client.json` (Client/Browser Configuration)
- **Purpose**: Client-side browser code compilation
- **Includes**: `./src/client/**/*`
- **Excludes**: `./src/server`
- **Libraries**: ES2019, DOM, DOM.Iterable
- **Target Environment**: Browser (supports Fetch API, Response, DOM types)

### 3. `tsconfig.server.json` (Server/Node.js Configuration)
- **Purpose**: Server-side Node.js/Azure Functions code compilation
- **Includes**: `./src/server/**/*`
- **Excludes**: `./src/client`
- **Libraries**: ES2019 only (no DOM)
- **Types**: Node.js types only
- **Target Environment**: Node.js runtime / Azure Functions

## Why This Separation Matters for Azure Cloud

### Problem
Mixing browser DOM types (like `Response`, `fetch`, `window`, `document`) with Node.js server code creates:
- Type conflicts during compilation
- Runtime errors when browser-specific APIs are called in server environments
- Deployment failures in Azure Functions/Container Apps
- Architectural confusion between client and server boundaries

### Solution
Strict TypeScript configuration separation ensures:
- ✅ Client code can use browser APIs (Fetch, DOM) safely
- ✅ Server code uses only Node.js APIs (no DOM pollution)
- ✅ Clear architectural boundaries between frontend and backend
- ✅ Successful deployment to Azure cloud environments
- ✅ Type safety across the entire application

## Client Services (src/client/Services/)

The following files are **browser-only** and use DOM types:
- `Delete.ts` - HTTP DELETE using Fetch API
- `Get.ts` - HTTP GET using Fetch API
- `Post.ts` - HTTP POST using Fetch API
- `Put.ts` - HTTP PUT using Fetch API

These files:
- Use the `Response` type from DOM library
- Use the `fetch` API (browser standard)
- Should **never** be imported or used in server-side code
- Are compiled with `tsconfig.client.json`

## Server Code (src/server/)

Server-side code:
- Uses Node.js APIs only
- No DOM types available
- Compiled with `tsconfig.server.json`
- Suitable for Azure Functions, Azure Container Apps, Azure App Service

## Build Commands

```bash
# Build client code
npm run build

# Compile server code
npm run server:compile

# Build for Azure deployment
npm run azure:build
```

## Azure Deployment Compatibility

This configuration ensures:
- ✅ Compatible with Azure Static Web Apps
- ✅ Compatible with Azure Container Apps
- ✅ Compatible with Azure Functions v4
- ✅ Compatible with Azure App Service
- ✅ Follows Azure cloud-native patterns
- ✅ Supports Server-Side Rendering (SSR) in Azure

## Development Guidelines

### For Client Code (src/client/)
- ✅ Use browser APIs (fetch, DOM, window, document)
- ✅ Use React components and hooks
- ✅ Import from other client modules only
- ❌ Do NOT import server-side modules
- ❌ Do NOT use Node.js APIs (fs, path, http)

### For Server Code (src/server/)
- ✅ Use Node.js APIs (fs, path, http, express)
- ✅ Use Azure SDKs (@azure/storage-blob, etc.)
- ✅ Import from other server modules only
- ❌ Do NOT import client-side modules
- ❌ Do NOT use browser APIs (fetch, DOM, window)

## Verification

To verify the configuration is working correctly:

```bash
# Check client compilation
npx tsc -p tsconfig.client.json --noEmit

# Check server compilation
npx tsc -p tsconfig.server.json --noEmit

# Check both
npx tsc --build
```

## Troubleshooting

### Error: "Cannot find name 'Response'"
- **Cause**: Server code trying to use DOM types
- **Fix**: Move code to client directory or use Node.js alternatives (node-fetch, axios)

### Error: "Cannot find module 'fs'"
- **Cause**: Client code trying to use Node.js APIs
- **Fix**: Move code to server directory or use browser alternatives

### Error: "Type 'Response' is not assignable"
- **Cause**: Mixing client and server imports
- **Fix**: Ensure strict separation - client imports client, server imports server

## References

- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Azure Functions TypeScript Guide](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node)
- [Azure Static Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/)
