# Trae IDE MCP Schema Begrænsninger

## 🚨 **Problemet**

Trae IDE har en specifik JSON schema for MCP konfiguration der ikke tillader alle properties som andre MCP implementeringer understøtter.

### **Ikke-tilladt Properties:**

1. **`"disabled": true/false`** - Bruges til at deaktivere servere
2. **`"type": "stdio"`** - Bruges til at specificere kommunikationstype
3. **`"autoApprove": []`** - Bruges til automatisk godkendelse

## ✅ **Løsningen**

### **I stedet for `"disabled": true`:**
```json
// ❌ Virker ikke i Trae
{
  "server-name": {
    "command": "npx",
    "args": ["server"],
    "disabled": true
  }
}

// ✅ Løsning: Fjern serveren helt
{
  // Server er ikke inkluderet
}
```

### **I stedet for `"type": "stdio"`:**
```json
// ❌ Virker ikke i Trae
{
  "sqlite-db": {
    "type": "stdio",
    "command": "npx",
    "args": ["mcp-server-sqlite"]
  }
}

// ✅ Løsning: Fjern type property
{
  "sqlite-db": {
    "command": "npx",
    "args": ["mcp-server-sqlite"]
  }
}
```

## 📋 **Tilladt Trae MCP Schema**

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx|uvx|node",
      "args": ["array", "of", "arguments"],
      "env": {
        "ENV_VAR": "value"
      },
      "fromGalleryId": "optional.gallery.id"
    }
  }
}
```

### **Påkrævede Properties:**
- `command` - Kommando til at starte serveren
- `args` - Array af argumenter

### **Valgfrie Properties:**
- `env` - Miljøvariabler
- `fromGalleryId` - Reference til MCP gallery

## 🔧 **Praktisk Håndtering**

### **For at deaktivere servere:**
1. **Kommentér ud** (ikke valid JSON, men kan bruges midlertidigt)
2. **Fjern helt** fra konfigurationen
3. **Flyt til separat fil** for backup

### **For stdio servere:**
- Fjern `"type": "stdio"` property
- De fleste MCP servere auto-detecter kommunikationstype

### **For autoApprove:**
- Håndteres på Trae IDE niveau, ikke i konfiguration

## 📝 **Opdaterede Konfigurationer**

### **Før (med fejl):**
```json
{
  "mcpServers": {
    "sqlite-db": {
      "type": "stdio",
      "command": "npx",
      "args": ["mcp-server-sqlite"],
      "disabled": false
    },
    "github-mcp": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "disabled": true
    }
  }
}
```

### **Efter (Trae-kompatibel):**
```json
{
  "mcpServers": {
    "sqlite-db": {
      "command": "npx",
      "args": ["mcp-server-sqlite"]
    }
    // github-mcp fjernet i stedet for disabled: true
  }
}
```

## 🎯 **Anbefalinger**

1. **Hold backup** af fuld konfiguration med alle properties
2. **Brug separate filer** for forskellige MCP clients
3. **Dokumentér deaktiverede servere** i kommentarer eller separate fil
4. **Test konfiguration** efter ændringer

## 📞 **Hvis du vil genaktivere deaktiverede servere:**

1. Tilføj dem tilbage til konfigurationen
2. Sørg for at API-nøgler er sat i `.env`
3. Genstart Trae IDE for at indlæse ændringer

**Trae IDE vil nu ikke vise JSON schema fejl!** ✅