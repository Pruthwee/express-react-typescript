# AWS CodeArtifact and Dependency Management Guide

## Overview

This document describes how to manage dependencies for this Node.js application using AWS CodeArtifact and lock files, ensuring that `node_modules` is never committed to version control.

## Problem Statement

Committing `node_modules` to version control creates several issues:
- Large repository size
- Slow clone and checkout operations
- Large container images
- Deployment inefficiencies
- Merge conflicts in dependency files

## Solution

This project uses lock files (`yarn.lock` or `package-lock.json`) to ensure reproducible builds without committing `node_modules`.

## Configuration

### 1. Git Ignore Configuration

The `.gitignore` file already excludes `node_modules/`:

```
# Dependency directories
node_modules/
jspm_packages/
```

**Action Required**: Ensure `node_modules` is never committed:
```bash
# Remove node_modules from Git history if previously committed
git rm -r --cached node_modules/
git commit -m "Remove node_modules from version control"
```

### 2. Lock File Management

This project uses `yarn.lock` for dependency management. The lock file ensures:
- Reproducible builds across environments
- Consistent dependency versions
- Faster CI/CD builds with caching

**Best Practices**:
- ✅ Always commit `yarn.lock` or `package-lock.json`
- ✅ Use `yarn install --frozen-lockfile` or `npm ci` in CI/CD
- ❌ Never commit `node_modules/`
- ❌ Never use `npm install` in production builds (use `npm ci` instead)

### 3. AWS CodeBuild Integration

The `buildspec.yml` file configures AWS CodeBuild to install dependencies from lock files:

```yaml
pre_build:
  commands:
    - yarn install --frozen-lockfile  # For yarn projects
    # OR
    - npm ci  # For npm projects with package-lock.json
```

**Key Features**:
- Uses lock files for reproducible builds
- Caches `node_modules` for faster builds
- Excludes `node_modules` from build artifacts

### 4. AWS CodeArtifact Setup (Optional)

To use AWS CodeArtifact as a private npm registry:

#### Step 1: Create CodeArtifact Repository

```bash
# Create a CodeArtifact domain
aws codeartifact create-domain \
  --domain my-domain \
  --region us-east-1

# Create a repository
aws codeartifact create-repository \
  --domain my-domain \
  --repository my-repo \
  --region us-east-1
```

#### Step 2: Configure npm/yarn to Use CodeArtifact

Add to `buildspec.yml` pre_build phase:

```yaml
pre_build:
  commands:
    # Authenticate with CodeArtifact
    - export CODEARTIFACT_AUTH_TOKEN=$(aws codeartifact get-authorization-token --domain my-domain --query authorizationToken --output text)
    
    # Configure npm registry
    - npm config set registry https://my-domain-123456789012.d.codeartifact.us-east-1.amazonaws.com/npm/my-repo/
    - npm config set //my-domain-123456789012.d.codeartifact.us-east-1.amazonaws.com/npm/my-repo/:_authToken=$CODEARTIFACT_AUTH_TOKEN
    
    # Install dependencies
    - npm ci
```

#### Step 3: Update IAM Permissions

Add to CodeBuild service role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "codeartifact:GetAuthorizationToken",
        "codeartifact:GetRepositoryEndpoint",
        "codeartifact:ReadFromRepository"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "sts:GetServiceBearerToken",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "sts:AWSServiceName": "codeartifact.amazonaws.com"
        }
      }
    }
  ]
}
```

### 5. Local Development

For local development, developers should:

```bash
# Install dependencies (creates node_modules locally)
yarn install
# OR
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

**Note**: `node_modules` will be created locally but is excluded by `.gitignore`.

### 6. CI/CD Pipeline Configuration

#### Using AWS CodePipeline + CodeBuild

1. **Source Stage**: Pull code from repository (node_modules not included)
2. **Build Stage**: CodeBuild runs `buildspec.yml`
   - Installs dependencies from lock file
   - Builds application
   - Excludes node_modules from artifacts
3. **Deploy Stage**: Deploy built artifacts (without node_modules)

#### Using GitHub Actions (Alternative)

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Build
        run: npm run build
      
      - name: Deploy to AWS
        run: |
          # Deploy commands here
```

## Verification

### Verify node_modules is Not in Git

```bash
# Check if node_modules is tracked
git ls-files | grep node_modules

# Should return nothing
```

### Verify Lock File Exists

```bash
# Check for lock files
ls -la | grep -E "(yarn.lock|package-lock.json)"

# Should show yarn.lock or package-lock.json
```

### Verify .gitignore Configuration

```bash
# Check .gitignore
cat .gitignore | grep node_modules

# Should show: node_modules/
```

## Troubleshooting

### Issue: node_modules was previously committed

**Solution**:
```bash
# Remove from Git but keep locally
git rm -r --cached node_modules/
git commit -m "Remove node_modules from version control"
git push
```

### Issue: Lock file conflicts

**Solution**:
```bash
# For yarn
yarn install
git add yarn.lock
git commit -m "Update yarn.lock"

# For npm
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
```

### Issue: Different dependency versions in CI vs local

**Solution**:
- Always use `npm ci` or `yarn install --frozen-lockfile` in CI
- Commit lock file changes after updating dependencies
- Never manually edit lock files

## Best Practices Summary

✅ **DO**:
- Commit lock files (`yarn.lock` or `package-lock.json`)
- Use `npm ci` or `yarn install --frozen-lockfile` in CI/CD
- Keep `.gitignore` updated to exclude `node_modules/`
- Use AWS CodeArtifact for private packages
- Cache `node_modules` in CI/CD for faster builds

❌ **DON'T**:
- Commit `node_modules/` to version control
- Use `npm install` in production builds
- Manually edit lock files
- Delete lock files
- Mix npm and yarn in the same project

## References

- [AWS CodeArtifact Documentation](https://docs.aws.amazon.com/codeartifact/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [npm ci Documentation](https://docs.npmjs.com/cli/v8/commands/npm-ci)
- [Yarn Frozen Lockfile](https://classic.yarnpkg.com/en/docs/cli/install/#toc-yarn-install-frozen-lockfile)
