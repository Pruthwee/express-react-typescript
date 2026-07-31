# AWS Cloud Deployment Guide

## Overview

This application has been configured for cloud-native deployment on AWS with the following enhancements:

1. **Static Asset Storage**: Build artifacts are uploaded to AWS S3 for durable, scalable storage
2. **Environment-based Configuration**: All cloud-specific settings are externalized via environment variables
3. **Cloud-Compatible Build Process**: Removed hardcoded `__dirname` references in favor of configurable paths

## Cloud Readiness Fixes Applied

### Issue: __dirname for Data Storage (cr-js-0003)

**Problem**: The webpack configuration used `__dirname` to construct the output path for build artifacts. This assumes a fixed directory structure that doesn't exist in containerized or serverless environments.

**Solution**: 
- Replaced `path.join(__dirname, outputDirectory)` with `path.resolve(process.cwd(), outputDirectory)`
- Made output directory configurable via `BUILD_OUTPUT_DIR` environment variable
- Added AWS S3 plugin integration for automatic upload of build artifacts
- Configured public path to support CDN/S3 URLs via `AWS_S3_PUBLIC_PATH` environment variable

## AWS S3 Setup

### 1. Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://my-app-assets --region us-east-1

# Configure bucket for static website hosting (optional)
aws s3 website s3://my-app-assets --index-document index.html
```

### 2. Configure Bucket Policy

Create a bucket policy to allow public read access to static assets:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-app-assets/*"
    }
  ]
}
```

### 3. Configure CORS (if needed)

If serving assets from a different domain:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### 4. Create IAM User for Deployment

Create an IAM user with programmatic access and attach the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::my-app-assets",
        "arn:aws:s3:::my-app-assets/*"
      ]
    }
  ]
}
```

## Deployment Process

### Local Build with S3 Upload

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure your `.env` file with AWS credentials:
```bash
AWS_S3_BUCKET=my-app-assets
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_PUBLIC_PATH=https://my-app-assets.s3.amazonaws.com/
```

3. Build and deploy:
```bash
npm install
npm run build
```

The build process will automatically upload all static assets to S3.

### CI/CD Pipeline Integration

For automated deployments, set environment variables in your CI/CD pipeline:

**GitHub Actions Example:**
```yaml
- name: Build and Deploy to S3
  env:
    AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_REGION: us-east-1
    AWS_S3_PUBLIC_PATH: https://my-app-assets.s3.amazonaws.com/
  run: npm run build
```

## CloudFront CDN (Optional but Recommended)

For better performance and HTTPS support, configure CloudFront:

1. Create a CloudFront distribution pointing to your S3 bucket
2. Update `AWS_S3_PUBLIC_PATH` to use the CloudFront URL:
```bash
AWS_S3_PUBLIC_PATH=https://d111111abcdef8.cloudfront.net/
```

## Container Deployment

When deploying in containers (ECS, EKS, App Runner):

1. **Build Stage**: Run `npm run build` with S3 environment variables
2. **Runtime Stage**: The application serves from S3, no local file system needed
3. **Environment Variables**: Pass AWS credentials via container environment or IAM roles

### Using IAM Roles (Recommended)

Instead of hardcoding credentials, use IAM roles:

1. Attach an IAM role to your ECS task or EC2 instance
2. Remove `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from environment
3. The AWS SDK will automatically use the instance role credentials

## Verification

After deployment, verify:

1. Build artifacts are uploaded to S3:
```bash
aws s3 ls s3://my-app-assets/assets/
```

2. Assets are publicly accessible:
```bash
curl https://my-app-assets.s3.amazonaws.com/assets/js/main.bundle.js
```

3. Application loads correctly with assets from S3

## Troubleshooting

### Assets not uploading to S3
- Verify AWS credentials are correct
- Check IAM user has `s3:PutObject` permission
- Ensure bucket name is correct and accessible

### CORS errors
- Configure CORS policy on S3 bucket
- Verify `AllowedOrigins` includes your application domain

### Assets not loading
- Check `AWS_S3_PUBLIC_PATH` is correctly configured
- Verify bucket policy allows public read access
- Check CloudFront distribution if using CDN

## Cost Optimization

- Enable S3 lifecycle policies to archive old versions
- Use CloudFront to reduce S3 data transfer costs
- Set appropriate cache headers (already configured: `max-age=31536000`)
- Consider S3 Intelligent-Tiering for infrequently accessed assets
