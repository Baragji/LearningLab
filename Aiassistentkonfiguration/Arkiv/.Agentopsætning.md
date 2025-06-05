--

## Agentopsætning.md (100 % synkron med GUI’en på dine billeder)

````md
# Opsætning af AI-agenter i Trae IDE (v0.37.4-stable)

> TL;DR
>
> 1. Chatten ligger i **Trae-fanen**.
> 2. Agenter oprettes/opdateres i **Agents-fanen** (øverst på top-navbar).
> 3. MCP-servers håndteres i **MCP → Marketplace / Configure Manually**.
> 4. Kode- og doc-kontekst styres i **Context-fanen**.
> 5. Globale/User-rules redigeres via **Rules-fanen**.
> 6. Modelliste findes under **Models**.

---

## 1. Top-navbar og hvad der gemmer sig bag hvert punkt 🖥️

| Fane (øverst) | Formål i praksis                                                                                                                                | Det du ser på dine screenshots |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Trae**      | Chat + Builder (samlet). Feltet med `@Agent  #Context  Images` er chat-input; når AI’en laver kodeændringer, åbnes et diff-preview direkte her. | _Skærmbillede 08.43.59_        |
| **MCP**       | Liste over kørende MCP-servers + **Marketplace** (tilføj/enable) + **Configure Manually** popup til raw JSON.                                   | _08.44.13_ og _08.44.27_       |
| **Context**   | ① Global code-index (statusbjælke) ② Ignorer-liste ③ Docs-sektion (tilføj URL eller upload PDF/MD).                                             | _08.44.37_                     |
| **Rules**     | To filer i `.trae/rules/` mappes automatisk: `user_rules.md` og `project_rules.md`.                                                             | _08.44.44_                     |
| **Models**    | Vis/tilføj LLM-endpoints (Claude-4-Sonnet, GPT-4.1, Gemini 2.5 osv.).                                                                           | _08.44.52_                     |
| **Agents**    | Opret/redigér agenter, vælg Tools, skriv Prompt.                                                                                                | _08.44.59_ og _08.45.08_       |

---

## 2. Opret en ny agent (step-by-step)

1. **Agents → Create Agent**
   - **Name** (krævet, max 20 tegn).
   - **Prompt** (fritekst, max 10 000 tegn).
2. **Tools-sektionen** (under Prompt)
   - _Built-in_: File system, Terminal, Web search, Preview.
   - _MCP_: De servers du har slået til i MCP-fanen (vises automatisk).
3. Klik **Save** nederst.

> **Pro-tip**: Begræns Tools til det agenten faktisk skal bruge – så bliver svar hurtigere og du undgår utilsigtede fil-ændringer.

---

## 3. Eksempel – sequential-thinking

```jsonc
// gå til MCP → Configure Manually og indsæt:
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    },
  },
}
```
````

1. **Klik Confirm** → Trae prøver at starte serveren.
2. Hvis den fejler (rød “Retry”), så:

   - Åbn tandhjul-ikonet → ret sti eller env-vars.
   - Genstart via “🔄”-knappen.

---

## 4. Sådan bruger du kontekst i prompts

| Notation                                      | Effekt                                                |
| --------------------------------------------- | ----------------------------------------------------- |
| `#Code path/to/file.ts`                       | Vedhæfter én kodeblok (vælg blok i popup).            |
| `#File path/to/file.ts`                       | Vedhæfter hele filen.                                 |
| `#Folder src/services`                        | Vedhæfter alt i mappen (pas på token-size!).          |
| `#Doc Teknisk rapport`                        | Henter uddrag fra et dokument du har lagt i Docs.     |
| `@Docs https://nextjs.org/docs/api-reference` | Live-fetch dokument → injicerer relevante afsnit.     |
| `@Web "how to debounce in React"`             | Kører Brave-search MCP-server, returnerer resultater. |

---

## 5. Rules-filer – praktisk skabelon

`user_rules.md`

```md
- Output-sprog: dansk
- Maks 300 ord pr. svar medmindre jeg skriver _udvid_.
- Forklar altid test-strategi, når du foreslår kode.
```

`project_rules.md`

```md
- Ingen push til main uden PR.
- Alle commits skal følge Conventional Commits.
- Kode skal køre `npm test` + `eslint` uden fejl før commit.
```

---

## 6. Fejl- og performance-tips

| Issue                       | Årsag                               | Løsningsforslag                                                                                                         |
| --------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **“Failed to start”** i MCP | Forkert sti / manglende dep         | Check `command` + `args`, slå `chmod +x` hvis script er shell, installer deps i venv.                                   |
| Editor slugger 35 % CPU     | Hel repo indekseres ved hver launch | _Context → Configure ignored files_ → tilføj `node_modules`, `dist`, `log`.                                             |
| Agent mister kontekst       | Token-limit nås                     | Brug `#Code` eller `#Doc` i stedet for hele filer/foldere; evt. splintern `prompt-manager` gemmer sidste 2-3 Exchanges. |

---

> **Nu burde alt stemme én-til-én med det du ser i GUI’en.**
> Hvis der stadig er uoverensstemmelser, så tag et nyt screenshot af den præcise sektion – så retter vi det straks.

```md
<!-- Slut på Agentopsætning.md -->
```
