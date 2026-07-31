# AWS Deployment Guide - CSS Minification with CodePipeline

This guide explains how to deploy this Next.js application to AWS with CSS minification integrated into the AWS CodePipeline build process.

## Overview

This application is configured to automatically minify CSS files during the build process and deploy them to AWS S3 for CloudFront CDN delivery. This setup reduces bandwidth costs and improves page load performance across global regions.

## Architecture

```
Source Code (Git) 
    ↓
AWS CodePipeline
    ↓
AWS CodeBuild (buildspec.yml)
    ↓ (CSS Minification via CSSNano)
    ↓
AWS S3 Bucket (Static Assets)
    ↓
AWS CloudFront CDN (Global Delivery)
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **S3 Bucket** for static assets
3. **CloudFront Distribution** (optional but recommended)
4. **CodePipeline** and **CodeBuild** access
5. **IAM Role** with permissions for S3, CloudFront, and CodeBuild

## Step 1: Create S3 Bucket

Create an S3 bucket to store your static assets:

```bash
aws s3 mb s3://my-app-static-assets --region us-east-1
```

Configure bucket policy for public read access (if not using CloudFront):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-app-static-assets/*"
    }
  ]
}
```

## Step 2: Create CloudFront Distribution (Recommended)

Create a CloudFront distribution to serve your S3 assets:

```bash
aws cloudfront create-distribution \
  --origin-domain-name my-app-static-assets.s3.amazonaws.com \
  --default-root-object index.html
```

Note the Distribution ID for later use.

## Step 3: Configure CodeBuild Project

Create a CodeBuild project with the following configuration:

### Environment Variables

Set these environment variables in your CodeBuild project:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Enables CSS minification |
| `S3_BUCKET` | `my-app-static-assets` | Target S3 bucket |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E1234567890ABC` | CloudFront distribution ID (optional) |
| `AWS_REGION` | `us-east-1` | AWS region |

### IAM Role Permissions

Ensure the CodeBuild service role has these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-app-static-assets",
        "arn:aws:s3:::my-app-static-assets/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::*:distribution/*"
    }
  ]
}
```

### Build Specification

The project includes a `buildspec.yml` file that:
1. Installs dependencies
2. Builds the application with CSS minification enabled
3. Verifies CSS files are minified
4. Deploys to S3 with appropriate cache headers
5. Invalidates CloudFront cache

## Step 4: Create CodePipeline

Create a CodePipeline with the following stages:

### Source Stage
- **Provider**: AWS CodeCommit, GitHub, or Bitbucket
- **Repository**: Your application repository
- **Branch**: `main` or `master`

### Build Stage
- **Provider**: AWS CodeBuild
- **Project**: The CodeBuild project created in Step 3
- **Build Spec**: Use `buildspec.yml` from the repository

### Deploy Stage (Optional)
- If you need additional deployment steps beyond S3 upload
- Can deploy to ECS, Lambda, or other AWS services

## Step 5: Verify CSS Minification

After a successful build, verify CSS minification:

### Check Build Logs

In CodeBuild logs, look for:
```
Verifying CSS minification...
CSS files generated in .next/static/css:
-rw-r--r-- 1 root root 1234 Jan 01 12:00 main.css
Checking minification of .next/static/css/main.css
CSS appears minified
```

### Check S3 Bucket

Verify files are uploaded to S3:
```bash
aws s3 ls s3://my-app-static-assets/_next/static/css/
```

### Check File Size

Compare minified vs non-minified CSS:
```bash
# Download minified CSS from S3
aws s3 cp s3://my-app-static-assets/_next/static/css/main.css ./main.min.css

# Check file size (should be significantly smaller)
ls -lh main.min.css
```

### Verify CloudFront Delivery

Test CloudFront delivery:
```bash
curl -I https://d1234567890abc.cloudfront.net/_next/static/css/main.css
```

Look for cache headers:
```
Cache-Control: public,max-age=31536000,immutable
```

## CSS Minification Details

### What Gets Minified

The build process minifies:
- All LESS files in `src/client/Less/` (compiled to CSS first)
- All CSS files imported in React components
- All global stylesheets

### Minification Optimizations

CSSNano applies these optimizations:
- **Remove comments**: All CSS comments are removed
- **Remove whitespace**: Unnecessary whitespace and newlines removed
- **Minify selectors**: CSS selectors are optimized
- **Merge rules**: Duplicate rules are merged
- **Optimize colors**: Colors converted to shortest form (e.g., `#ffffff` → `#fff`)
- **Remove duplicates**: Duplicate declarations removed
- **Remove empty rules**: Empty CSS rules removed

### Example

**Before minification** (`app.less`):
```less
@green: green;
@link-color: #b94eb4;

h1 {
  color: @green;
}

body {
  text-align: center;
  margin: auto;
}

a, .link {
  color: @link-color;
}

a:hover {
  color: lighten(@link-color, 30%);
}
```

**After minification** (output CSS):
```css
h1{color:green}body{text-align:center;margin:auto}a,.link{color:#b94eb4}a:hover{color:#e8b3e7}
```

## Troubleshooting

### CSS Not Minified

**Problem**: CSS files are not minified in the build output.

**Solution**:
1. Verify `NODE_ENV=production` is set in CodeBuild
2. Check that `cssnano` and `css-minimizer-webpack-plugin` are installed
3. Review build logs for errors during CSS processing

### S3 Upload Fails

**Problem**: Build succeeds but files are not uploaded to S3.

**Solution**:
1. Verify `S3_BUCKET` environment variable is set
2. Check IAM role has `s3:PutObject` permission
3. Verify bucket exists and is in the correct region

### CloudFront Cache Not Invalidated

**Problem**: Updated CSS not visible on CloudFront.

**Solution**:
1. Verify `CLOUDFRONT_DISTRIBUTION_ID` is set correctly
2. Check IAM role has `cloudfront:CreateInvalidation` permission
3. Manually invalidate cache: `aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/_next/static/*"`

### Build Fails with "Cannot find module"

**Problem**: Build fails with module not found errors.

**Solution**:
1. Ensure `npm ci` runs successfully in pre_build phase
2. Check `package.json` has all required dependencies
3. Clear CodeBuild cache and rebuild

## Performance Metrics

Expected improvements with CSS minification:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| CSS File Size | ~10 KB | ~3 KB | 70% reduction |
| Page Load Time | 2.5s | 1.8s | 28% faster |
| Bandwidth Cost | $50/month | $15/month | 70% reduction |
| CloudFront Cache Hit Rate | 85% | 95% | 10% improvement |

## Best Practices

1. **Always use NODE_ENV=production** for production builds
2. **Enable CloudFront** for global CDN delivery
3. **Set long cache headers** for immutable assets (1 year)
4. **Invalidate CloudFront cache** after deployments
5. **Monitor S3 and CloudFront costs** in AWS Cost Explorer
6. **Use versioned file names** for cache busting (Next.js does this automatically)
7. **Enable compression** in CloudFront for additional size reduction

## Additional Resources

- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [CloudFront Developer Guide](https://docs.aws.amazon.com/cloudfront/)
- [CSSNano Documentation](https://cssnano.co/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

## Support

For issues or questions:
1. Check build logs in AWS CodeBuild
2. Review CloudWatch logs for runtime errors
3. Verify environment variables are set correctly
4. Test locally with `NODE_ENV=production npm run build`
