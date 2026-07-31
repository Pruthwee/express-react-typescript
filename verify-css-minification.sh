#!/bin/bash
# CSS Minification Verification Script
# This script verifies that CSS minification is properly configured for AWS deployment

echo "=========================================="
echo "CSS Minification Configuration Verification"
echo "=========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to check if a file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} File missing: $1"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# Function to check if a string exists in a file
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found '$2' in $1"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Missing '$2' in $1"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# Function to check if a package is installed
check_package() {
    if npm list "$1" >/dev/null 2>&1 || grep -q "\"$1\"" package.json; then
        echo -e "${GREEN}✓${NC} Package installed: $1"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Package missing: $1"
        ((CHECKS_FAILED++))
        return 1
    fi
}

echo "1. Checking Configuration Files"
echo "--------------------------------"
check_file "buildspec.yml"
check_file "webpack.config.js"
check_file "next.config.js"
check_file "postcss.config.js"
check_file "package.json"
echo ""

echo "2. Checking Documentation Files"
echo "--------------------------------"
check_file "README.md"
check_file "AWS_DEPLOYMENT_GUIDE.md"
check_file "CSS_PROCESSING_PIPELINE.md"
check_file "CLOUD_READINESS_FIX_SUMMARY.md"
check_file ".env.codebuild.example"
echo ""

echo "3. Checking Package Dependencies"
echo "---------------------------------"
check_package "cssnano"
check_package "css-minimizer-webpack-plugin"
check_package "less"
check_package "less-loader"
check_package "postcss"
echo ""

echo "4. Checking Webpack Configuration"
echo "----------------------------------"
check_content "webpack.config.js" "CssMinimizerPlugin"
check_content "webpack.config.js" "minimize: true"
check_content "webpack.config.js" "less-loader"
check_content "webpack.config.js" "MiniCssExtractPlugin"
echo ""

echo "5. Checking Next.js Configuration"
echo "----------------------------------"
check_content "next.config.js" "CssMinimizerPlugin"
check_content "next.config.js" "NODE_ENV === 'production'"
echo ""

echo "6. Checking PostCSS Configuration"
echo "----------------------------------"
check_content "postcss.config.js" "cssnano"
check_content "postcss.config.js" "discardComments"
check_content "postcss.config.js" "normalizeWhitespace"
check_content "postcss.config.js" "minifySelectors"
echo ""

echo "7. Checking BuildSpec Configuration"
echo "------------------------------------"
check_content "buildspec.yml" "NODE_ENV=production"
check_content "buildspec.yml" "CSS minification"
check_content "buildspec.yml" "aws s3 sync"
check_content "buildspec.yml" "cloudfront create-invalidation"
echo ""

echo "8. Checking Source Files"
echo "------------------------"
LESS_FILE="/modernize-data/TNT1001/APP736748/sourcecode/CMP393403/SC188320/TNT1001_CMP393403_1785479012294/express-react-typescript/src/client/Less/app.less"
if [ -f "$LESS_FILE" ]; then
    echo -e "${GREEN}✓${NC} LESS source file exists"
    ((CHECKS_PASSED++))
    
    # Check for the specific lines mentioned in the violation
    if grep -q "a, .link {" "$LESS_FILE"; then
        echo -e "${GREEN}✓${NC} Found 'a, .link {' rule (line 33)"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} Missing 'a, .link {' rule"
        ((CHECKS_FAILED++))
    fi
    
    if grep -q "a:hover {" "$LESS_FILE"; then
        echo -e "${GREEN}✓${NC} Found 'a:hover {' rule (line 36)"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} Missing 'a:hover {' rule"
        ((CHECKS_FAILED++))
    fi
else
    echo -e "${RED}✗${NC} LESS source file not found"
    ((CHECKS_FAILED++))
fi
echo ""

echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks Failed: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! CSS minification is properly configured.${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Set environment variables in AWS CodeBuild:"
    echo "   - NODE_ENV=production"
    echo "   - S3_BUCKET=your-bucket-name"
    echo "   - CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id"
    echo "2. Trigger a build in AWS CodePipeline"
    echo "3. Verify minified CSS files in S3"
    echo "4. Test CloudFront delivery"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the configuration.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Run 'npm install' to install missing dependencies"
    echo "2. Review configuration files for missing settings"
    echo "3. Check documentation files are present"
    echo ""
    exit 1
fi
