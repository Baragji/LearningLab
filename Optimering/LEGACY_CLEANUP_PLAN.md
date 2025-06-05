# 🧹 LEGACY FILER & CLEANUP PLAN

## 📊 IDENTIFICEREDE FORÆLDEDE FILER

### Backup & Legacy Directories

```
gcp-migration/_old_lies_backup/ # Gamle backup filer - kan fjernes
.qodo/                         # Qodo AI filer - kan fjernes hvis ikke brugt
.repomix/                      # Repomix bundles - kan fjernes
.trae/                         # TRAE agent filer - evaluer om nødvendige
```

### Duplikerede Konfigurationsfiler

```
.env.example                   # Duplikeret i apps/
nginx.conf                     # Duplikeret i packages/config/
```

### Forældede Scripts

```
install-code-assistant.sh      # Gamle installation scripts
install-code-assistant-fixed.sh
fix-metal-compilation.sh       # Metal compilation fix - kan fjernes efter fix
```

### Test & Development Filer

```
test_rag/                      # Test filer for RAG - evaluer
fast_rag.py                    # Standalone RAG script - kan fjernes
mission_control.py             # Mission control script - evaluer
```

### Documentation Overload

```
Agentopsætning.md             # Agent setup - konsolider
MCPEnterprise_Agent_Prompt.md # MCP prompts - konsolider
MCP_CODE_ASSISTANT_TEST_RAPPORT.md # Test rapporter - arkiver
METAL_COMPILATION_FIX.md      # Fix dokumentation - fjern efter fix
```

## 🎯 CLEANUP STRATEGI

### Fase 1: Sikker Fjernelse (Dag 1)

Filer der sikkert kan fjernes uden påvirkning af funktionalitet

### Fase 2: Evaluering (Dag 2)

Filer der kræver evaluering før fjernelse

### Fase 3: Konsolidering (Dag 3)

Duplikerede filer der skal konsolideres

### Fase 4: Arkivering (Dag 4)

Vigtige filer der skal arkiveres i stedet for fjernes

## 📋 DETALJERET CLEANUP PLAN

### Fase 1: Sikker Fjernelse

#### 1.1 Backup Directories

```bash
# Fjern gamle backup filer
rm -rf gcp-migration/_old_lies_backup/
```

#### 1.2 Build Artifacts

```bash
# Fjern build cache og artifacts
rm -rf .turbo/
rm -rf apps/*/dist/
rm -rf packages/*/dist/
rm -rf apps/*/.next/
rm -rf node_modules/.cache/

# Fjern test coverage
rm -rf coverage/
rm -rf apps/*/coverage/
rm -rf packages/*/coverage/
```

#### 1.3 Temporary Files

```bash
# Fjern log filer
find . -name "*.log" -type f -delete
find . -name "npm-debug.log*" -type f -delete
find . -name "yarn-debug.log*" -type f -delete
find . -name "yarn-error.log*" -type f -delete

# Fjern OS specifikke filer
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete
```

### Fase 2: Evaluering & Conditional Cleanup

#### 2.1 Development Tools

```bash
# Evaluer om disse tools stadig bruges:
# .qodo/ - Qodo AI integration
# .repomix/ - Repository bundling
# .trae/ - TRAE agent configuration

# Script til evaluering:
#!/bin/bash
echo "Evaluating development tools usage..."

# Check for recent access
find .qodo -type f -atime -30 2>/dev/null && echo "Qodo recently accessed" || echo "Qodo not recently used"
find .repomix -type f -atime -30 2>/dev/null && echo "Repomix recently accessed" || echo "Repomix not recently used"
find .trae -type f -atime -30 2>/dev/null && echo "TRAE recently accessed" || echo "TRAE not recently used"
```

#### 2.2 Scripts Evaluation

```bash
# Evaluer scripts for aktuel relevans
scripts_to_evaluate=(
    "install-code-assistant.sh"
    "install-code-assistant-fixed.sh"
    "fix-metal-compilation.sh"
    "fast_rag.py"
    "mission_control.py"
    "test_agent_readiness.py"
)

for script in "${scripts_to_evaluate[@]}"; do
    if [ -f "$script" ]; then
        echo "Evaluating: $script"
        # Check if script is referenced in other files
        grep -r "$script" . --exclude-dir=node_modules --exclude-dir=.git
    fi
done
```

### Fase 3: Konsolidering

#### 3.1 Environment Files

```bash
# Konsolider .env.example filer
# Root .env.example skal være master
# Apps kan have specifikke additions

# Merge apps/api/.env.example til root
cat apps/api/.env.example >> .env.example.temp
cat apps/web/.env.example >> .env.example.temp

# Remove duplicates og sorter
sort .env.example.temp | uniq > .env.example.consolidated
mv .env.example.consolidated .env.example
rm .env.example.temp

# Fjern duplikerede env filer
rm -f apps/api/.env.example
rm -f apps/web/.env.example
```

#### 3.2 Configuration Files

```bash
# Konsolider nginx konfiguration
# Behold kun packages/config/nginx.conf
# Fjern root nginx.conf hvis identisk

diff nginx.conf packages/config/nginx.conf
if [ $? -eq 0 ]; then
    echo "nginx.conf files are identical, removing root copy"
    rm nginx.conf
else
    echo "nginx.conf files differ, manual review needed"
fi
```

#### 3.3 Documentation Consolidation

```bash
# Opret docs/archive/ for gamle dokumenter
mkdir -p docs/archive/

# Flyt forældede dokumenter til arkiv
mv MCPEnterprise_Agent_Prompt.md docs/archive/
mv MCP_CODE_ASSISTANT_TEST_RAPPORT.md docs/archive/
mv MCP_TOOLS_TEST_RAPPORT.md docs/archive/
mv METAL_COMPILATION_FIX.md docs/archive/
mv Agentopsætning.md docs/archive/
```

### Fase 4: Arkivering

#### 4.1 Opret Arkiv Struktur

```bash
mkdir -p archive/{scripts,docs,configs,tests}

# Arkiver i stedet for at slette
mv install-code-assistant*.sh archive/scripts/
mv fix-metal-compilation.sh archive/scripts/
mv test_agent_readiness.py archive/scripts/
mv fast_rag.py archive/scripts/
mv mission_control.py archive/scripts/
```

#### 4.2 Opret Archive README

```markdown
# Archive Directory

Dette directory indeholder filer der er fjernet fra aktiv brug men bevaret for reference.

## Scripts

- `install-code-assistant*.sh` - Gamle installation scripts
- `fix-metal-compilation.sh` - Metal compilation fix
- `test_agent_readiness.py` - Agent readiness test
- `fast_rag.py` - Standalone RAG implementation
- `mission_control.py` - Mission control script

## Documentation

- `MCPEnterprise_Agent_Prompt.md` - MCP Enterprise agent prompts
- `MCP_CODE_ASSISTANT_TEST_RAPPORT.md` - Test rapporter
- `METAL_COMPILATION_FIX.md` - Metal compilation fix dokumentation
- `Agentopsætning.md` - Agent setup guide

## Configs

- Gamle konfigurationsfiler der er blevet konsolideret

## Tests

- Forældede test filer og test data
```

## 🔍 AUTOMATED CLEANUP SCRIPT

### cleanup.sh

```bash
#!/bin/bash

set -e

echo "🧹 Starting LearningLab Cleanup Process..."

# Backup current state
echo "📦 Creating backup..."
git add -A
git commit -m "Pre-cleanup backup" || echo "No changes to commit"
git tag "pre-cleanup-$(date +%Y%m%d-%H%M%S)"

# Phase 1: Safe Removals
echo "🗑️  Phase 1: Safe Removals"

# Remove backup directories
echo "Removing backup directories..."
rm -rf gcp-migration/_old_lies_backup/

# Remove build artifacts
echo "Removing build artifacts..."
rm -rf .turbo/
find . -name "dist" -type d -path "*/apps/*" -exec rm -rf {} + 2>/dev/null || true
find . -name "dist" -type d -path "*/packages/*" -exec rm -rf {} + 2>/dev/null || true
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "coverage" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove temporary files
echo "Removing temporary files..."
find . -name "*.log" -type f -delete 2>/dev/null || true
find . -name "npm-debug.log*" -type f -delete 2>/dev/null || true
find . -name "yarn-debug.log*" -type f -delete 2>/dev/null || true
find . -name "yarn-error.log*" -type f -delete 2>/dev/null || true
find . -name ".DS_Store" -type f -delete 2>/dev/null || true
find . -name "Thumbs.db" -type f -delete 2>/dev/null || true

# Phase 2: Conditional Cleanup
echo "🔍 Phase 2: Conditional Cleanup"

# Check if development tools are recently used
if [ ! -f .qodo/.last_used ] || [ $(find .qodo -type f -atime +30 | wc -l) -gt 0 ]; then
    echo "Removing unused Qodo files..."
    rm -rf .qodo/
fi

if [ ! -f .repomix/.last_used ] || [ $(find .repomix -type f -atime +30 | wc -l) -gt 0 ]; then
    echo "Removing unused Repomix files..."
    rm -rf .repomix/
fi

# Phase 3: Archiving
echo "📚 Phase 3: Archiving"

# Create archive structure
mkdir -p archive/{scripts,docs,configs,tests}

# Archive scripts
echo "Archiving scripts..."
[ -f install-code-assistant.sh ] && mv install-code-assistant.sh archive/scripts/
[ -f install-code-assistant-fixed.sh ] && mv install-code-assistant-fixed.sh archive/scripts/
[ -f fix-metal-compilation.sh ] && mv fix-metal-compilation.sh archive/scripts/
[ -f test_agent_readiness.py ] && mv test_agent_readiness.py archive/scripts/
[ -f fast_rag.py ] && mv fast_rag.py archive/scripts/
[ -f mission_control.py ] && mv mission_control.py archive/scripts/

# Archive documentation
echo "Archiving documentation..."
[ -f MCPEnterprise_Agent_Prompt.md ] && mv MCPEnterprise_Agent_Prompt.md archive/docs/
[ -f MCP_CODE_ASSISTANT_TEST_RAPPORT.md ] && mv MCP_CODE_ASSISTANT_TEST_RAPPORT.md archive/docs/
[ -f MCP_TOOLS_TEST_RAPPORT.md ] && mv MCP_TOOLS_TEST_RAPPORT.md archive/docs/
[ -f METAL_COMPILATION_FIX.md ] && mv METAL_COMPILATION_FIX.md archive/docs/
[ -f Agentopsætning.md ] && mv Agentopsætning.md archive/docs/

# Create archive README
cat > archive/README.md << 'EOF'
# Archive Directory

Dette directory indeholder filer der er fjernet fra aktiv brug men bevaret for reference.

## Scripts
Gamle scripts der ikke længere er nødvendige for daglig drift.

## Documentation
Forældede dokumentation der er blevet erstattet eller konsolideret.

## Configs
Gamle konfigurationsfiler der er blevet konsolideret.

## Tests
Forældede test filer og test data.

---
Arkiveret: $(date)
EOF

# Phase 4: Consolidation
echo "🔄 Phase 4: Consolidation"

# Consolidate environment files
if [ -f apps/api/.env.example ] && [ -f apps/web/.env.example ]; then
    echo "Consolidating environment files..."
    {
        echo "# API Environment Variables"
        cat apps/api/.env.example
        echo ""
        echo "# Web Environment Variables"
        cat apps/web/.env.example
    } >> .env.example.temp

    # Remove duplicates and sort
    sort .env.example.temp | uniq > .env.example.consolidated
    mv .env.example.consolidated .env.example
    rm .env.example.temp

    # Remove duplicated files
    rm -f apps/api/.env.example
    rm -f apps/web/.env.example
fi

# Final cleanup
echo "🧽 Final cleanup..."
yarn install --frozen-lockfile
yarn clean

echo "✅ Cleanup completed successfully!"
echo "📊 Summary:"
echo "   - Removed backup directories"
echo "   - Cleaned build artifacts"
echo "   - Archived legacy files"
echo "   - Consolidated configurations"
echo ""
echo "🔍 Review the changes and commit if satisfied:"
echo "   git add -A"
echo "   git commit -m 'feat: comprehensive codebase cleanup'"
```

## 📊 CLEANUP METRICS

### Before Cleanup

```bash
# Measure current state
echo "📊 Before Cleanup Metrics:"
echo "Total files: $(find . -type f | wc -l)"
echo "Total size: $(du -sh . | cut -f1)"
echo "Node modules size: $(du -sh node_modules 2>/dev/null | cut -f1 || echo 'N/A')"
echo "Git repo size: $(du -sh .git | cut -f1)"
```

### After Cleanup

```bash
# Measure after cleanup
echo "📊 After Cleanup Metrics:"
echo "Total files: $(find . -type f | wc -l)"
echo "Total size: $(du -sh . | cut -f1)"
echo "Node modules size: $(du -sh node_modules 2>/dev/null | cut -f1 || echo 'N/A')"
echo "Git repo size: $(du -sh .git | cut -f1)"
echo "Archived files: $(find archive -type f | wc -l)"
```

## 📋 IMPLEMENTATION CHECKLIST

### Pre-Cleanup

- [ ] Create git backup tag
- [ ] Document current state
- [ ] Verify git status is clean
- [ ] Run baseline tests

### Phase 1: Safe Removals

- [ ] Remove \_old_lies_backup/
- [ ] Remove build artifacts
- [ ] Remove temporary files
- [ ] Remove OS specific files

### Phase 2: Conditional Cleanup

- [ ] Evaluate .qodo/ usage
- [ ] Evaluate .repomix/ usage
- [ ] Evaluate .trae/ usage
- [ ] Check script dependencies
- [ ] Remove unused tools

### Phase 3: Archiving

- [ ] Create archive structure
- [ ] Archive legacy scripts
- [ ] Archive old documentation
- [ ] Archive old configs
- [ ] Create archive README

### Phase 4: Consolidation

- [ ] Consolidate .env files
- [ ] Consolidate nginx configs
- [ ] Consolidate documentation
- [ ] Update references
- [ ] Test functionality

### Post-Cleanup

- [ ] Run tests to verify functionality
- [ ] Update documentation
- [ ] Commit changes
- [ ] Measure improvements
- [ ] Update .gitignore if needed

## 🚀 SUCCESS CRITERIA

### File Reduction

- [ ] 30%+ reduction in total files
- [ ] 50%+ reduction in repository size
- [ ] Elimination of duplicate files
- [ ] Clear archive organization

### Maintainability

- [ ] Cleaner project structure
- [ ] Reduced confusion
- [ ] Better organization
- [ ] Updated documentation

### Performance

- [ ] Faster git operations
- [ ] Faster builds
- [ ] Reduced disk usage
- [ ] Improved IDE performance

---

_Denne plan sikrer en systematisk og sikker oprydning af forældede filer med bevarelse af vigtig historik._
