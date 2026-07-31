# AWS Parameter Store Configuration Guide

This document describes the environment variables used in the application and how to configure them using AWS Systems Manager Parameter Store for cloud deployments.

## Environment Variables for Cloud Deployment

### Build Configuration

| Environment Variable | AWS Parameter Store Path | Description | Default Value |
|---------------------|-------------------------|-------------|---------------|
| `BUILD_OUTPUT_DIR` | `/app/config/build-output-dir` | Output directory for webpack build artifacts | `dist` |
| `AWS_BUILD_OUTPUT_DIR` | `/app/config/aws-build-output-dir` | AWS-specific build output directory | `dist` |
| `APP_BASE_PATH` | `/app/config/base-path` | Base path for application (replaces __dirname) | `process.cwd()` |

### AWS S3 and CDN Configuration

| Environment Variable | AWS Parameter Store Path | Description | Default Value |
|---------------------|-------------------------|-------------|---------------|
| `AWS_CDN_PUBLIC_PATH` | `/app/config/cdn-url` | CloudFront distribution URL for static assets | `/` |
| `AWS_S3_PUBLIC_PATH` | `/app/config/s3-public-path` | S3 bucket public URL for assets | `/` |
| `AWS_S3_BUCKET` | `/app/config/s3-bucket` | S3 bucket name for build artifacts | - |
| `AWS_S3_BASE_PATH` | `/app/config/s3-base-path` | Base path within S3 bucket | `assets` |
| `AWS_REGION` | `/app/config/aws-region` | AWS region for S3 bucket | `us-east-1` |

### Development Server Configuration

| Environment Variable | AWS Parameter Store Path | Description | Default Value |
|---------------------|-------------------------|-------------|---------------|
| `DEV_SERVER_PORT` | `/app/config/dev-port` | Development server port | `3000` |
| `API_BACKEND_URL` | `/app/config/api-url` | Backend API URL for proxy | `http://localhost:8050` |

### AWS Credentials (Use IAM Roles in Production)

| Environment Variable | AWS Parameter Store Path | Description |
|---------------------|-------------------------|-------------|
| `AWS_ACCESS_KEY_ID` | Use IAM roles instead | AWS access key (not recommended for production) |
| `AWS_SECRET_ACCESS_KEY` | Use IAM roles instead | AWS secret key (not recommended for production) |

## Setting Up AWS Parameter Store

### Using AWS CLI

```bash
# Build configuration
aws ssm put-parameter --name "/app/config/build-output-dir" --value "dist" --type "String"
aws ssm put-parameter --name "/app/config/base-path" --value "/app" --type "String"

# S3 and CDN configuration
aws ssm put-parameter --name "/app/config/s3-bucket" --value "my-app-assets-bucket" --type "String"
aws ssm put-parameter --name "/app/config/s3-base-path" --value "assets" --type "String"
aws ssm put-parameter --name "/app/config/cdn-url" --value "https://d1234567890.cloudfront.net/" --type "String"
aws ssm put-parameter --name "/app/config/aws-region" --value "us-east-1" --type "String"

# API configuration
aws ssm put-parameter --name "/app/config/api-url" --value "https://api.example.com" --type "String"
aws ssm put-parameter --name "/app/config/dev-port" --value "3000" --type "String"
```

### Loading Parameters at Runtime

#### Option 1: Using AWS SDK in Build Script

Create a script to load parameters before build:

```javascript
// scripts/load-aws-params.js
const AWS = require('aws-sdk');
const ssm = new AWS.SSM({ region: process.env.AWS_REGION || 'us-east-1' });

async function loadParameters() {
  const parameterNames = [
    '/app/config/build-output-dir',
    '/app/config/s3-bucket',
    '/app/config/cdn-url',
    '/app/config/api-url',
    // Add other parameters as needed
  ];

  const params = {
    Names: parameterNames,
    WithDecryption: true
  };

  try {
    const result = await ssm.getParameters(params).promise();
    
    result.Parameters.forEach(param => {
      const envVarName = param.Name.split('/').pop().toUpperCase().replace(/-/g, '_');
      process.env[envVarName] = param.Value;
      console.log(`Loaded ${param.Name} -> ${envVarName}`);
    });
  } catch (error) {
    console.error('Error loading parameters from Parameter Store:', error);
    process.exit(1);
  }
}

loadParameters().then(() => {
  // Run webpack build after loading parameters
  require('webpack');
});
```

#### Option 2: Using ECS Task Definition

In your ECS task definition, use `valueFrom` to inject parameters:

```json
{
  "containerDefinitions": [
    {
      "name": "app",
      "environment": [],
      "secrets": [
        {
          "name": "BUILD_OUTPUT_DIR",
          "valueFrom": "arn:aws:ssm:us-east-1:123456789012:parameter/app/config/build-output-dir"
        },
        {
          "name": "AWS_S3_BUCKET",
          "valueFrom": "arn:aws:ssm:us-east-1:123456789012:parameter/app/config/s3-bucket"
        },
        {
          "name": "AWS_CDN_PUBLIC_PATH",
          "valueFrom": "arn:aws:ssm:us-east-1:123456789012:parameter/app/config/cdn-url"
        }
      ]
    }
  ]
}
```

#### Option 3: Using AWS Lambda Environment Variables

For Lambda deployments, configure environment variables in the Lambda function configuration:

```bash
aws lambda update-function-configuration \
  --function-name my-function \
  --environment "Variables={
    BUILD_OUTPUT_DIR=/tmp/dist,
    AWS_S3_BUCKET=my-bucket,
    AWS_CDN_PUBLIC_PATH=https://d1234567890.cloudfront.net/
  }"
```

## IAM Permissions Required

The application or build process needs the following IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": [
        "arn:aws:ssm:*:*:parameter/app/config/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::my-app-assets-bucket/*"
      ]
    }
  ]
}
```

## Best Practices

1. **Use IAM Roles**: In production, use IAM roles attached to ECS tasks, EC2 instances, or Lambda functions instead of hardcoded credentials.

2. **Secure Parameters**: Use SecureString type for sensitive values:
   ```bash
   aws ssm put-parameter --name "/app/config/api-key" --value "secret" --type "SecureString"
   ```

3. **Parameter Hierarchies**: Organize parameters by environment:
   - `/app/dev/config/*`
   - `/app/staging/config/*`
   - `/app/prod/config/*`

4. **Caching**: Cache parameter values to reduce API calls and improve performance.

5. **Fallback Values**: Always provide sensible default values in the code for local development.

## Local Development

For local development, create a `.env` file (add to .gitignore):

```bash
# .env
BUILD_OUTPUT_DIR=dist
AWS_S3_BUCKET=my-local-bucket
AWS_CDN_PUBLIC_PATH=/
API_BACKEND_URL=http://localhost:8050
DEV_SERVER_PORT=3000
```

Use `dotenv` package to load these values:

```javascript
// At the top of webpack.config.js
require('dotenv').config();
```

## Troubleshooting

### Issue: Parameters not loading
- Verify IAM permissions
- Check parameter names match exactly
- Ensure AWS region is correct

### Issue: Build fails with missing environment variables
- Check that all required parameters are set
- Verify default values are appropriate
- Review Parameter Store configuration

### Issue: S3 upload fails
- Verify S3 bucket exists and is accessible
- Check IAM permissions for S3
- Ensure AWS credentials are configured correctly
