# Next.js SSR Migration for AWS Lambda Deployment

## Overview

This application has been migrated from a client-side only rendering (CSR) pattern to Next.js Server-Side Rendering (SSR) to ensure compatibility with cloud platforms like AWS Lambda, AWS Amplify, and serverless environments.

## What Changed

### 1. **Migration from CSR to SSR**
- **Before**: Empty `<div id="root"></div>` with client-side only rendering
- **After**: Next.js SSR with `<div id="__next">` that contains server-rendered content

### 2. **New File Structure**
```
├── pages/
│   ├── _app.tsx          # Next.js App component
│   ├── _document.tsx     # Custom HTML document with SSR support
│   ├── index.tsx         # Main page with getServerSideProps
│   └── api/
│       └── test.ts       # API routes (replaces Express routes)
├── next.config.js        # Next.js configuration
└── public/
    └── index.html        # Updated with SSR comments
```

### 3. **Key Benefits**
- ✅ **SEO Optimization**: Content is rendered on the server, improving search engine indexing
- ✅ **Performance**: Faster initial page load with server-rendered HTML
- ✅ **Cloud Native**: Compatible with AWS Lambda, Amplify, and serverless platforms
- ✅ **Scalability**: Automatic scaling with serverless deployment

## Deployment Options

### Option 1: AWS Amplify Hosting (Recommended)
AWS Amplify automatically handles Next.js SSR deployment:

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

### Option 2: SST (Serverless Stack)
Deploy Next.js to AWS Lambda using SST:

```bash
# Install SST
npm install --save-dev sst

# Create SST config
npx create-sst@latest

# Deploy
npx sst deploy
```

Example `sst.config.ts`:
```typescript
import { SSTConfig } from "sst";
import { NextjsSite } from "sst/constructs";

export default {
  config(_input) {
    return {
      name: "express-react-nextjs",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const site = new NextjsSite(stack, "site", {
        environment: {
          MONGODB_URI: process.env.MONGODB_URI || "",
        },
      });
      stack.addOutputs({
        SiteUrl: site.url,
      });
    });
  },
} satisfies SSTConfig;
```

### Option 3: AWS Lambda with CloudFront
Deploy using AWS CDK or CloudFormation:

```bash
# Build Next.js
npm run build

# Deploy to Lambda with CloudFront distribution
# Use AWS CDK or CloudFormation templates
```

## Environment Variables

Create a `.env.local` file for local development:

```env
MONGODB_URI=mongodb://localhost:27017/yourdb
PORT=3000
API_BASE_URL=http://localhost:3000
```

For production deployment, configure these in:
- **AWS Amplify**: Environment variables in Amplify Console
- **SST**: In `sst.config.ts` environment section
- **Lambda**: AWS Systems Manager Parameter Store or Secrets Manager

## Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Routes

Next.js API routes replace the Express server:

- **GET /api/test**: Get user information
- **POST /api/test**: Create a new test entry
- **PUT /api/test**: Update an existing test entry
- **DELETE /api/test**: Delete a test entry

## Server-Side Rendering

The main page (`pages/index.tsx`) uses `getServerSideProps` to fetch data on the server:

```typescript
export const getServerSideProps: GetServerSideProps = async (context) => {
  // Fetch data on the server
  return {
    props: {
      initialData: data,
    },
  };
};
```

## Migration Notes

### What Was Preserved
- ✅ All business logic from the original React components
- ✅ API functionality (GET, POST, PUT, DELETE)
- ✅ MongoDB integration
- ✅ TypeScript types and interfaces
- ✅ Less/CSS styling

### What Changed
- 🔄 React 16 → React 18
- 🔄 Express routes → Next.js API routes
- 🔄 Webpack → Next.js built-in bundler
- 🔄 Client-side routing → Next.js routing
- 🔄 CSR → SSR with `getServerSideProps`

## Performance Considerations

1. **Static Generation**: For pages that don't change often, consider using `getStaticProps` instead of `getServerSideProps`
2. **Incremental Static Regeneration (ISR)**: Use ISR for pages that need periodic updates
3. **Edge Functions**: Deploy to AWS Lambda@Edge for lower latency
4. **Caching**: Configure CloudFront caching for static assets

## Security

The application maintains security headers:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

These are configured in `next.config.js` and `pages/_document.tsx`.

## Troubleshooting

### Issue: "Cannot find module 'next'"
**Solution**: Run `npm install` to install Next.js dependencies

### Issue: MongoDB connection errors
**Solution**: Ensure `MONGODB_URI` environment variable is set correctly

### Issue: API routes not working
**Solution**: Check that API routes are in `pages/api/` directory

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [AWS Amplify Hosting](https://docs.amplify.aws/guides/hosting/nextjs/q/platform/js/)
- [SST Documentation](https://docs.sst.dev/start/nextjs)
- [Next.js on AWS Lambda](https://aws.amazon.com/blogs/compute/building-server-side-rendering-for-react-in-aws-lambda/)

## Support

For issues or questions, refer to:
- Next.js GitHub: https://github.com/vercel/next.js
- AWS Amplify: https://github.com/aws-amplify/amplify-js
- SST: https://github.com/serverless-stack/sst
