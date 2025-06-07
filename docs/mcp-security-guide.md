# MCP Security Guide

## 🔒 Sikkerhedspraksis for MCP-konfiguration

### ✅ Best Practices

#### 1. Miljøvariabler
- **ALDRIG** hardcode API-nøgler direkte i konfigurationsfiler
- Brug altid miljøvariabler: `"API_KEY": "${API_KEY_NAME}"`
- Hold API-nøgler i `.env` filen (som er i `.gitignore`)

#### 2. .env Fil Sikkerhed
```bash
# ✅ Korrekt - API-nøgler i .env
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AIzaSy...
FIRECRAWL_API_KEY=fc-...
EXA_API_KEY=exa-...
```

#### 3. MCP Konfiguration
```json
{
  "env": {
    "OPENAI_API_KEY": "${OPENAI_API_KEY}",
    "GEMINI_API_KEY": "${GOOGLE_API_KEY}"
  }
}
```

### ❌ Undgå disse fejl

#### 1. Hardcodede nøgler
```json
// ❌ ALDRIG gør dette
{
  "env": {
    "API_KEY": "sk-proj-xHgAHUBo_fs1bsutuhLATdrxnVMJ5XLxLYqEGFuI..."
  }
}
```

#### 2. Commit af følsomme data
- Tjek altid `.gitignore` indeholder `.env`
- Brug `git status` før commit
- Overvej at bruge `git-secrets` eller lignende værktøjer

### 🛡️ Sikkerhedstjek

#### Før commit:
```bash
# Tjek at .env ikke er tracked
git status

# Søg efter potentielle API-nøgler i kode
grep -r "sk-" . --exclude-dir=node_modules
grep -r "AIza" . --exclude-dir=node_modules
```

#### .gitignore skal indeholde:
```
.env
.env.local
.env.production
*.key
secrets/
```

### 🔄 Rotation af API-nøgler

1. **Regelmæssig rotation** - Skift API-nøgler hver 3-6 måneder
2. **Ved kompromittering** - Skift straks og revoke gamle nøgler
3. **Dokumenter rotation** - Hold styr på hvornår nøgler blev skiftet

### 📋 Tjekliste

- [ ] API-nøgler er i `.env` fil
- [ ] MCP-config bruger miljøvariabler
- [ ] `.env` er i `.gitignore`
- [ ] Ingen hardcodede nøgler i kode
- [ ] Regelmæssig rotation planlagt

### 🚨 Hvis API-nøgle er kompromitteret

1. **Straks**: Revoke nøglen i provider's dashboard
2. **Generer ny** nøgle
3. **Opdater** `.env` fil
4. **Test** at alt fungerer
5. **Dokumenter** incident

### 🚨 Kendte problemer

#### codegen-mcp server
- **Problem**: ModuleNotFoundError: No module named 'codegen.extensions.tools'
- **Status**: Deaktiveret på grund af dependency-problemer
- **Alternativ**: GitHub MCP server tilføjet som erstatning

### 📞 Kontakt

Ved sikkerhedsspørgsmål, kontakt projektansvarlig eller sikkerhedsteam.