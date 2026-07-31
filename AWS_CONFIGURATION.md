# AWS Systems Manager Parameter Store Configuration Guide

## Overview

This application has been configured to use AWS Systems Manager Parameter Store for managing environment-specific configuration values, including API endpoint URLs. This approach provides:

- **Environment Isolation**: Different values for dev, staging, and production
- **Security**: Centralized secrets management with IAM-based access control
- **Flexibility**: Change configuration without redeploying the application
- **Audit Trail**: Track who changed what and when

## Configuration Parameters

### Required Parameters

The following parameters must be configured in AWS Systems Manager Parameter Store:

#### 1. API Host URL

**Parameter Name**: `/myapp/api/host` (or customize based on your naming convention)

**Description**: The base URL for the backend API server

**Type**: String (or SecureString if containing sensitive information)

**Example Values**:
- Development: `http://localhost:3000`
- Staging: `https://api-staging.example.com`
- Production: `https://api.example.com`

## Setting Up AWS Systems Manager Parameter Store

### Using AWS Console

1. **Navigate to Systems Manager**:
   - Open the AWS Console
   - Go to Systems Manager service
   - Click on "Parameter Store" in the left navigation

2. **Create Parameter**:
   - Click "Create parameter"
   - Name: `/myapp/api/host` (use your app name)
   - Description: "API host URL for the application"
   - Tier: Standard
   - Type: String (or SecureString for sensitive data)
   - Value: Your API endpoint URL (e.g., `https://api.example.com`)
   - Click "Create parameter"

### Using AWS CLI

```bash
# Create the API host parameter
aws ssm put-parameter \
  --name "/myapp/api/host" \
  --value "https://api.example.com" \
  --type "String" \
  --description "API host URL for the application" \
  --region us-east-1

# Verify the parameter was created
aws ssm get-parameter --name "/myapp/api/host" --region us-east-1
```

### Using Terraform

```hcl
resource "aws_ssm_parameter" "api_host" {
  name        = "/myapp/api/host"
  description = "API host URL for the application"
  type        = "String"
  value       = "https://api.example.com"
  
  tags = {
    Environment = "production"
    Application = "myapp"
  }
}
```

## Application Configuration

### Environment Variables

The application reads the API host URL from environment variables in the following order:

1. `REACT_APP_API_HOST` - React-specific environment variable (for client-side code)
2. `API_HOST` - General environment variable
3. Fallback: `http://localhost:3000` (for local development)

### Loading Parameters at Runtime

For AWS deployments, you have several options to load parameters from Parameter Store:

#### Option 1: ECS Task Definition (Recommended for ECS/Fargate)

```json
{
  "containerDefinitions": [
    {
      "name": "myapp",
      "image": "myapp:latest",
      "secrets": [
        {
          "name": "REACT_APP_API_HOST",
          "valueFrom": "/myapp/api/host"
        }
      ]
    }
  ]
}
```

#### Option 2: Lambda Environment Variables

For Lambda functions, use the AWS SDK to fetch parameters:

```javascript
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();

async function getParameter(name) {
  const result = await ssm.getParameter({
    Name: name,
    WithDecryption: true
  }).promise();
  return result.Parameter.Value;
}

// Usage
const apiHost = await getParameter('/myapp/api/host');
```

#### Option 3: EC2 User Data Script

```bash
#!/bin/bash
# Fetch parameter from Parameter Store
API_HOST=$(aws ssm get-parameter --name "/myapp/api/host" --query "Parameter.Value" --output text --region us-east-1)

# Export as environment variable
export REACT_APP_API_HOST=$API_HOST

# Start the application
npm start
```

#### Option 4: Docker Container with AWS CLI

```dockerfile
FROM node:14-alpine

# Install AWS CLI
RUN apk add --no-cache aws-cli

# Copy application files
COPY . /app
WORKDIR /app

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'export REACT_APP_API_HOST=$(aws ssm get-parameter --name "/myapp/api/host" --query "Parameter.Value" --output text --region ${AWS_REGION:-us-east-1})' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]
```

## IAM Permissions

### Required IAM Policy

The application's IAM role (EC2 instance role, ECS task role, or Lambda execution role) needs the following permissions:

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
        "arn:aws:ssm:us-east-1:ACCOUNT_ID:parameter/myapp/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": [
        "arn:aws:kms:us-east-1:ACCOUNT_ID:key/KEY_ID"
      ],
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "ssm.us-east-1.amazonaws.com"
        }
      }
    }
  ]
}
```

**Note**: Replace `ACCOUNT_ID` with your AWS account ID and `KEY_ID` with your KMS key ID if using SecureString parameters.

## Environment-Specific Configuration

### Naming Convention

Use a hierarchical naming structure for parameters:

```
/myapp/dev/api/host
/myapp/staging/api/host
/myapp/prod/api/host
```

### Example Setup for Multiple Environments

```bash
# Development
aws ssm put-parameter \
  --name "/myapp/dev/api/host" \
  --value "http://localhost:3000" \
  --type "String"

# Staging
aws ssm put-parameter \
  --name "/myapp/staging/api/host" \
  --value "https://api-staging.example.com" \
  --type "String"

# Production
aws ssm put-parameter \
  --name "/myapp/prod/api/host" \
  --value "https://api.example.com" \
  --type "String"
```

### Loading Environment-Specific Parameters

```javascript
const environment = process.env.NODE_ENV || 'dev';
const parameterName = `/myapp/${environment}/api/host`;

// Fetch from Parameter Store
const apiHost = await getParameter(parameterName);
```

## Best Practices

1. **Use SecureString for Sensitive Data**: If the API URL contains authentication tokens or sensitive information, use SecureString type with KMS encryption.

2. **Implement Caching**: Cache parameter values to reduce API calls and improve performance:
   ```javascript
   let cachedApiHost = null;
   let cacheExpiry = 0;
   
   async function getApiHost() {
     if (cachedApiHost && Date.now() < cacheExpiry) {
       return cachedApiHost;
     }
     cachedApiHost = await getParameter('/myapp/api/host');
     cacheExpiry = Date.now() + (5 * 60 * 1000); // Cache for 5 minutes
     return cachedApiHost;
   }
   ```

3. **Use Parameter Hierarchies**: Organize parameters by application and environment for better management.

4. **Tag Parameters**: Add tags for cost allocation, environment identification, and automation:
   ```bash
   aws ssm add-tags-to-resource \
     --resource-type "Parameter" \
     --resource-id "/myapp/api/host" \
     --tags "Key=Environment,Value=production" "Key=Application,Value=myapp"
   ```

5. **Enable Parameter Versioning**: Parameter Store automatically versions parameters, allowing you to track changes and rollback if needed.

6. **Set Up CloudWatch Alarms**: Monitor parameter access patterns and set up alarms for unusual activity.

7. **Use Parameter Policies**: Set expiration policies for parameters that should be rotated regularly:
   ```bash
   aws ssm put-parameter \
     --name "/myapp/api/host" \
     --value "https://api.example.com" \
     --type "String" \
     --policies '[{"Type":"Expiration","Version":"1.0","Attributes":{"Timestamp":"2024-12-31T23:59:59Z"}}]'
   ```

## Troubleshooting

### Common Issues

1. **Parameter Not Found**:
   - Verify the parameter name is correct
   - Check the AWS region
   - Ensure the IAM role has `ssm:GetParameter` permission

2. **Access Denied**:
   - Verify IAM permissions
   - Check if the parameter is encrypted and KMS decrypt permission is granted
   - Ensure the resource ARN in the IAM policy matches the parameter path

3. **Application Using Fallback Value**:
   - Check if environment variables are properly set
   - Verify the parameter loading logic is executed before the application starts
   - Check application logs for parameter fetch errors

### Debugging

Enable debug logging to troubleshoot parameter loading:

```javascript
console.log('Environment variables:', {
  REACT_APP_API_HOST: process.env.REACT_APP_API_HOST,
  API_HOST: process.env.API_HOST,
  NODE_ENV: process.env.NODE_ENV
});
```

## Migration from Hard-coded Values

The application has been updated to use environment variables instead of hard-coded URLs. The changes include:

- **File Modified**: `src/client/utils.ts`
- **Change**: Replaced `"http://localhost:3000"` with environment variable lookup
- **Backward Compatibility**: Maintains fallback to `http://localhost:3000` for local development

## Additional Resources

- [AWS Systems Manager Parameter Store Documentation](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [AWS SDK for JavaScript - SSM Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSM.html)
- [Best Practices for Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-best-practices.html)
- [IAM Policies for Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-paramstore-access.html)
