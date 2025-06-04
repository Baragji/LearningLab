#!/bin/bash

echo "=== PROJECT AUDIT ==="
echo "Dato: $(date)"
echo "Projekt: $(basename $(pwd))"
echo "Sti: $(pwd)"
echo ""

# Farver til output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

section() {
    echo -e "${BLUE}📋 $1${NC}"
    echo "----------------------------------------"
}

# 1. PROJEKT STRUKTUR
section "PROJEKT STRUKTUR (alle vigtige filer)"
find . -type f \( -name "*.py" -o -name "*.md" -o -name "Dockerfile*" -o -name "*.sh" -o -name "*.txt" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" \) | sort

echo ""

# 2. DOCKER FILER
section "DOCKER FILER"
if ls Dockerfile* 2>/dev/null; then
    for dockerfile in Dockerfile*; do
        echo -e "${GREEN}📄 $dockerfile${NC} ($(wc -l < "$dockerfile") linjer)"
        echo "   Første 3 linjer:"
        head -3 "$dockerfile" | sed 's/^/   /'
        echo ""
    done
else
    echo -e "${RED}❌ Ingen Dockerfile fundet${NC}"
fi

# 3. PYTHON FILER
section "PYTHON FILER"
python_files=$(find . -name "*.py" | head -15)
if [ -n "$python_files" ]; then
    echo "$python_files" | while read file; do
        lines=$(wc -l < "$file" 2>/dev/null || echo "0")
        echo -e "${GREEN}🐍 $file${NC} ($lines linjer)"
        
        # Vis første linje hvis det er en shebang eller docstring
        first_line=$(head -1 "$file" 2>/dev/null)
        if [[ "$first_line" == "#!"* ]] || [[ "$first_line" == '"""'* ]]; then
            echo "   $first_line"
        fi
    done
else
    echo -e "${RED}❌ Ingen Python filer fundet${NC}"
fi

echo ""

# 4. REQUIREMENTS OG DEPENDENCIES
section "REQUIREMENTS OG DEPENDENCIES"
for req_file in requirements.txt requirements-*.txt pyproject.toml setup.py; do
    if [ -f "$req_file" ]; then
        lines=$(wc -l < "$req_file")
        echo -e "${GREEN}📦 $req_file${NC} ($lines linjer)"
        echo "   Første 5 dependencies:"
        head -5 "$req_file" | grep -v "^#" | grep -v "^$" | sed 's/^/   /' || echo "   (ingen synlige dependencies)"
        echo ""
    fi
done

# 5. SCRIPTS OG AUTOMATION
section "SCRIPTS OG AUTOMATION"
script_files=$(find . -name "*.sh" -o -name "start-*" -o -name "deploy*" -o -name "build*" | head -10)
if [ -n "$script_files" ]; then
    echo "$script_files" | while read file; do
        if [ -f "$file" ]; then
            lines=$(wc -l < "$file")
            executable=""
            if [ -x "$file" ]; then
                executable=" (executable ✅)"
            else
                executable=" (not executable ❌)"
            fi
            echo -e "${GREEN}🚀 $file${NC} ($lines linjer)$executable"
        fi
    done
else
    echo -e "${YELLOW}⚠️ Ingen script filer fundet${NC}"
fi

echo ""

# 6. DOKUMENTATION
section "DOKUMENTATION"
for doc in README.md README.txt CHANGELOG.md NOTES.md *.md; do
    if [ -f "$doc" ]; then
        lines=$(wc -l < "$doc")
        size=$(ls -lh "$doc" | awk '{print $5}')
        echo -e "${GREEN}📖 $doc${NC} ($lines linjer, $size)"
        
        # Vis første overskrift hvis det er markdown
        if [[ "$doc" == *.md ]]; then
            first_header=$(grep -m 1 "^#" "$doc" 2>/dev/null || echo "")
            if [ -n "$first_header" ]; then
                echo "   $first_header"
            fi
        fi
    fi
done

echo ""

# 7. FILSTØRRELSER (største filer)
section "STØRSTE FILER (top 10)"
find . -type f -exec ls -lh {} \; 2>/dev/null | sort -k5 -hr | head -10 | while read line; do
    echo "   $line"
done

echo ""

# 8. SYSTEM INFO
section "SYSTEM INFORMATION"
echo "🐍 Python version: $(python3 --version 2>/dev/null || echo 'Python3 ikke fundet')"
echo "🐳 Docker version: $(docker --version 2>/dev/null || echo 'Docker ikke fundet')"
echo "☁️ gcloud version: $(gcloud --version 2>/dev/null | head -1 || echo 'gcloud ikke fundet')"
echo "💾 Disk space: $(df -h . | tail -1 | awk '{print $4}' || echo 'Ukendt') ledig"
echo "🌍 Miljøvariabler (RAG relaterede):"
env | grep -i "rag\|ollama\|docker\|gcp\|cloud" | sed 's/^/   /' || echo "   Ingen RAG-relaterede miljøvariabler fundet"

echo ""

# 9. POTENTIELLE PROBLEMER
section "POTENTIELLE PROBLEMER"
problems=0

# Check for common issues
if [ ! -f "requirements.txt" ] && [ ! -f "pyproject.toml" ]; then
    echo -e "${RED}❌ Ingen requirements.txt eller pyproject.toml fundet${NC}"
    problems=$((problems + 1))
fi

if [ ! -f "Dockerfile" ] && [ ! -f "Dockerfile.direct" ]; then
    echo -e "${RED}❌ Ingen Dockerfile fundet${NC}"
    problems=$((problems + 1))
fi

# Check for large files that might cause issues
large_files=$(find . -type f -size +100M 2>/dev/null)
if [ -n "$large_files" ]; then
    echo -e "${YELLOW}⚠️ Store filer fundet (>100MB):${NC}"
    echo "$large_files" | sed 's/^/   /'
    problems=$((problems + 1))
fi

# Check for Python cache
if [ -d "__pycache__" ] || find . -name "*.pyc" | grep -q .; then
    echo -e "${YELLOW}⚠️ Python cache filer fundet - bør ryddes op${NC}"
    problems=$((problems + 1))
fi

if [ $problems -eq 0 ]; then
    echo -e "${GREEN}✅ Ingen åbenlyse problemer fundet${NC}"
fi

echo ""

# 10. ANBEFALINGER
section "NÆSTE SKRIDT ANBEFALINGER"
echo "1. 🧹 Ryd op i Python cache: find . -name '__pycache__' -exec rm -rf {} + 2>/dev/null"
echo "2. 📋 Opret minimal test setup baseret på fund"
echo "3. 🐳 Test Docker build lokalt før cloud deployment"
echo "4. 📊 Fokuser på de vigtigste filer først"

echo ""
echo "=== AUDIT FÆRDIG ==="
echo -e "${GREEN}📄 Gem dette output: ./audit-project.sh > project-audit.txt${NC}"