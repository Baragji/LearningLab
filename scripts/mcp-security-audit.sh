#!/bin/bash

# MCP Security Audit Script
# Implements comprehensive security checks for MCP configuration

set -e

echo "🔍 MCP Security Audit - $(date)"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ISSUES_FOUND=0
WARNINGS_FOUND=0

# Function to log issues
log_issue() {
    echo -e "${RED}❌ ISSUE: $1${NC}"
    ((ISSUES_FOUND++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNINGS_FOUND++))
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Check for hardcoded secrets
echo -e "\n${BLUE}1. Checking for hardcoded secrets...${NC}"
if grep -r "sk-proj-" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist 2>/dev/null; then
    log_issue "OpenAI API keys found in code"
else
    log_success "No OpenAI keys found in code"
fi

if grep -r "AIza" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist 2>/dev/null; then
    log_issue "Google API keys found in code"
else
    log_success "No Google API keys found in code"
fi

# 2. Check .env file security
echo -e "\n${BLUE}2. Checking .env file security...${NC}"
if [ -f ".env" ]; then
    ENV_PERMS=$(stat -f "%A" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
    if [ "$ENV_PERMS" != "600" ] && [ "$ENV_PERMS" != "644" ]; then
        log_warning ".env file permissions are $ENV_PERMS (should be 600 or 644)"
    else
        log_success ".env file permissions are secure ($ENV_PERMS)"
    fi
    
    # Check if .env is in .gitignore
    if grep -q "^\.env$" .gitignore 2>/dev/null; then
        log_success ".env is properly ignored by git"
    else
        log_issue ".env is not in .gitignore"
    fi
else
    log_warning ".env file not found"
fi

# 3. Check MCP configuration security
echo -e "\n${BLUE}3. Checking MCP configuration security...${NC}"
if [ -f ".trae/mcp-config.json" ]; then
    # Check for environment variable usage
    if grep -q "\${" .trae/mcp-config.json; then
        log_success "MCP config uses environment variables"
    else
        log_warning "MCP config might not be using environment variables"
    fi
    
    # Check for hardcoded credentials
    if grep -q "sk-" .trae/mcp-config.json; then
        log_issue "Hardcoded API keys found in MCP config"
    else
        log_success "No hardcoded API keys in MCP config"
    fi
    
    # Check for security restrictions
    if grep -q "MCP_FILESYSTEM_DENIED_PATTERNS" .trae/mcp-config.json; then
        log_success "Filesystem restrictions configured"
    else
        log_warning "No filesystem restrictions found"
    fi
else
    log_warning "MCP config file not found"
fi

# 4. Check for exposed ports
echo -e "\n${BLUE}4. Checking for exposed ports...${NC}"
EXPOSED_PORTS=$(netstat -tulpn 2>/dev/null | grep LISTEN | grep -E ":(3000|8080|5432|6379|7687)" || true)
if [ -n "$EXPOSED_PORTS" ]; then
    log_info "Found exposed development ports:"
    echo "$EXPOSED_PORTS"
    log_warning "Development ports are exposed (normal for development)"
else
    log_success "No unexpected exposed ports found"
fi

# 5. Check Docker security
echo -e "\n${BLUE}5. Checking Docker security...${NC}"
if [ -f "docker-compose.yml" ]; then
    # Check for default passwords
    if grep -q "password.*password\|password.*123\|password.*admin" docker-compose.yml; then
        log_issue "Default passwords found in docker-compose.yml"
    else
        log_success "No default passwords in docker-compose.yml"
    fi
    
    # Check for environment file usage
    if grep -q "env_file\|environment" docker-compose.yml; then
        log_success "Docker compose uses environment configuration"
    else
        log_warning "Docker compose might not use environment files"
    fi
else
    log_info "Docker compose file not found"
fi

# 6. Check dependency security
echo -e "\n${BLUE}6. Checking dependency security...${NC}"
if command -v npm &> /dev/null; then
    if [ -f "package.json" ]; then
        log_info "Running npm audit..."
        if npm audit --audit-level=high 2>/dev/null; then
            log_success "No high-severity vulnerabilities found"
        else
            log_warning "High-severity vulnerabilities found - run 'npm audit fix'"
        fi
    fi
fi

# 7. Check file permissions
echo -e "\n${BLUE}7. Checking critical file permissions...${NC}"
CRITICAL_FILES=(".env" "package.json" ".trae/mcp-config.json")
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        PERMS=$(stat -f "%A" "$file" 2>/dev/null || stat -c "%a" "$file" 2>/dev/null)
        if [ "$PERMS" = "777" ] || [ "$PERMS" = "666" ]; then
            log_issue "$file has overly permissive permissions ($PERMS)"
        else
            log_success "$file permissions are acceptable ($PERMS)"
        fi
    fi
done

# 8. Check for backup files
echo -e "\n${BLUE}8. Checking for backup files...${NC}"
BACKUP_FILES=$(find . -name "*.bak" -o -name "*.backup" -o -name "*~" -o -name "*.orig" 2>/dev/null | head -10)
if [ -n "$BACKUP_FILES" ]; then
    log_warning "Backup files found (might contain sensitive data):"
    echo "$BACKUP_FILES"
else
    log_success "No backup files found"
fi

# 9. Check git configuration
echo -e "\n${BLUE}9. Checking git configuration...${NC}"
if [ -d ".git" ]; then
    # Check if sensitive files are tracked
    TRACKED_SENSITIVE=$(git ls-files | grep -E "\.(env|key|pem|p12)$" || true)
    if [ -n "$TRACKED_SENSITIVE" ]; then
        log_issue "Sensitive files are tracked by git:"
        echo "$TRACKED_SENSITIVE"
    else
        log_success "No sensitive files tracked by git"
    fi
    
    # Check .gitignore
    if [ -f ".gitignore" ]; then
        if grep -q "\.env\|\.key\|node_modules" .gitignore; then
            log_success ".gitignore includes common sensitive patterns"
        else
            log_warning ".gitignore might be missing sensitive file patterns"
        fi
    else
        log_warning ".gitignore file not found"
    fi
fi

# 10. Generate security recommendations
echo -e "\n${BLUE}10. Security Recommendations...${NC}"
echo "📋 Security Checklist:"
echo "  □ Rotate API keys every 3-6 months"
echo "  □ Use different API keys for development/production"
echo "  □ Enable 2FA on all service accounts"
echo "  □ Regular security audits (monthly)"
echo "  □ Monitor API usage and costs"
echo "  □ Implement rate limiting"
echo "  □ Use HTTPS for all external communications"
echo "  □ Regular backup of configuration"

# Summary
echo -e "\n${BLUE}================================${NC}"
echo -e "${BLUE}Security Audit Summary${NC}"
echo -e "================================"

if [ $ISSUES_FOUND -eq 0 ] && [ $WARNINGS_FOUND -eq 0 ]; then
    echo -e "${GREEN}🎉 Excellent! No security issues found.${NC}"
    exit 0
elif [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS_FOUND warning(s) found. Review recommended.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ISSUES_FOUND critical issue(s) and $WARNINGS_FOUND warning(s) found.${NC}"
    echo -e "${RED}Please address critical issues before deployment.${NC}"
    exit 1
fi