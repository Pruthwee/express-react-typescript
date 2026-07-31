#!/bin/bash

# Script to verify node_modules is not committed to Git
# This script helps ensure cloud-native dependency management best practices

echo "=========================================="
echo "Dependency Management Verification Script"
echo "=========================================="
echo ""

# Check if we're in a Git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not a Git repository"
    exit 1
fi

echo "✓ Git repository detected"
echo ""

# Check if .gitignore exists
if [ ! -f ".gitignore" ]; then
    echo "❌ Error: .gitignore file not found"
    exit 1
fi

echo "✓ .gitignore file exists"
echo ""

# Check if node_modules is in .gitignore
if grep -q "node_modules" .gitignore; then
    echo "✓ node_modules is listed in .gitignore"
else
    echo "❌ Warning: node_modules is NOT in .gitignore"
    echo "   Add 'node_modules/' to .gitignore"
fi
echo ""

# Check if node_modules is tracked by Git
echo "Checking if node_modules is tracked by Git..."
if git ls-files | grep -q "node_modules"; then
    echo "❌ ERROR: node_modules is tracked by Git!"
    echo ""
    echo "To fix this, run:"
    echo "  git rm -r --cached node_modules/"
    echo "  git commit -m 'Remove node_modules from version control'"
    echo ""
    exit 1
else
    echo "✓ node_modules is NOT tracked by Git (correct)"
fi
echo ""

# Check for lock files
echo "Checking for lock files..."
LOCK_FILE_FOUND=false

if [ -f "package-lock.json" ]; then
    echo "✓ package-lock.json found"
    LOCK_FILE_FOUND=true
fi

if [ -f "yarn.lock" ]; then
    echo "✓ yarn.lock found"
    LOCK_FILE_FOUND=true
fi

if [ "$LOCK_FILE_FOUND" = false ]; then
    echo "❌ Warning: No lock file found (package-lock.json or yarn.lock)"
    echo "   Run 'npm install' or 'yarn install' to generate a lock file"
fi
echo ""

# Check if lock files are tracked by Git
echo "Checking if lock files are tracked by Git..."
LOCK_TRACKED=false

if [ -f "package-lock.json" ]; then
    if git ls-files | grep -q "package-lock.json"; then
        echo "✓ package-lock.json is tracked by Git (correct)"
        LOCK_TRACKED=true
    else
        echo "❌ Warning: package-lock.json exists but is not tracked by Git"
        echo "   Run: git add package-lock.json && git commit -m 'Add package-lock.json'"
    fi
fi

if [ -f "yarn.lock" ]; then
    if git ls-files | grep -q "yarn.lock"; then
        echo "✓ yarn.lock is tracked by Git (correct)"
        LOCK_TRACKED=true
    else
        echo "❌ Warning: yarn.lock exists but is not tracked by Git"
        echo "   Run: git add yarn.lock && git commit -m 'Add yarn.lock'"
    fi
fi

if [ "$LOCK_TRACKED" = false ]; then
    echo "❌ Warning: No lock file is tracked by Git"
fi
echo ""

# Check for buildspec.yml (AWS CodeBuild configuration)
if [ -f "buildspec.yml" ]; then
    echo "✓ buildspec.yml found (AWS CodeBuild configuration)"
    
    # Check if buildspec uses npm ci or yarn frozen-lockfile
    if grep -q "npm ci\|yarn install --frozen-lockfile" buildspec.yml; then
        echo "✓ buildspec.yml uses reproducible dependency installation"
    else
        echo "⚠ Warning: buildspec.yml may not use reproducible dependency installation"
        echo "   Consider using 'npm ci' or 'yarn install --frozen-lockfile'"
    fi
else
    echo "ℹ buildspec.yml not found (optional for AWS CodeBuild)"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""

if git ls-files | grep -q "node_modules"; then
    echo "❌ FAILED: node_modules is committed to Git"
    echo ""
    echo "Action Required:"
    echo "1. Remove node_modules from Git: git rm -r --cached node_modules/"
    echo "2. Commit the change: git commit -m 'Remove node_modules from version control'"
    echo "3. Ensure .gitignore contains 'node_modules/'"
    echo ""
    exit 1
else
    echo "✅ PASSED: Dependency management follows cloud-native best practices"
    echo ""
    echo "Your project correctly:"
    echo "  • Excludes node_modules from version control"
    echo "  • Uses lock files for reproducible builds"
    echo "  • Is ready for AWS CodeBuild/CodePipeline deployment"
    echo ""
fi

echo "For AWS CodeArtifact setup, see: AWS_CODEARTIFACT_SETUP.md"
echo ""
