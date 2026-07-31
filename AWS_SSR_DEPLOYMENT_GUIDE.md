# AWS Deployment Guide for Next.js SSR Application

## Overview

This guide provides step-by-step instructions for deploying the Next.js SSR application to AWS using three different methods:
1. AWS Amplify Hosting (Easiest)
2. SST (Serverless Stack) with AWS Lambda
3. Manual AWS Lambda + CloudFront deployment

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Node.js 18+ installed
- MongoDB database (MongoDB Atlas recommended for cloud deployment)

## Method 1: AWS Amplify Hosting (Recommended for Beginners)

### Step 1: Install Amplify CLI

```bash
npm install -g @aws-amplify/cli
```

### Step 2: Configure Amplify

```bash
amplify configure
```

Follow the prompts to:
- Sign in to AWS Console
- Create an IAM user with appropriate permissions
- Configure access keys

### Step 3: Initialize Amplify in Your Project

```bash
cd /path/to/BasicM-Javascript
amplify init
```

Configuration:
- Project name: `express-react-nextjs-ssr`
- Environment: `dev` or `prod`
- Default editor: Choose your preferred editor
- App type: `javascript`
- Framework: `react`
- Source directory: `.`
- Distribution directory: `.next`
- Build command: `npm run build`
- Start command: `npm start`

### Step 4: Add Hosting

```bash
amplify add hosting
```

Choose:
- Hosting with Amplify Console (Managed hosting with CI/CD)
- Manual deployment

### Step 5: Configure Environment Variables

In AWS Amplify Console:
1. Go to App Settings > Environment variables
2. Add the following variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `PORT`: `3000`
   - `NODE_ENV`: `production`

### Step 6: Deploy

```bash
amplify publish
```

Your application will be deployed and you'll receive a URL like:
`https://main.d1234567890.amplifyapp.com`

### Step 7: Configure Custom Domain (Optional)

In Amplify Console:
1. Go to App Settings > Domain management
2. Add your custom domain
3. Follow DNS configuration instructions

## Method 2: SST (Serverless Stack) Deployment

### Step 1: Install SST

```bash
npm install --save-dev sst aws-cdk-lib constructs
```

### Step 2: Configure AWS Credentials

```bash
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-1`
- Default output format: `json`

### Step 3: Deploy with SST

```bash
# Deploy to development
npx sst deploy

# Deploy to production
npx sst deploy --stage prod
```

### Step 4: Set Environment Variables

Create `.env.local` for local development:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
PORT=3000
```

For production, use AWS Systems Manager Parameter Store:

```bash
aws ssm put-parameter \
  --name "/express-react-nextjs-ssr/prod/MONGODB_URI" \
  --value "mongodb+srv://username:password@cluster.mongodb.net/dbname" \
  --type "SecureString"
```

Update `sst.config.ts` to use Parameter Store:

```typescript
import { Config } from "sst/constructs";

// In your stack
const MONGODB_URI = new Config.Secret(stack, "MONGODB_URI");

const site = new NextjsSite(stack, "site", {
  bind: [MONGODB_URI],
});
```

### Step 5: Access Your Application

After deployment, SST will output the URL:
```
SiteUrl: https://d1234567890.cloudfront.net
```

### Step 6: Monitor and Debug

```bash
# View logs
npx sst logs

# Open SST Console
npx sst console
```

## Method 3: Manual AWS Lambda + CloudFront Deployment

### Step 1: Build Next.js Application

```bash
npm run build
```

### Step 2: Create Lambda Function

1. Go to AWS Lambda Console
2. Create a new function:
   - Name: `express-react-nextjs-ssr`
   - Runtime: Node.js 18.x
   - Architecture: x86_64

### Step 3: Package Application

```bash
# Install production dependencies
npm ci --production

# Create deployment package
zip -r function.zip .next node_modules package.json next.config.js
```

### Step 4: Upload to Lambda

```bash
aws lambda update-function-code \
  --function-name express-react-nextjs-ssr \
  --zip-file fileb://function.zip
```

### Step 5: Configure Lambda

Set environment variables:
```bash
aws lambda update-function-configuration \
  --function-name express-react-nextjs-ssr \
  --environment Variables="{MONGODB_URI=mongodb+srv://...,PORT=3000}"
```

### Step 6: Create API Gateway

1. Go to API Gateway Console
2. Create HTTP API
3. Add integration with Lambda function
4. Configure routes: `ANY /{proxy+}`

### Step 7: Create CloudFront Distribution

1. Go to CloudFront Console
2. Create distribution
3. Origin: API Gateway endpoint
4. Cache behavior: Forward all headers for SSR
5. Enable compression

### Step 8: Configure Custom Domain (Optional)

1. Request SSL certificate in ACM
2. Add custom domain to CloudFront
3. Update DNS records

## Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Configure network access (allow AWS IP ranges)
4. Create database user

### Step 2: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password

Example:
```
mongodb+srv://username:password@cluster0.mongodb.net/myapp?retryWrites=true&w=majority
```

### Step 3: Configure in AWS

Store in AWS Systems Manager Parameter Store:

```bash
aws ssm put-parameter \
  --name "/express-react-nextjs-ssr/MONGODB_URI" \
  --value "mongodb+srv://..." \
  --type "SecureString" \
  --region us-east-1
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `PORT` | Application port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `API_BASE_URL` | API base URL | `https://api.example.com` |

## Monitoring and Logging

### CloudWatch Logs

View logs in AWS CloudWatch:

```bash
aws logs tail /aws/lambda/express-react-nextjs-ssr --follow
```

### CloudWatch Metrics

Monitor:
- Lambda invocations
- Error rate
- Duration
- Throttles

### X-Ray Tracing

Enable X-Ray for distributed tracing:

```bash
aws lambda update-function-configuration \
  --function-name express-react-nextjs-ssr \
  --tracing-config Mode=Active
```

## Cost Optimization

### Amplify Hosting
- Free tier: 1000 build minutes/month
- Hosting: $0.15/GB served
- Estimated: $5-20/month for small apps

### SST/Lambda
- Lambda free tier: 1M requests/month
- CloudFront: $0.085/GB
- Estimated: $0-10/month for small apps

### Tips
1. Enable CloudFront caching for static assets
2. Use Lambda provisioned concurrency for consistent performance
3. Optimize bundle size with Next.js optimization
4. Use incremental static regeneration (ISR) where possible

## Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution**: 
- Check MongoDB Atlas network access settings
- Verify connection string is correct
- Ensure Lambda has internet access (NAT Gateway if in VPC)

### Issue: "Function timeout"
**Solution**:
- Increase Lambda timeout (default 3s, max 900s)
- Optimize database queries
- Use connection pooling

### Issue: "Cold start latency"
**Solution**:
- Use Lambda provisioned concurrency
- Optimize bundle size
- Use Lambda@Edge for lower latency

### Issue: "Environment variables not working"
**Solution**:
- Verify variables are set in Lambda configuration
- Check Parameter Store permissions
- Ensure correct stage/environment

## Security Best Practices

1. **Use AWS Secrets Manager** for sensitive data
2. **Enable WAF** on CloudFront for DDoS protection
3. **Use VPC** for Lambda if accessing private resources
4. **Enable CloudTrail** for audit logging
5. **Use IAM roles** with least privilege
6. **Enable encryption** at rest and in transit
7. **Regular security updates** for dependencies

## Rollback Procedure

### Amplify
```bash
amplify console
# Select previous deployment and promote
```

### SST
```bash
# Deploy previous version
git checkout <previous-commit>
npx sst deploy --stage prod
```

### Lambda
```bash
# Revert to previous version
aws lambda update-function-code \
  --function-name express-react-nextjs-ssr \
  --s3-bucket my-bucket \
  --s3-key previous-version.zip
```

## Performance Optimization

1. **Enable Next.js Image Optimization**
   ```javascript
   // next.config.js
   images: {
     domains: ['your-cdn.com'],
     formats: ['image/avif', 'image/webp'],
   }
   ```

2. **Use Static Generation** where possible
   ```typescript
   export const getStaticProps = async () => {
     // Generate at build time
   };
   ```

3. **Implement Caching**
   ```typescript
   export const getServerSideProps = async ({ res }) => {
     res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59');
   };
   ```

4. **Optimize Bundle Size**
   ```bash
   npm run build
   # Check bundle size in .next/analyze
   ```

## Support and Resources

- **AWS Amplify Docs**: https://docs.amplify.aws/
- **SST Docs**: https://docs.sst.dev/
- **Next.js Docs**: https://nextjs.org/docs
- **AWS Lambda Docs**: https://docs.aws.amazon.com/lambda/

## Next Steps

1. Set up CI/CD pipeline
2. Configure monitoring and alerts
3. Implement automated testing
4. Set up staging environment
5. Configure backup and disaster recovery
