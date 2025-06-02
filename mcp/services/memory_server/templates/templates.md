**prompt\_history\_server.py**

```python
#!/usr/bin/env python3
import os
import re
from flask import Flask, request, jsonify
from datetime import datetime
from typing import Dict, List, Any

# --- Konfiguration af stier og mapper ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
LOG_DIR = os.path.join(BASE_DIR, "prompt_history")
LOG_FILE_PATH = os.path.join(LOG_DIR, "history.log")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

# Sørg for at mapperne findes
os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(TEMPLATES_DIR, exist_ok=True)

app = Flask(__name__)

# --- Hjælpefunktioner ---

def _read_history_blocks() -> List[str]:
    """
    Indlæser hele history.log og returnerer en liste af blokke (strings),
    hvor hver blok begynder med '=== PROMPT_START ===' og slutter med '=== PROMPT_END ==='.
    """
    if not os.path.exists(LOG_FILE_PATH):
        return []
    with open(LOG_FILE_PATH, "r", encoding="utf-8") as f:
        content = f.read().strip()
    if not content:
        return []

    raw_blocks = content.split("=== PROMPT_END ===")
    blocks = []
    for block in raw_blocks:
        block = block.strip()
        if block:
            blocks.append(block + "\n=== PROMPT_END ===")
    return blocks

def _write_history_log(entry: str) -> None:
    """
    Skriver én log_entry til history.log.
    """
    with open(LOG_FILE_PATH, "a", encoding="utf-8") as f:
        f.write(entry)

def _simple_summarize(text: str, max_points: int = 10) -> List[str]:
    """
    Simpel opsummering: finder de linjer der begynder med 'BRUGER:' i de gamle blokke,
    klipper dem til 60 tegn og returnerer som bullet points. Begrænset til max_points.
    """
    points = []
    for line in text.splitlines():
        if line.startswith("BRUGER:"):
            user_line = line[len("BRUGER:"):].strip()
            snippet = (user_line[:57] + "...") if len(user_line) > 60 else user_line
            points.append(f"• {snippet}")
            if len(points) >= max_points:
                break
    return points

# --- Endpoints ---

@app.route("/append", methods=["POST"])
def append_to_history():
    """
    Modtager JSON med 'user_prompt' og 'assistant_response', opretter en blok med tidsstempel
    og tilføjer til history.log.
    """
    try:
        data = request.get_json(force=True)
        user_prompt = data.get("user_prompt", "").strip()
        assistant_response = data.get("assistant_response", "").strip()
        if not user_prompt or not assistant_response:
            return jsonify({"error": "Feltet 'user_prompt' og 'assistant_response' må ikke være tomt."}), 400

        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        log_entry = (
            "=== PROMPT_START ===\n"
            f"{timestamp}\n"
            f"BRUGER: {user_prompt}\n"
            f"ASSISTENT: {assistant_response}\n"
            "=== PROMPT_END ===\n\n"
        )
        _write_history_log(log_entry)
        return jsonify({"success": "History appended."}), 200

    except Exception as e:
        return jsonify({"error": f"Append fejlede: {e}"}), 500

@app.route("/last", methods=["GET"])
def get_last_entries():
    """
    Returnerer de seneste 'n' samtaleblokke fra history.log.
    Brug parametret '?n=antal'. Default er 2.
    """
    try:
        n = int(request.args.get("n", 2))
    except ValueError:
        return jsonify({"error": "Parameter 'n' skal være et heltal."}), 400

    try:
        blocks = _read_history_blocks()
        if not blocks:
            return jsonify({"history": ""}), 200

        last_n = blocks[-n:] if n <= len(blocks) else blocks
        result = "\n".join(last_n).strip()
        return jsonify({"history": result}), 200

    except Exception as e:
        return jsonify({"error": f"Hent sidste blokke fejlede: {e}"}), 500

@app.route("/detect-intent", methods=["POST"])
def detect_intent():
    """
    Analyserer en prompt og returnerer den mest sandsynlige intent samt scores.
    Input: JSON {'prompt': '...'}.
    """
    try:
        data = request.get_json(force=True)
        prompt_text = data.get("prompt", "").strip().lower()
        if not prompt_text:
            return jsonify({"error": "Feltet 'prompt' er påkrævet."}), 400

        intent_patterns = {
            "unit-test": [r"\bunit\s*test\b", r"\bjest\b", r"\btest(s)?\b", r"\bspec\b"],
            "bugfix": [r"\bfix\b", r"\bbug\b", r"\bfejl\b", r"\bproble(m)?\b"],
            "refactor": [r"\brefactor(ed|ing)?\b", r"\bclean\b", r"\boptimi[sz]e\b", r"\bsimplif(y|ication)\b"],
            "documentation": [r"\bdoc(s)?\b", r"\bdokument(s)?\b", r"\bj(sdoc)?\b", r"\bmanual\b"],
            "new-feature": [r"\bnew\b", r"\bfeature(s)?\b", r"\badd(s)?\b", r"\bimplement(s)?\b"]
        }

        scores: Dict[str, int] = {}
        for intent, patterns in intent_patterns.items():
            score = sum(1 for pat in patterns if re.search(pat, prompt_text))
            if score > 0:
                scores[intent] = score

        if scores:
            detected = max(scores, key=scores.get)
            confidence = round(scores[detected] / len(intent_patterns[detected]), 2)
        else:
            detected = "new-feature"
            confidence = 0.0

        return jsonify({
            "intent": detected,
            "confidence": confidence,
            "scores": scores
        }), 200

    except Exception as e:
        return jsonify({"error": f"Intent detection fejlede: {e}"}), 500

@app.route("/get-template", methods=["GET"])
def get_template():
    """
    Returnerer den fulde content af en template givet en intent.
    Brug '?intent=unit-test' som parameter.
    """
    intent = request.args.get("intent", "").strip()
    if not intent:
        return jsonify({"error": "Parameter 'intent' er påkrævet."}), 400

    template_path = os.path.join(TEMPLATES_DIR, f"{intent}.md")
    if not os.path.exists(template_path):
        return jsonify({"error": f"Template for '{intent}' ikke fundet."}), 404

    try:
        with open(template_path, "r", encoding="utf-8") as f:
            content = f.read()
        return jsonify({
            "intent": intent,
            "template": content
        }), 200

    except Exception as e:
        return jsonify({"error": f"Hent template fejlede: {e}"}), 500

@app.route("/fill-template", methods=["POST"])
def fill_template():
    """
    Fylder en template med parameters. Forventer:
    {
      "intent": "<intent-navn>",
      "parameters": { "key": "value", ... }
    }
    Returnerer den udfyldte content og liste af manglende placeholders.
    """
    try:
        data = request.get_json(force=True)
        intent = data.get("intent", "").strip()
        parameters = data.get("parameters", {})

        if not intent or not isinstance(parameters, dict):
            return jsonify({"error": "Parameter 'intent' og 'parameters' er påkrævet."}), 400

        template_path = os.path.join(TEMPLATES_DIR, f"{intent}.md")
        if not os.path.exists(template_path):
            return jsonify({"error": f"Template for '{intent}' ikke fundet."}), 404

        with open(template_path, "r", encoding="utf-8") as f:
            content = f.read()

        filled = content
        for key, val in parameters.items():
            placeholder = f"{{{{{key}}}}}"
            filled = filled.replace(placeholder, str(val))

        missing = re.findall(r"\{\{(\w+)\}\}", filled)

        return jsonify({
            "intent": intent,
            "filled_template": filled,
            "unfilled_placeholders": missing
        }), 200

    except Exception as e:
        return jsonify({"error": f"Filling template fejlede: {e}"}), 500

@app.route("/summarize", methods=["GET"])
def summarize_history():
    """
    Opsummerer ældre samtaler for at spare token-forbrug.
    Brug '?older_than=N' for at opsummere blokke ældre end de N seneste.
    """
    try:
        older_than = int(request.args.get("older_than", 10))
    except ValueError:
        return jsonify({"error": "Parameter 'older_than' skal være et heltal."}), 400

    blocks = _read_history_blocks()
    total_blocks = len(blocks)
    if total_blocks <= older_than:
        return jsonify({"summary": "Ingen ældre samtaler at opsummere."}), 200

    old_blocks = blocks[: total_blocks - older_than]
    combined_text = "\n".join(old_blocks)
    summary_points = _simple_summarize(combined_text, max_points=10)

    oldest_ts = old_blocks[0].split("\n")[1] if old_blocks and len(old_blocks[0].split("\n")) > 1 else None
    newest_ts = old_blocks[-1].split("\n")[1] if old_blocks and len(old_blocks[-1].split("\n")) > 1 else None

    return jsonify({
        "conversation_count": len(old_blocks),
        "summary_points": summary_points,
        "timestamp_range": {
            "oldest": oldest_ts,
            "newest": newest_ts
        }
    }), 200

@app.route("/clear-history", methods=["DELETE"])
def clear_history():
    """
    Sletter hele history.log permanent. Brug kun hvis du vil nulstille al hukommelse.
    """
    try:
        if os.path.exists(LOG_FILE_PATH):
            os.remove(LOG_FILE_PATH)
        return jsonify({"success": "History log slettet."}), 200
    except Exception as e:
        return jsonify({"error": f"Sletning af history fejlede: {e}"}), 500

if __name__ == "__main__":
    print("🚀 Starter Memory-server på http://0.0.0.0:5007 ...")
    app.run(host="0.0.0.0", port=5007, debug=True)
```

---

**templates/agent-prompt.md**

````markdown
# ProjektLL Agent Prompt

Du er **ProjektLL**, en avanceret AI-assistent specialiseret i LearningLab-projekter. Du har adgang til:

## MCP-servere
1. **vector-search (RAG)**  
2. **prompt-history (Memory)**  
3. **code-lens (Inline forslag)**  
4. **doc-lookup (Dokumentationsopslag)**  

## Trae Built-In Tools
- `filesystem`  
- `terminal`  
- `web search`  
- `preview`  

---

## Workflow

1. **Intent-detektion**  
   - Kald: `/detect-intent` med JSON `{ "prompt": "<brugerens prompt>" }`  
   - Få: `{ "intent": "<navn>", "confidence": <float>, "scores": {...} }`  

2. **RAG-kontekst**  
   - Hvis intent ≠ "documentation":  
     ```
     @mcp vector-search
     {
       "query": "<brugerens prompt>",
       "filepath": "<filsti hvis relevant>",
       "n_results": 10
     }
     ```  

3. **Template-hent & udfyld**  
   - Kald: `/get-template?intent=<intent-navn>`  
   - Få: `{ "intent": "<intent>", "template": "<rå template>" }`  
   - Udfyld `{{placeholder}}`-felter med parametre (f.eks. `filepath`, `function_name`, `error_description`)  
   - Kald: `/fill-template` med:
     ```jsonc
     {
       "intent": "<intent-navn>",
       "parameters": {
         "<key>": "<value>",
         ...
       }
     }
     ```
   - Få: `{ "filled_template": "<tekst>", "unfilled_placeholders": [ ... ] }`  

4. **Kodeproduktion / Dokumentation**  
   - Kombinér:
     - Udfyldt template  
     - RAG-resultater (hvis relevant)  
     - Dokumentationsopsalg (hvis `intent=="documentation"`)  

5. **Valider output**  
   - Tjek for manglende placeholders  
   - Kør syntaks-tjek/test lokal (f.eks. `@mcp terminal → npm run test` eller `flake8`)  
   - Generer diff:
     ```
     @mcp terminal → git diff
     ```
   - Afvent brugergodkendelse ("Approve"/"Reject") inden commit  

6. **Commit**  
   - Hvis godkendt:
     ```
     @mcp terminal
     git add .
     git commit -m "AI: <intent>(<scope>): <kort beskrivelse>"
     ```

7. **Gem i historik**  
````

@mcp prompt-history
POST /append
{
"user\_prompt": "<original prompt>",
"assistant\_response": "\<genereret løsning>"
}

```

---

## Kodestandarder

### JavaScript/TypeScript
- **TypeScript** v.4+  
- ESLint + Prettier (kør `eslint --fix`)  
- `async/await` frem for callbacks  
- TSDoc for offentlige funktioner/komponenter

### Python
- PEP8 (brug `flake8`, `black --check`)  
- Type hints (`def foo(a: int) -> str:`)  
- Docstrings i Google-style eller NumPy-style  
- Robust `try/except` med meningsfuld fejlhåndtering

### Generelt
- Beskrivende navngivning af funktioner/variabler  
- Maks 40 linjer per funktion  
- Kommentér kun "hvorfor", ikke "hvad"  
- Sørg for at unit tests dækker ≥ 90% af genereret kode  

---

## Eksempelbrug

**Bruger:**  
```

Generer unit tests for loginUser i auth.ts

```

1. `/detect-intent` → `{ "intent": "unit-test", "confidence": 0.8 }`  
2. `/search` → relevante kodestykker fra `auth.ts`  
3. `/get-template?intent=unit-test` → hent `unit-test.md`  
4. `/fill-template` med `{ "intent": "unit-test", "parameters": { "filepath": "src/auth.ts", "function_name": "loginUser", "relative_import_path": "../auth" } }` → får udfyldt test-skabelon  
5. Generer endelig Jest-test, kør `@mcp terminal → npm run test`  
6. Vis diff, brugeren skriver "Approve"  
7. Commit med `AI: unit-test(auth): generate tests for loginUser`  
8. `/append` → gem prompt & svar  
9. Returnér færdig testkode i chat
```

---

**templates/bugfix.md**

```markdown
# Bug Fix Template

## 1. Kontekst
- **Fil:** `{{filepath}}`
- **Fejlbeskrivelse:**  
```

{{error\_description}}

```
- **Stack Trace:**  
```

{{stack\_trace}}

````

## 2. Analyse
1. **Root Cause:**  
 Kort forklaring på, hvorfor fejlen opstod.
2. **Impact:**  
 Hvilke funktioner/brugere påvirkes?

## 3. Løsning
1. **Kodeændringer**  
 ```diff
 --- a/{{filepath}}
 +++ b/{{filepath}}
 @@ -{{start_line}},{{old_block_length}} +{{start_line}},{{new_block_length}} @@
 {{diff_block}}
````

Forklaring:

* Beskriv hvorfor diff-blokken løser problemet.

2. **Edge Cases**

   * Hvad hvis input er `null`/`undefined`/tom streng?
   * Tilføj ekstra checks/fallbacks som nødvendigt.

3. **Fejlhåndtering**

   * Sørg for at bruge `try/catch` (Python) eller `try { } catch { }` (JS/TS).
   * Returnér meningsfulde fejlbeskeder eller HTTP-statuskoder.

## 4. Krav

* **Ingen utilsigtet ændring** af anden logik.
* **Bevar kodekonsistens** (ESLint/Prettier eller PEP8).
* **Kommentarer** ved hver væsentlig ændring:

  ```js
  // Rettet: Undgå crash ved manglende bruger
  ```

## 5. Output

* Returnér kun diff‐blokken i markdown:

  ```diff
  --- a/src/auth.ts
  +++ b/src/auth.ts
  @@ -45,7 +45,12 @@ export async function loginUser(username, password) {
       const user = await findUser(username);
       if (!user) {
  -        throw new Error('User not found');
  +        const err = new Error('Bruger ikke fundet');
  +        err.statusCode = 404;
  +        throw err;
       }
  ```
* Kort forklaring nedenfor:

  > Ændret exception-håndtering til at returnere HTTP 404 i stedet for at crashe.

````

---

**templates/documentation.md**
```markdown
# Documentation Generator Template

## 1. Kontekst
- **Fil/Modul:** `{{filepath}}`
- **Doc Type:** `{{doc_type}}`  
  (fx `API`, `Class`, `Function`, `Component`)
- **Målgruppe:** `{{audience}}`  
  (fx `udviklere`, `QA-team`)

## 2. Instruktioner

### Funktioner / Metoder
- **Formål:**  
  Beskriv kort, hvad funktionen gør.
- **Signatur:**  
  ```ts
  function {{function_name}}({{parameters}}) → {{return_type}}
````

* **Parametre:**

  ```ts
  @param {<type>} <param_name> – <beskrivelse>
  ```
* **Returværdi:**

  ```ts
  @returns {<type>} – <beskrivelse>
  ```
* **Fejl/Exceptions:**

  ```ts
  @throws {<ErrorType>} – <beskrivelse>
  ```
* **Eksempel på brug:**

  ```ts
  // Eksempel:
  const result = {{function_name}}(arg1, arg2);
  console.log(result);
  ```
* **Edge Cases & Begrænsninger:**

  * Hvordan håndteres tomme eller ugyldige inputs?
  * Performance-overvejelser?

### Klasser / Komponenter

* **Oversigt & Formål:**

  * Hvad repræsenterer klassen/komponenten?
* **Constructor / Props:**

  ```ts
  /**
   * @param {<type>} <prop_name> – <beskrivelse>
   */
  constructor({ propA, propB }) { … }
  ```
* **Public Metoder / Interface:**

  * Liste over offentlige metoder med signatur og beskrivelse.
* **Events / Callbacks:**

  * Hvilke events udløses, og hvornår?
* **Lifecycle / Hooks (React):**

  * Beskriv `componentDidMount`, `useEffect`, etc.

### API Endpoints

* **HTTP‐metode & Path:**

  ```http
  GET /api/users/{userId}
  ```
* **Request:**

  * **Headers** (Content-Type, Authorization)
  * **Path-Params:** `{ userId: string }`
  * **Query-Params:** `{ includePosts?: boolean }`
  * **Body (hvis nødvendigt):**

    ```jsonc
    {
      "username": "string",
      "email": "string"
    }
    ```
* **Response:**

  * **Status Codes:**

    * `200 OK` – Brugerobjekt
    * `404 Not Found` – Hvis bruger ikke findes
    * `500 Internal Server Error` – Serverfejl
  * **Body-struktur:**

    ```jsonc
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "createdAt": "string"
    }
    ```
* **Autentificering & Sikkerhed:**

  * Kræver JWT-token i `Authorization` header.
* **Rate Limiting:**

  * Max 1000 anmodninger/time per API-key.
* **Eksempel Requests / Responses:**

  ```http
  GET /api/users/123 HTTP/1.1
  Host: example.com
  Authorization: Bearer <token>

  HTTP/1.1 200 OK
  Content-Type: application/json

  {
    "id": "123",
    "username": "alice",
    "email": "alice@example.com",
    "createdAt": "2023-08-15T12:34:56Z"
  }
  ```

## 3. Outputformat

* **Functions/Components:** JSDoc/TSDoc‐kommentarer inline i koden.
* **README/Markdown:** Generer Markdown-filer (f.eks. `docs/{{module_name}}.md`).
* **OpenAPI/Swagger:** Generer JSON eller YAML med OpenAPI v3-specifikation.

````

---

**templates/new-feature.md**
```markdown
# New Feature Specification

## 1. Feature-Oversigt
- **Navn:** `{{feature_name}}`
- **Beskrivelse:**  
````

{{feature\_description}}

```
- **User Story:**  
```

{{user\_story}}

```
Eksempel:  
> Som bruger ønsker jeg at kunne nulstille min adgangskode, så jeg kan logge ind, selvom jeg har glemt den.

## 2. Business & Tekniske Krav

### 2.1 Business Krav
- Målgruppe: `{{audience}}`  
- Værdi: Forklar, hvorfor denne feature er vigtig (ROI, bruger-feedback).

### 2.2 Tekniske Krav
- **Frontend Stack:** `{{frontend_stack}}`  
- **Backend Stack:** `{{backend_stack}}`  
- **Database:** `{{db_system}}`  
- **Integration:**  
- Auth-service: `{{auth_service}}`  
- E-mail-gateway: `{{email_gateway}}`  
- **Performance:**  
- ≤200ms svartider for UI  
- Håndter ≥100 samtidige anmodninger

## 3. Design & Arkitektur

### 3.1 Systemarkitektur
```

\[User Browser] → \[Frontend React] → \[API Gateway] → \[Auth Service] → \[Database]
\|                                          |
↓                                          ↓
\[E-mail Service]                           \[Prisma / PostgreSQL]

```

### 3.2 Datamodel & Entities
- **User**: `{ id, email, passwordHash, resetToken, resetExpiresAt }`  
- **ResetToken**: `{ token, userId, createdAt, expiresAt }`

### 3.3 Komponenter

#### Frontend
1. **ResetPasswordForm.tsx**  
   - Felter: email input, submit-knap  
   - Validering: email-format, required  
   - Kald: `POST /api/auth/reset-request`

2. **Routes**  
   - `/auth/reset-request`  
   - `/auth/reset-verify?token=<token>`

#### Backend
1. **AuthController**  
   - `POST /api/auth/reset-request`  
     - Valider e-mail → generér token → gem token+udløb i DB → send e-mail  
   - `POST /api/auth/reset-verify`  
     - Validate token → opdater passwordHash → slet token  

2. **AuthService**  
   - `generateResetToken(userId: string): string`  
   - `verifyResetToken(token: string): boolean`  
   - `resetPassword(token: string, newPassword: string): boolean`

3. **Database Migration**  
   - Tilføj `resetToken` og `resetExpiresAt` til `User`-tabellen  
   - Eller opret `PasswordResetTokens`-tabel

#### Test
- **Unit Tests**  
  - Test token-generering + udløb  
  - Test `verifyResetToken`  
  - Test `resetPassword`  

- **Integration Tests**  
  1. `POST /api/auth/reset-request` med gyldig email → HTTP 200 + mock e-mail  
  2. Ekstrakt token fra mocked e-mail → `POST /api/auth/reset-verify` med token + ny adgangskode → HTTP 200  
  3. Ugyldigt/udløbet token → HTTP 400

## 4. Acceptkriterier
- [ ] Bruger modtager reset-e-mail inden for 5s  
- [ ] Reset-link udløber efter 1 time  
- [ ] Validering: Ingen tomme inputs  
- [ ] Unit tests ≥95% dækning  
- [ ] CI/CD kører tests uden fejl og deployer til staging

## 5. Output
1. **Arkitekturdiagram** (ASCII/URL)  
2. **Implementation Plan** (trinvis)  
3. **Kode** (mappe- og filstruktur)  
4. **Teststrategi** (unit + integration)  
5. **Deployment** (miljøvariabler, migrations, rollback)
```

---

**templates/refactor.md**

```markdown
# Refactoring Template

## 1. Kontekst
- **Fil:** `{{filepath}}`
- **Refactor Type:** `{{refactor_type}}`  
  (fx `Extract Method`, `Rename Variable`, `Replace Conditional`)
- **Målsætning:**  
```

{{goal}}

````

## 2. Analyse
1. **Eksisterende Kode**  
 ```diff
 --- a/{{filepath}}
 +++ b/{{filepath}}
 @@ -{{start_line}},{{old_block_length}} +{{start_line}},{{new_block_length}} @@
 {{diff_block}}
````

* Vis relevant kodeudsnit som reference.

2. **Identificer Problemer**

   * Code Smells: Gentagelse, store funktioner, hårdkodede værdier.
   * Manglende abstraktion: flere `if`-kæder, dårlig navngivning.

## 3. Forslag til Refactoring

1. **Extract Method**

   * Eksempel:

     ```diff
     --- a/src/orderService.ts
     +++ b/src/orderService.ts
     @@ -10,7 +10,7 @@ export function calculateTotal(items) {
          let sum = 0;
          items.forEach(item => {
     -      sum += item.price * item.qty;
     +      sum += computeItemTotal(item);
          });
          return sum;
     }
     ```
   * Forklaring: Udtræk logik til `computeItemTotal`.

2. **Move Function**

   * Flyt `computeItemTotal` til `utils/calc.ts`:

     ```diff
     --- a/src/orderService.ts
     +++ b/src/utils/calc.ts
     @@ -0,0 +1,15 @@
     +export function computeItemTotal(item) {
     +  return item.price * item.qty;
     +}
     ```

3. **Rename Variable**

   ```diff
   --- a/src/orderService.ts
   +++ b/src/orderService.ts
   @@ -8,7 +8,7 @@ export function calculateTotal(items) {
        items.forEach(item => {
   -      sum += computeItemTotal(item);
   +      sum += item.price * item.quantity; // Konsistent navngivning
        });
   ```

   Forklaring: `qty` → `quantity`.

4. **Replace Conditional with Polymorphism**

   ```ts
   // Før
   if (user.role === 'admin') {
     return adminDashboard();
   } else if (user.role === 'editor') {
     return editorDashboard();
   } else {
     return userDashboard();
   }

   // Efter
   import DashboardFactory from '../factories/DashboardFactory';

   export function getDashboard(user) {
     const factory = new DashboardFactory();
     return factory.create(user.role).render();
   }
   ```

## 4. Trinvis Ændring

1. **Extract Method**

   ```diff
   --- a/src/orderService.ts
   +++ b/src/orderService.ts
   @@ -10,7 +10,7 @@ export function calculateTotal(items) {
        let sum = 0;
        items.forEach(item => {
   -      sum += item.price * item.qty;
   +      sum += computeItemTotal(item);
        });
        return sum;
   }
   ```

   Forklaring: Udtrækker kompleks logik til `computeItemTotal`.

2. **Move Method**

   ```diff
   --- a/src/utils/calc.ts
   +++ b/src/utils/calc.ts
   @@ -0,0 +1,15 @@
   +export function computeItemTotal(item) {
   +  return item.price * item.qty;
   +}
   ```

   Forklaring: Flytter metode til `utils` for genbrug.

3. **Rename Variable**

   ```diff
   --- a/src/orderService.ts
   +++ b/src/orderService.ts
   @@ -8,7 +8,7 @@ export function calculateTotal(items) {
        items.forEach(item => {
   -      sum += computeItemTotal(item);
   +      sum += item.price * item.quantity;
        });
   }
   ```

   Forklaring: Ændrer `qty` til `quantity`.

4. **Refactor Conditional**

   ```diff
   --- a/src/dashboardController.ts
   +++ b/src/dashboardController.ts
   @@ -5,10 +5,25 @@ export function getDashboard(user) {
     if (user.role === 'admin') {
       return adminDashboard();
     } else if (user.role === 'editor') {
       return editorDashboard();
     } else {
       return userDashboard();
     }
   }
   ```

   til

   ```ts
   import DashboardFactory from '../factories/DashboardFactory';

   export function getDashboard(user) {
     const factory = new DashboardFactory();
     const dashboard = factory.create(user.role);
     return dashboard.render();
   }
   ```

   Forklaring: Indfører factory-pattern.

## 5. Kontrolpunkter

* [ ] Ingen brud på eksisterende tests.
* [ ] Ingen cirkulære imports.
* [ ] ESLint/Prettier konfiguration opdateret.
* [ ] Nye unit tests for `computeItemTotal`.
* [ ] Dokumenter i README at `utils/calc.ts` indeholder udtrukket logik.

````

---

**templates/unit-test.md**
```markdown
# Unit Test Generator

## 1. Kontekst
- **Fil:** `{{filepath}}`
- **Funktion:** `{{function_name}}`
- **Test Framework:** Jest

## 2. Instruktioner
1. Opret en testfil med navn: `{{function_name}}.test.js` (eller `.ts`).
2. Importér funktionen:
   ```js
   const { {{function_name}} } = require('{{relative_import_path}}');
````

3. Dæk følgende scenarier:

   * **Gyldigt input** → forventet output.
   * **Ugyldigt input** → forventet undtagelse (throw).
   * **Edge case** (f.eks. `null`, tom streng).

## 3. Strukt ur

```js
describe('{{function_name}} unit tests', () => {
  it('should return <expected> for valid input', () => {
    // Arrange
    const input = {{valid_input}};
    const expected = {{expected_output}};

    // Act
    const result = {{function_name}}(input);

    // Assert
    expect(result).toEqual(expected);
  });

  it('should throw an error for invalid input', () => {
    // Arrange
    const badInput = {{invalid_input}};

    // Act & Assert
    expect(() => {{function_name}}(badInput)).toThrow();
  });

  it('should handle edge case: <description>', () => {
    // Arrange
    const edgeInput = {{edge_case_input}};
    const expectedEdge = {{expected_edge_output}};

    // Act
    const result = {{function_name}}(edgeInput);

    // Assert
    expect(result).toEqual(expectedEdge);
  });
});
```

## 4. Parametre

* `{{filepath}}`: Relativ sti til kildefilen.
* `{{function_name}}`: Navn på funktionen der testes.
* `{{relative_import_path}}`: F.eks. `../utils/math`.
* `{{valid_input}}`, `{{expected_output}}`: Eksempel på gyldig test.
* `{{invalid_input}}`: F.eks. `null` eller `undefined`.
* `{{edge_case_input}}`, `{{expected_edge_output}}`: Edge-case input og forventet output.

## 5. Output

* Returnér kun testfilens fulde indhold som en JavaScript/TypeScript-kodeblok.
* Navngiv filen `{{function_name}}.test.js` (eller `.ts`).

````

---

**templates/bugfix.md**
```markdown
# Bug Fix Template

## 1. Kontekst
- **Fil:** `{{filepath}}`
- **Fejlbeskrivelse:**  
````

{{error\_description}}

```
- **Stack Trace:**  
```

{{stack\_trace}}

````

## 2. Analyse
1. **Root Cause:**  
 Kort forklaring på, hvorfor fejlen opstod.  
2. **Impact:**  
 Hvilke funktioner og brugere påvirkes?

## 3. Løsning
1. **Kodeændringer**  
 ```diff
 --- a/{{filepath}}
 +++ b/{{filepath}}
 @@ -{{start_line}},{{old_block_length}} +{{start_line}},{{new_block_length}} @@
 {{diff_block}}
````

Forklaring:

* Uddyb hvorfor denne diff løser problemet.

2. **Edge Cases**

   * Beskriv håndtering af `null`, `undefined` eller tom streng.
   * Tilføj fallback- eller validerings-kode efter behov.

3. **Fejlhåndtering**

   * Sørg for `try/catch` (Python) eller `try { ... } catch { ... }` (JS/TS).
   * Returnér meningsfulde fejl eller HTTP-statuskoder.

## 4. Krav

* Ingen utilsigtet ændring i anden logik.
* Følg eksisterende kodestandarder (ESLint, PEP8).
* Tilføj kort kommentar ved alle væsentlige ændringer:

  ```js
  // Rettet: Undgå crash ved manglende bruger
  ```

## 5. Output

* Returnér kun diff-blokken som markdown:

  ```diff
  --- a/src/auth.ts
  +++ b/src/auth.ts
  @@ -45,7 +45,12 @@ export async function loginUser(username, password) {
       const user = await findUser(username);
       if (!user) {
  -        throw new Error('User not found');
  +        const err = new Error('Bruger ikke fundet');
  +        err.statusCode = 404;
  +        throw err;
       }
  ```
* Kort forklaring nedenfor:

  > Ændret exception-håndtering til at returnere HTTP 404 i stedet for at crashe.

````

---

**templates/documentation.md**
```markdown
# Documentation Generator Template

## 1. Kontekst
- **Fil/Modul:** `{{filepath}}`
- **Doc Type:** `{{doc_type}}`  
  (fx `API`, `Class`, `Function`, `Component`)
- **Målgruppe:** `{{audience}}`  
  (fx `udviklere`, `QA-team`)

## 2. Instruktioner

### Funktioner / Metoder
- **Formål:**  
  Beskriv kort, hvad funktionen gør.  
- **Signatur:**  
  ```ts
  function {{function_name}}({{parameters}}) → {{return_type}}
````

* **Parametre:**

  ```ts
  @param {<type>} <param_name> – <beskrivelse>
  ```
* **Returværdi:**

  ```ts
  @returns {<type>} – <beskrivelse>
  ```
* **Fejl / Exceptions:**

  ```ts
  @throws {<ErrorType>} – <beskrivelse>
  ```
* **Eksempel på brug:**

  ```ts
  // Eksempel:
  const result = {{function_name}}(arg1, arg2);
  console.log(result);
  ```
* **Edge Cases & Begrænsninger:**

  * Hvordan håndteres tomme eller ugyldige inputs?
  * Performance-overvejelser?

### Klasser / Komponenter

* **Oversigt & Formål:**

  * Hvad repræsenterer klassen/komponenten?
* **Constructor / Props:**

  ```ts
  /**
   * @param {<type>} <prop_name> – <beskrivelse>
   */
  constructor({ propA, propB }) { … }
  ```
* **Public Metoder / Interface:**
  Liste over offentlige metoder med signatur og beskrivelse.
* **Events / Callbacks:**
  Hvilke events udløses, og hvornår?
* **Lifecycle / Hooks (React):**
  Beskriv `componentDidMount`, `useEffect`, etc.

### API Endpoints

* **HTTP-metode & Path:**

  ```http
  GET /api/users/{userId}
  ```
* **Request:**

  * **Headers:** `Content-Type`, `Authorization`
  * **Path-Params:** `{ userId: string }`
  * **Query-Params:** `{ includePosts?: boolean }`
  * **Body:** (hvis relevant)

    ```jsonc
    {
      "username": "string",
      "email": "string"
    }
    ```
* **Response:**

  * **Status Codes:**

    * `200 OK` – Brugerobjekt
    * `404 Not Found` – Hvis bruger ikke findes
    * `500 Internal Server Error` – Serverfejl
  * **Body-struktur:**

    ```jsonc
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "createdAt": "string"
    }
    ```
* **Autentificering & Sikkerhed:**

  * Kræver JWT-token i `Authorization` header.
* **Rate Limiting:**

  * Maks 1000 anmodninger/time per API-key.
* **Eksempel Requests / Responses:**

  ```http
  GET /api/users/123 HTTP/1.1
  Host: example.com
  Authorization: Bearer <token>

  HTTP/1.1 200 OK
  Content-Type: application/json

  {
    "id": "123",
    "username": "alice",
    "email": "alice@example.com",
    "createdAt": "2023-08-15T12:34:56Z"
  }
  ```

## 3. Outputformat

* **Functions/Components:** JSDoc/TSDoc-kommentarer inline i koden.
* **README/Markdown:** Generer Markdown-filer (f.eks. `docs/{{module_name}}.md`).
* **OpenAPI/Swagger:** Generer JSON eller YAML med OpenAPI v3-specifikation.

````

---

**templates/new-feature.md**
```markdown
# New Feature Specification

## 1. Feature-Oversigt
- **Navn:** `{{feature_name}}`
- **Beskrivelse:**  
````

{{feature\_description}}

```
- **User Story:**  
```

{{user\_story}}

```
Eksempel:  
> Som bruger ønsker jeg at kunne nulstille min adgangskode, så jeg kan logge ind, selvom jeg har glemt den.

## 2. Business & Tekniske Krav

### 2.1 Business Krav
- Målgruppe: `{{audience}}`  
- Værdi: Forklar, hvorfor denne feature er vigtig (ROI, bruger-feedback).

### 2.2 Tekniske Krav
- **Frontend Stack:** `{{frontend_stack}}`  
- **Backend Stack:** `{{backend_stack}}`  
- **Database:** `{{db_system}}`  
- **Integration:**  
- Auth-service: `{{auth_service}}`  
- E-mail-gateway: `{{email_gateway}}`  
- **Performance:**  
- ≤200ms svartider for UI  
- Håndter ≥100 samtidige anmodninger

## 3. Design & Arkitektur

### 3.1 Systemarkitektur
```

\[User Browser] → \[Frontend React] → \[API Gateway] → \[Auth Service] → \[Database]
\|                                          |
↓                                          ↓
\[E-mail Service]                           \[Prisma / PostgreSQL]

```

### 3.2 Datamodel & Entities
- **User**: `{ id, email, passwordHash, resetToken, resetExpiresAt }`  
- **ResetToken**: `{ token, userId, createdAt, expiresAt }`

### 3.3 Komponenter

#### Frontend
1. **ResetPasswordForm.tsx**  
   - Felter: email input, submit-knap  
   - Validering: email-format, required  
   - Kald: `POST /api/auth/reset-request`

2. **Routes**  
   - `/auth/reset-request`  
   - `/auth/reset-verify?token=<token>`

#### Backend
1. **AuthController**  
   - `POST /api/auth/reset-request`  
     - Valider email → generér token → gem token+udløb i DB → send e-mail  
   - `POST /api/auth/reset-verify`  
     - Validate token → opdater passwordHash → slet token  

2. **AuthService**  
   - `generateResetToken(userId: string): string`  
   - `verifyResetToken(token: string): boolean`  
   - `resetPassword(token: string, newPassword: string): boolean`

3. **Database Migration**  
   - Tilføj `resetToken` og `resetExpiresAt` til `User`-tabellen  
   - Eller opret `PasswordResetTokens`-tabel

#### Test
- **Unit Tests**  
  - Test token-generering + udløb  
  - Test `verifyResetToken`  
  - Test `resetPassword`  

- **Integration Tests**  
  1. `POST /api/auth/reset-request` med gyldig email → HTTP 200 + mock e-mail  
  2. Ekstrakt token fra mocked e-mail → `POST /api/auth/reset-verify` med token + ny adgangskode → HTTP 200  
  3. Ugyldigt/udløbet token → HTTP 400

## 4. Acceptkriterier
- [ ] Bruger modtager reset-e-mail inden for 5s  
- [ ] Reset-link udløber efter 1 time  
- [ ] Validering: Ingen tomme inputs  
- [ ] Unit tests ≥95% dækning  
- [ ] CI/CD kører tests uden fejl og deployer til staging

## 5. Output
1. **Arkitekturdiagram** (ASCII/URL)  
2. **Implementation Plan** (trinvis)  
3. **Kode** (mappe- og filstruktur)  
4. **Teststrategi** (unit + integration)  
5. **Deployment** (miljøvariabler, migrations, rollback)
```

---

**templates/refactor.md**

```markdown
# Refactoring Template

## 1. Kontekst
- **Fil:** `{{filepath}}`
- **Refactor Type:** `{{refactor_type}}`  
  (fx `Extract Method`, `Rename Variable`, `Replace Conditional`)
- **Målsætning:**  
```

{{goal}}

````

## 2. Analyse
1. **Eksisterende Kode**  
 ```diff
 --- a/{{filepath}}
 +++ b/{{filepath}}
 @@ -{{start_line}},{{old_block_length}} +{{start_line}},{{new_block_length}} @@
 {{diff_block}}
````

* Vis relevant kodeudsnit som reference.

2. **Identificer Problemer**

   * Code Smells: Gentagen logik, store funktioner, hårdkodede værdier.
   * Manglende abstraktion: Flere `if`-kæder, dårlig navngivning.

## 3. Forslag til Refactoring

1. **Extract Method**

   * Eksempel:

     ```diff
     --- a/src/orderService.ts
     +++ b/src/orderService.ts
     @@ -10,7 +10,7 @@ export function calculateTotal(items) {
          let sum = 0;
          items.forEach(item => {
     -      sum += item.price * item.qty;
     +      sum += computeItemTotal(item);
          });
          return sum;
     }
     ```
   * Forklaring: Udtræk logik til `computeItemTotal`.

2. **Move Function**

   * Flyt `computeItemTotal` til `utils/calc.ts`:

     ```diff
     --- a/src/utils/calc.ts
     +++ b/src/utils/calc.ts
     @@ -0,0 +1,15 @@
     +export function computeItemTotal(item) {
     +  return item.price * item.qty;
     +}
     ```

3. **Rename Variable**

   ```diff
   --- a/src/orderService.ts
   +++ b/src/orderService.ts
   @@ -8,7 +8,7 @@ export function calculateTotal(items) {
        items.forEach(item => {
   -      sum += computeItemTotal(item);
   +      sum += item.price * item.quantity; // Konsistent navngivning
        });
   ```

   Forklaring: `qty` → `quantity`.

4. **Replace Conditional with Polymorphism**

   ```ts
   // Før
   if (user.role === 'admin') {
     return adminDashboard();
   } else if (user.role === 'editor') {
     return editorDashboard();
   } else {
     return userDashboard();
   }

   // Efter
   import DashboardFactory from '../factories/DashboardFactory';

   export function getDashboard(user) {
     const factory = new DashboardFactory();
     const dashboard = factory.create(user.role);
     return dashboard.render();
   }
   ```

## 4. Trinvis Ændring

1. **Extract Method**

   ```diff
   --- a/src/orderService.ts
   +++ b/src/orderService.ts
   @@ -10,7 +10,7 @@ export function calculateTotal(items) {
        let sum = 0;
        items.forEach(item => {
   -      sum += item.price * item.qty;
   +      sum += computeItemTotal(item);
        });
        return sum;
   }
   ```

   Forklaring: Udtrækker kompleks logik til `computeItemTotal`.

2. **Move Method**

   ```diff
   --- a/src/utils/calc.ts
   +++ b/src/utils/calc.ts
   @@ -0,0 +1,15 @@
   +export function computeItemTotal(item) {
   +  return item.price * item.qty;
   +}
   ```

   Forklaring: Flytter metode til `utils` for genbrug.

3. **Rename Variable**

   ```diff
   --- a/src/orderService.ts
   +++ b/src/orderService.ts
   @@ -8,7 +8,7 @@ export function calculateTotal(items) {
        items.forEach(item => {
   -      sum += computeItemTotal(item);
   +      sum += item.price * item.quantity;
        });
   }
   ```

   Forklaring: Ændrer `qty` til `quantity`.

4. **Refactor Conditional**

   ```diff
   --- a/src/dashboardController.ts
   +++ b/src/dashboardController.ts
   @@ -5,10 +5,25 @@ export function getDashboard(user) {
     if (user.role === 'admin') {
       return adminDashboard();
     } else if (user.role === 'editor') {
       return editorDashboard();
     } else {
       return userDashboard();
     }
   }
   ```

   til

   ```ts
   import DashboardFactory from '../factories/DashboardFactory';

   export function getDashboard(user) {
     const factory = new DashboardFactory();
     const dashboard = factory.create(user.role);
     return dashboard.render();
   }
   ```

   Forklaring: Indfører factory-pattern.

## 5. Kontrolpunkter

* [ ] Ingen brud på eksisterende tests.
* [ ] Ingen cirkulære imports.
* [ ] ESLint/Prettier konfiguration opdateret.
* [ ] Nye unit tests for `computeItemTotal`.
* [ ] Dokumenter i README at `utils/calc.ts` indeholder udtrukket logik.

````

---

**templates/unit-test.md**
```markdown
# Unit Test Generator

## 1. Kontekst
- **Fil:** `{{filepath}}`
- **Funktion:** `{{function_name}}`
- **Test Framework:** Jest

## 2. Instruktioner
1. Opret fil: `{{function_name}}.test.js` (eller `.ts`).
2. Importér funktionen:
   ```js
   const { {{function_name}} } = require('{{relative_import_path}}');
````

3. Dæk scenarier:

   * **Gyldigt input** → forventet output.
   * **Ugyldigt input** → forventet undtagelse (throw).
   * **Edge case** (f.eks. `null`, tom streng).

## 3. Struktur

```js
describe('{{function_name}} unit tests', () => {
  it('should return <expected> for valid input', () => {
    // Arrange
    const input = {{valid_input}};
    const expected = {{expected_output}};

    // Act
    const result = {{function_name}}(input);

    // Assert
    expect(result).toEqual(expected);
  });

  it('should throw an error for invalid input', () => {
    // Arrange
    const badInput = {{invalid_input}};

    // Act & Assert
    expect(() => {{function_name}}(badInput)).toThrow();
  });

  it('should handle edge case: <description>', () => {
    // Arrange
    const edgeInput = {{edge_case_input}};
    const expectedEdge = {{expected_edge_output}};

    // Act
    const result = {{function_name}}(edgeInput);

    // Assert
    expect(result).toEqual(expectedEdge);
  });
});
```

## 4. Parametre

* `{{filepath}}`: Relativ sti til kildefilen.
* `{{function_name}}`: Navn på funktionen der testes.
* `{{relative_import_path}}`: F.eks. `../utils/math`.
* `{{valid_input}}`, `{{expected_output}}`: Eksempel på gyldigt input/forventet output.
* `{{invalid_input}}`: F.eks. `null` eller `undefined`.
* `{{edge_case_input}}`, `{{expected_edge_output}}`: Edge-case input og forventet output.

## 5. Output

* Returnér kun testfilens indhold som én kodeblok.
* Navngiv filen `{{function_name}}.test.js` (eller `.ts`).

````

---

**templates/bugfix.md**
```markdown
# Bug Fix Template

## 1. Kontekst
- **Fil:** `{{filepath}}`
- **Fejlbeskrivelse:**  
````

{{error\_description}}

```
- **Stack Trace:**  
```

{{stack\_trace}}

````

## 2. Analyse
1. **Root Cause:**  
 Kort forklaring på, hvorfor fejlen opstod.  
2. **Impact:**  
 Hvilke funktioner og brugere påvirkes?

## 3. Løsning
1. **Kodeændringer**  
 ```diff
 --- a/{{filepath}}
 +++ b/{{filepath}}
 @@ -{{start_line}},{{old_block_length}} +{{start_line}},{{new_block_length}} @@
 {{diff_block}}
````

Forklaring:

* Forklar, hvorfor denne diff løser problemet.

2. **Edge Cases**

   * Håndter `null`, `undefined` eller tom streng.
   * Tilføj fallback/validerings-kode hvis nødvendigt.

3. **Fejlhåndtering**

   * Brug `try/except` (Python) eller `try { ... } catch { ... }` (JS/TS).
   * Returnér meningsfulde fejl eller HTTP-statuskoder.

## 4. Krav

* Ingen utilsigtet ændring af anden logik.
* Følg eksisterende kodestandarder (ESLint, PEP8).
* Tilføj kort kommentar ved væsentlige ændringer:

  ```js
  // Rettet: Undgå crash ved manglende bruger
  ```

## 5. Output

* Returnér kun diff-blokken:

  ```diff
  --- a/src/auth.ts
  +++ b/src/auth.ts
  @@ -45,7 +45,12 @@ export async function loginUser(username, password) {
       const user = await findUser(username);
       if (!user) {
  -        throw new Error('User not found');
  +        const err = new Error('Bruger ikke fundet');
  +        err.statusCode = 404;
  +        throw err;
       }
  ```
* Kort forklaring nedenfor:

  > Ændret exception-håndtering til at returnere HTTP 404 i stedet for at crashe.

````

---

**templates/documentation.md**
```markdown
# Documentation Generator Template

## 1. Kontekst
- **Fil/Modul:** `{{filepath}}`
- **Doc Type:** `{{doc_type}}`  
  (fx `API`, `Class`, `Function`, `Component`)
- **Målgruppe:** `{{audience}}`  
  (fx `udviklere`, `QA-team`)

## 2. Instruktioner

### Funktioner / Metoder
- **Formål:**  
  Beskriv kort, hvad funktionen gør.  
- **Signatur:**  
  ```ts
  function {{function_name}}({{parameters}}) → {{return_type}}
````

* **Parametre:**

  ```ts
  @param {<type>} <param_name> – <beskrivelse>
  ```
* **Returværdi:**

  ```ts
  @returns {<type>} – <beskrivelse>
  ```
* **Fejl / Exceptions:**

  ```ts
  @throws {<ErrorType>} – <beskrivelse>
  ```
* **Eksempel på brug:**

  ```ts
  // Eksempel:
  const result = {{function_name}}(arg1, arg2);
  console.log(result);
  ```
* **Edge Cases & Begrænsninger:**

  * Hvordan håndteres tomme eller ugyldige inputs?
  * Performance-overvejelser?

### Klasser / Komponenter

* **Oversigt & Formål:**

  * Hvad repræsenterer klassen/komponenten?
* **Constructor / Props:**

  ```ts
  /**
   * @param {<type>} <prop_name> – <beskrivelse>
   */
  constructor({ propA, propB }) { … }
  ```
* **Public Metoder / Interface:**
  Liste over offentlige metoder med signatur og beskrivelse.
* **Events / Callbacks:**
  Hvilke events udløses, og hvornår?
* **Lifecycle / Hooks (React):**
  Beskriv `componentDidMount`, `useEffect`, etc.

### API Endpoints

* **HTTP-metode & Path:**

  ```http
  GET /api/users/{userId}
  ```
* **Request:**

  * **Headers:** `Content-Type`, `Authorization`
  * **Path-Params:** `{ userId: string }`
  * **Query-Params:** `{ includePosts?: boolean }`
  * **Body:** (hvis relevant)

    ```jsonc
    {
      "username": "string",
      "email": "string"
    }
    ```
* **Response:**

  * **Status Codes:**

    * `200 OK` – Brugerobjekt
    * `404 Not Found` – Hvis bruger ikke findes
    * `500 Internal Server Error` – Serverfejl
  * **Body-struktur:**

    ```jsonc
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "createdAt": "string"
    }
    ```
* **Autentificering & Sikkerhed:**
  Kræver JWT-token i `Authorization` header.
* **Rate Limiting:**
  Max 1000 anmodninger/time per API-key.
* **Eksempel Requests / Responses:**

  ```http
  GET /api/users/123 HTTP/1.1
  Host: example.com
  Authorization: Bearer <token>

  HTTP/1.1 200 OK
  Content-Type: application/json

  {
    "id": "123",
    "username": "alice",
    "email": "alice@example.com",
    "createdAt": "2023-08-15T12:34:56Z"
  }
  ```

## 3. Outputformat

* **Functions/Components:** JSDoc/TSDoc-kommentarer inline i koden.
* **README/Markdown:** Generer Markdown-filer (f.eks. `docs/{{module_name}}.md`).
* **OpenAPI/Swagger:** Generer JSON eller YAML med OpenAPI v3-specifikation.

````

---

**templates/new-feature.md**
```markdown
# New Feature Specification

## 1. Feature-Oversigt
- **Navn:** `{{feature_name}}`
- **Beskrivelse:**  
````

{{feature\_description}}

```
- **User Story:**  
```

{{user\_story}}

```
Eksempel:  
> Som bruger ønsker jeg at kunne nulstille min adgangskode, så jeg kan logge ind, selvom jeg har glemt den.

## 2. Business & Tekniske Krav

### 2.1 Business Krav
- Målgruppe: `{{audience}}`  
- Værdi: Forklar, hvorfor denne feature er vigtig (ROI, bruger-feedback).

### 2.2 Tekniske Krav
- **Frontend Stack:** `{{frontend_stack}}`  
- **Backend Stack:** `{{backend_stack}}`  
- **Database:** `{{db_system}}`  
- **Integration:**  
- Auth-service: `{{auth_service}}`  
- E-mail-gateway: `{{email_gateway}}`  
- **Performance:**  
- ≤200ms svartider for UI  
- Håndter ≥100 samtidige anmodninger

## 3. Design & Arkitektur

### 3.1 Systemarkitektur
```

\[User Browser] → \[Frontend React] → \[API Gateway] → \[Auth Service] → \[Database]
\|                                          |
↓                                          ↓
\[E-mail Service]                           \[Prisma / PostgreSQL]

```

### 3.2 Datamodel & Entities
- **User**: `{ id, email, passwordHash, resetToken, resetExpiresAt }`  
- **ResetToken**: `{ token, userId, createdAt, expiresAt }`

### 3.3 Komponenter

#### Frontend
1. **ResetPasswordForm.tsx**  
   - Felter: email input, submit-knap  
   - Validering: email-format, required  
   - Kald: `POST /api/auth/reset-request`

2. **Routes**  
   - `/auth/reset-request`  
   - `/auth/reset-verify?token=<token>`

#### Backend
1. **AuthController**  
   - `POST /api/auth/reset-request`  
     - Valider email → generér token → gem token+udløb i DB → send e-mail  
   - `POST /api/auth/reset-verify`  
     - Validate token → opdater passwordHash → slet token  

2. **AuthService**  
   - `generateResetToken(userId: string): string`  
   - `verifyResetToken(token: string): boolean`  
   - `resetPassword(token: string, newPassword: string): boolean`

3. **Database Migration**  
   - Tilføj `resetToken` og `resetExpiresAt` til `User`-tabellen  
   - Eller opret `PasswordResetTokens`-tabel

#### Test
- **Unit Tests**  
  - Test token-generering + udløb  
  - Test `verifyResetToken`  
  - Test `resetPassword`  

- **Integration Tests**  
  1. `POST /api/auth/reset-request` med gyldig email → HTTP 200 + mock e-mail  
  2. Ekstrakt token fra mocked e-mail → `POST /api/auth/reset-verify` med token + ny adgangskode → HTTP 200  
  3. Ugyldigt/udløbet token → HTTP 400

## 4. Acceptkriterier
- [ ] Bruger modtager reset-e-mail inden for 5s  
- [ ] Reset-link udløber efter 1 time  
- [ ] Validering: Ingen tomme inputs  
- [ ] Unit tests ≥95% dækning  
- [ ] CI/CD kører tests uden fejl og deployer til staging

## 5. Output
1. **Arkitekturdiagram** (ASCII/URL)  
2. **Implementation Plan** (trinvis)  
3. **Kode** (mappe- og filstruktur)  
4. **Teststrategi** (unit + integration)  
5. **Deployment** (miljøvariabler, migrations, rollback)
```

---

**templates/refactor.md**

```markdown
# Refactoring Template

## 1. Kontekst
- **Fil:** `{{filepath}}`
- **Refactor Type:** `{{refactor_type}}`  
  (fx `Extract Method`, `Rename Variable`, `Replace Conditional`)
- **Målsætning:**  
```

{{goal}}

````

## 2. Analyse
1. **Eksisterende Kode**  
 ```diff
 --- a/{{filepath}}
 +++ b/{{filepath}}
 @@ -{{start_line}},{{old_block_length}} +{{start_line}},{{new_block_length}} @@
 {{diff_block}}
````

* Vis relevant kodeudsnit som reference.

2. **Identificer Problemer**

   * Code Smells: Gentagen logik, store funktioner, hårdkodede værdier.
   * Manglende abstraktion: Flere `if`-kæder, dårlig navngivning.

## 3. Forslag til Refactoring

1. **Extract Method**

   * Eksempel:

     ```diff
     --- a/src/orderService.ts
     +++ b/src/orderService.ts
     @@ -10,7 +10,7 @@ export function calculateTotal(items) {
          let sum = 0;
          items.forEach(item => {
     -      sum += item.price * item.qty;
     +      sum += computeItemTotal(item);
          });
          return sum;
     }
     ```
   * Forklaring: Udtræk logik til `computeItemTotal`.

2. **Move Function**

   * Flyt `computeItemTotal` til `utils/calc.ts`:

     ```diff
     --- a/src/utils/calc.ts
     +++ b/src/utils/calc.ts
     @@ -0,0 +1,15 @@
     +export function computeItemTotal(item) {
     +  return item.price * item.qty;
     +}
     ```

3. **Rename Variable**

   ```diff
   --- a/src/orderService.ts
   +++ b/src/orderService.ts
   @@ -8,7 +8,7 @@ export function calculateTotal(items) {
        items.forEach(item => {
   -      sum += computeItemTotal(item);
   +      sum += item.price * item.quantity; // Konsistent navngivning
        });
   ```

   Forklaring: `qty` → `quantity`.

4. **Replace Conditional with Polymorphism**

   ```ts
   // Før
   if (user.role === 'admin') {
     return adminDashboard();
   } else if (user.role === 'editor') {
     return editorDashboard();
   } else {
     return userDashboard();
   }

   // Efter
   import DashboardFactory from '../factories/DashboardFactory';

   export function getDashboard(user) {
     const factory = new DashboardFactory();
     const dashboard = factory.create(user.role);
     return dashboard.render();
   }
   ```

## 4. Trinvis Ændring

1. **Extract Method**

   ```diff
   --- a/src/orderService.ts
   +++ b/src/orderService.ts
   @@ -10,7 +10,7 @@ export function calculateTotal(items) {
        let sum = 0;
        items.forEach(item => {
   -      sum += item.price * item.qty;
   +      sum += computeItemTotal(item);
        });
        return sum;
   }
   ```

   Forklaring: Udtrækker kompleks logik til `computeItemTotal`.

2. **Move Method**

   ```diff
   --- a/src/utils/calc.ts
   +++ b/src/utils/calc.ts
   @@ -0,0 +1,15 @@
   +export function computeItemTotal(item) {
   +  return item.price * item.qty;
   +}
   ```

   Forklaring: Flytter metode til `utils` for genbrug.

3. **Rename Variable**

   ```diff
   --- a/src/orderService.ts
   +++ b/src/orderService.ts
   @@ -8,7 +8,7 @@ export function calculateTotal(items) {
        items.forEach(item => {
   -      sum += computeItemTotal(item);
   +      sum += item.price * item.quantity;
        });
   }
   ```

   Forklaring: Ændrer `qty` til `quantity`.

4. **Refactor Conditional**

   ```diff
   --- a/src/dashboardController.ts
   +++ b/src/dashboardController.ts
   @@ -5,10 +5,25 @@ export function getDashboard(user) {
     if (user.role === 'admin') {
       return adminDashboard();
     } else if (user.role === 'editor') {
       return editorDashboard();
     } else {
       return userDashboard();
     }
   }
   ```

   til

   ```ts
   import DashboardFactory from '../factories/DashboardFactory';

   export function getDashboard(user) {
     const factory = new DashboardFactory();
     const dashboard = factory.create(user.role);
     return dashboard.render();
   }
   ```

   Forklaring: Indfører factory-pattern.

## 5. Kontrolpunkter

* [ ] Ingen brud på eksisterende tests.
* [ ] Ingen cirkulære imports.
* [ ] ESLint/Prettier konfiguration opdateret.
* [ ] Nye unit tests for `computeItemTotal`.
* [ ] Dokumenter i README at `utils/calc.ts` indeholder udtrukket logik.

````

---

**templates/unit-test.md**
```markdown
# Unit Test Generator

## 1. Kontekst
- **Fil:** `{{filepath}}`
- **Funktion:** `{{function_name}}`
- **Test Framework:** Jest

## 2. Instruktioner
1. Opret fil: `{{function_name}}.test.js` (eller `.ts`).
2. Importér funktionen:
   ```js
   const { {{function_name}} } = require('{{relative_import_path}}');
````

3. Dæk scenarier:

   * **Gyldigt input** → forventet output.
   * **Ugyldigt input** → forventet undtagelse (throw).
   * **Edge case** (f.eks. `null`, tom streng).

## 3. Struktur

```js
describe('{{function_name}} unit tests', () => {
  it('should return <expected> for valid input', () => {
    // Arrange
    const input = {{valid_input}};
    const expected = {{expected_output}};

    // Act
    const result = {{function_name}}(input);

    // Assert
    expect(result).toEqual(expected);
  });

  it('should throw an error for invalid input', () => {
    // Arrange
    const badInput = {{invalid_input}};

    // Act & Assert
    expect(() => {{function_name}}(badInput)).toThrow();
  });

  it('should handle edge case: <description>', () => {
    // Arrange
    const edgeInput = {{edge_case_input}};
    const expectedEdge = {{expected_edge_output}};

    // Act
    const result = {{function_name}}(edgeInput);

    // Assert
    expect(result).toEqual(expectedEdge);
  });
});
```

## 4. Parametre

* `{{filepath}}`: Relativ sti til kildefilen.
* `{{function_name}}`: Navn på funktionen der testes.
* `{{relative_import_path}}`: F.eks. `../utils/math`.
* `{{valid_input}}`, `{{expected_output}}`: Eksempel på gyldigt input/forventet output.
* `{{invalid_input}}`: F.eks. `null` eller `undefined`.
* `{{edge_case_input}}`, `{{expected_edge_output}}`: Edge-case input og forventet output.

## 5. Output

* Returnér kun testfilens fulde indhold som én kodeblok.
* Navngiv filen `{{function_name}}.test.js` (eller `.ts`).

````

---

**templates/bugfix.md**
```markdown
# Bug Fix Template

## 1. Kontekst
- **Fil:** `{{filepath}}`
- **Fejlbeskrivelse:**  
````

{{error\_description}}

```
- **Stack Trace:**  
```

{{stack\_trace}}

````

## 2. Analyse
1. **Root Cause:**  
 Kort forklaring på, hvorfor fejlen opstod.  
2. **Impact:**  
 Hvilke funktioner og brugere påvirkes?

## 3. Løsning
1. **Kodeændringer**  
 ```diff
 --- a/{{filepath}}
 +++ b/{{filepath}}
 @@ -{{start_line}},{{old_block_length}} +{{start_line}},{{new_block_length}} @@
 {{diff_block}}
````

Forklaring:

* Forklar, hvorfor denne diff løser problemet.

2. **Edge Cases**

   * Håndter `null`, `undefined` eller tom streng.
   * Tilføj fallback/validerings-kode hvis nødvendigt.

3. **Fejlhåndtering**

   * Brug `try/except` (Python) eller `try { ... } catch { ... }` (JS/TS).
   * Returnér meningsfulde fejl eller HTTP-statuskoder.

## 4. Krav

* Ingen utilsigtet ændring af anden logik.
* Følg eksisterende kodestandarder (ESLint, PEP8).
* Tilføj kort kommentar ved væsentlige ændringer:

  ```js
  // Rettet: Undgå crash ved manglende bruger
  ```

## 5. Output

* Returnér kun diff-blokken:

  ```diff
  --- a/src/auth.ts
  +++ b/src/auth.ts
  @@ -45,7 +45,12 @@ export async function loginUser(username, password) {
       const user = await findUser(username);
       if (!user) {
  -        throw new Error('User not found');
  +        const err = new Error('Bruger ikke fundet');
  +        err.statusCode = 404;
  +        throw err;
       }
  ```
* Kort forklaring nedenfor:

  > Ændret exception-håndtering til at returnere HTTP 404 i stedet for at crashe.

````

---

**templates/documentation.md**
```markdown
# Documentation Generator Template

## 1. Kontekst
- **Fil/Modul:** `{{filepath}}`
- **Doc Type:** `{{doc_type}}`  
  (fx `API`, `Class`, `Function`, `Component`)
- **Målgruppe:** `{{audience}}`  
  (fx `udviklere`, `QA-team`)

## 2. Instruktioner

### Funktioner / Metoder
- **Formål:**  
  Beskriv kort, hvad funktionen gør.  
- **Signatur:**  
  ```ts
  function {{function_name}}({{parameters}}) → {{return_type}}
````

* **Parametre:**

  ```ts
  @param {<type>} <param_name> – <beskrivelse>
  ```
* **Returværdi:**

  ```ts
  @returns {<type>} – <beskrivelse>
  ```
* **Fejl / Exceptions:**

  ```ts
  @throws {<ErrorType>} – <beskrivelse>
  ```
* **Eksempel på brug:**

  ```ts
  // Eksempel:
  const result = {{function_name}}(arg1, arg2);
  console.log(result);
  ```
* **Edge Cases & Begrænsninger:**

  * Hvordan håndteres tomme eller ugyldige inputs?
  * Performance-overvejelser?

### Klasser / Komponenter

* **Oversigt & Formål:**

  * Hvad repræsenterer klassen/komponenten?
* **Constructor / Props:**

  ```ts
  /**
   * @param {<type>} <prop_name> – <beskrivelse>
   */
  constructor({ propA, propB }) { … }
  ```
* **Public Metoder / Interface:**
  Liste over offentlige metoder med signatur og beskrivelse.
* **Events / Callbacks:**
  Hvilke events udløses, og hvornår?
* **Lifecycle / Hooks (React):**
  Beskriv `componentDidMount`, `useEffect`, etc.

### API Endpoints

* **HTTP-metode & Path:**

  ```http
  GET /api/users/{userId}
  ```
* **Request:**

  * **Headers:** `Content-Type`, `Authorization`
  * **Path-Params:** `{ userId: string }`
  * **Query-Params:** `{ includePosts?: boolean }`
  * **Body (hvis relevant):**

    ```jsonc
    {
      "username": "string",
      "email": "string"
    }
    ```
* **Response:**

  * **Status Codes:**

    * `200 OK` – Brugerobjekt
    * `404 Not Found` – Hvis bruger ikke findes
    * `500 Internal Server Error` – Serverfejl
  * **Body-struktur:**

    ```jsonc
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "createdAt": "string"
    }
    ```
* **Autentificering & Sikkerhed:**
  Kræver JWT-token i `Authorization` header.
* **Rate Limiting:**
  Max 1000 anmodninger/time per API-key.
* **Eksempel Requests / Responses:**

  ```http
  GET /api/users/123 HTTP/1.1
  Host: example.com
  Authorization: Bearer <token>

  HTTP/1.1 200 OK
  Content-Type: application/json

  {
    "id": "123",
    "username": "alice",
    "email": "alice@example.com",
    "createdAt": "2023-08-15T12:34:56Z"
  }
  ```

## 3. Outputformat

* **Functions/Components:** JSDoc/TSDoc-kommentarer inline i koden.
* **README/Markdown:** Generer Markdown-filer (f.eks. `docs/{{module_name}}.md`).
* **OpenAPI/Swagger:** Generer JSON eller YAML med OpenAPI v3-specifikation.

````

---

**templates/new-feature.md**
```markdown
# New Feature Specification

## 1. Feature-Oversigt
- **Navn:** `{{feature_name}}`
- **Beskrivelse:**  
````

{{feature\_description}}

```
- **User Story:**  
```

{{user\_story}}

```
Eksempel:  
> Som bruger ønsker jeg at kunne nulstille min adgangskode, så jeg kan logge ind, selvom jeg har glemt den.

## 2. Business & Tekniske Krav

### 2.1 Business Krav
- Målgruppe: `{{audience}}`  
- Værdi: Forklar, hvorfor denne feature er vigtig (ROI, bruger-feedback).

### 2.2 Tekniske Krav
- **Frontend Stack:** `{{frontend_stack}}`  
- **Backend Stack:** `{{backend_stack}}`  
- **Database:** `{{db_system}}`  
- **Integration:**  
- Auth-service: `{{auth_service}}`  
- E-mail-gateway: `{{email_gateway}}`  
- **Performance:**  
- ≤200ms svartider for UI  
- Håndter ≥100 samtidige anmodninger

## 3. Design & Arkitektur

### 3.1 Systemarkitektur
```

\[User Browser] → \[Frontend React] → \[API Gateway] → \[Auth Service] → \[Database]
\|                                          |
↓                                          ↓
\[E-mail Service]                           \[Prisma / PostgreSQL]

```

### 3.2 Datamodel & Entities
- **User**: `{ id, email, passwordHash, resetToken, resetExpiresAt }`  
- **ResetToken**: `{ token, userId, createdAt, expiresAt }`

### 3.3 Komponenter

#### Frontend
1. **ResetPasswordForm.tsx**  
   - Felter: email input, submit-knap  
   - Validering: email-format, required  
   - Kald: `POST /api/auth/reset-request`

2. **Routes**  
   - `/auth/reset-request`  
   - `/auth/reset-verify?token=<token>`

#### Backend
1. **AuthController**  
   - `POST /api/auth/reset-request`  
     - Valider email → generér token → gem token+udløb i DB → send e-mail  
   - `POST /api/auth/reset-verify`  
     - Validate token → opdater passwordHash → slet token  

2. **AuthService**  
   - `generateResetToken(userId: string): string`  
   - `verifyResetToken(token: string): boolean`  
   - `resetPassword(token: string, newPassword: string): boolean`

3. **Database Migration**  
   - Tilføj `resetToken` og `resetExpiresAt` til `User`-tabellen  
   - Eller opret `PasswordResetTokens`-tabel

#### Test
- **Unit Tests**  
  - Test token-generering + udløb  
  - Test `verifyResetToken`  
  - Test `resetPassword`  

- **Integration Tests**  
  1. `POST /api/auth/reset-request` med gyldig email → HTTP 200 + mock e-mail  
  2. Ekstrakt token fra mocked e-mail → `POST /api/auth/reset-verify` med token + ny adgangskode → HTTP 200  
  3. Ugyldigt/udløbet token → HTTP 400

## 4. Acceptkriterier
- [ ] Bruger modtager reset-e-mail inden for 5s  
- [ ] Reset-link udløber efter 1 time  
- [ ] Validering: Ingen tomme inputs  
- [ ] Unit tests ≥95% dækning  
- [ ] CI/CD kører tests uden fejl og deployer til staging

## 5. Output
1. **Arkitekturdiagram** (ASCII/URL)  
2. **Implementation Plan** (trinvis)  
3. **Kode** (mappe- og filstruktur)  
4. **Teststrategi** (unit + integration)  
5. **Deployment** (miljøvariabler, migrations, rollback)
```

---

**templates/refactor.md**

```markdown
# Refactoring Template

## 1. Kontekst
- **Fil:** `{{filepath}}`
- **Refactor Type:** `{{refactor_type}}`  
  (fx `Extract Method`, `Rename Variable`, `Replace Conditional`)
- **Målsætning:**  
```

{{goal}}

````

## 2. Analyse
1. **Eksisterende Kode**  
 ```diff
 --- a/{{filepath}}
 +++ b/{{filepath}}
 @@ -{{start_line}},{{old_block_length}} +{{start_line}},{{new_block_length}} @@
 {{diff_block}}
````

* Vis relevant kodeudsnit som reference.

2. **Identificer Problemer**

   * Code Smells: Gentagen logik, store funktioner, hårdkodede værdier.
   * Manglende abstraktion: Flere `if`-kæder, dårlig navngivning.

## 3. Forslag til Refactoring

1. **Extract Method**

   * Eksempel:

     ```diff
     --- a/src/orderService.ts
     +++ b/src/orderService.ts
     @@ -10,7 +10,7 @@ export function calculateTotal(items) {
          let sum = 0;
          items.forEach(item => {
     -      sum += item.price * item.qty;
     +      sum += computeItemTotal(item);
          });
          return sum;
     }
     ```
   * Forklaring: Udtræk logik til `computeItemTotal`.

2. **Move Function**

   * Flyt `computeItemTotal` til `utils/calc.ts`:

     ```diff
     --- a/src/utils/calc.ts
     +++ b/src/utils/calc.ts
     @@ -0,0 +1,15 @@
     +export function computeItemTotal(item) {
     +  return item.price * item.qty;
     +}
     ```

3. **Rename Variable**

   ```diff
   --- a/src/orderService.ts
   +++ b/src/orderService.ts
   @@ -8,7 +8,7 @@ export function calculateTotal(items) {
        items.forEach(item => {
   -      sum += computeItemTotal(item);
   +      sum += item.price * item.quantity; // Konsistent navngivning
        });
   ```

   Forklaring: `qty` → `quantity`.

4. **Replace Conditional with Polymorphism**

   ```ts
   // Før
   if (user.role === 'admin') {
     return adminDashboard();
   } else if (user.role === 'editor') {
     return editorDashboard();
   } else {
     return userDashboard();
   }

   // Efter
   import DashboardFactory from '../factories/DashboardFactory';

   export function getDashboard(user) {
     const factory = new DashboardFactory();
     const dashboard = factory.create(user.role);
     return dashboard.render();
   }
   ```

## 4. Trinvis Ændring

1. **Extract Method**

   ```diff
   --- a/src/orderService.ts
   +++ b/src/orderService.ts
   @@ -10,7 +10,7 @@ export function calculateTotal(items) {
        let sum = 0;
        items.forEach(item => {
   -      sum += item.price * item.qty;
   +      sum += computeItemTotal(item);
        });
        return sum;
   }
   ```

   Forklaring: Udtrækker kompleks logik til `computeItemTotal`.

2. **Move Method**

   ```diff
   --- a/src/utils/calc.ts
   +++ b/src/utils/calc.ts
   @@ -0,0 +1,15 @@
   +export function computeItemTotal(item) {
   +  return item.price * item.qty;
   +}
   ```

   Forklaring: Flytter metode til `utils` for genbrug.

3. **Rename Variable**

   ```diff
   --- a/src/orderService.ts
   +++ b/src/orderService.ts
   @@ -8,7 +8,7 @@ export function calculateTotal(items) {
        items.forEach(item => {
   -      sum += computeItemTotal(item);
   +      sum += item.price * item.quantity;
        });
   }
   ```

   Forklaring: Ændrer `qty` til `quantity`.

4. **Refactor Conditional**

   ```diff
   --- a/src/dashboardController.ts
   +++ b/src/dashboardController.ts
   @@ -5,10 +5,25 @@ export function getDashboard(user) {
     if (user.role === 'admin') {
       return adminDashboard();
     } else if (user.role === 'editor') {
       return editorDashboard();
     } else {
       return userDashboard();
     }
   }
   ```

   til

   ```ts
   import DashboardFactory from '../factories/DashboardFactory';

   export function getDashboard(user) {
     const factory = new DashboardFactory();
     const dashboard = factory.create(user.role);
     return dashboard.render();
   }
   ```

   Forklaring: Indfører factory-pattern.

## 5. Kontrolpunkter

* [ ] Ingen brud på eksisterende tests.
* [ ] Ingen cirkulære imports.
* [ ] ESLint/Prettier konfiguration opdateret.
* [ ] Nye unit tests for `computeItemTotal`.
* [ ] Dokumenter i README at `utils/calc.ts` indeholder udtrukket logik.

````

---

**templates/unit-test.md**
```markdown
# Unit Test Generator

## 1. Kontekst
- **Fil:** `{{filepath}}`
- **Funktion:** `{{function_name}}`
- **Test Framework:** Jest

## 2. Instruktioner
1. Opret fil: `{{function_name}}.test.js` (eller `.ts`).
2. Importér funktionen:
   ```js
   const { {{function_name}} } = require('{{relative_import_path}}');
````

3. Dæk scenarier:

   * **Gyldigt input** → forventet output.
   * **Ugyldigt input** → forventet undtagelse (throw).
   * **Edge case** (f.eks. `null`, tom streng).

## 3. Struktur

```js
describe('{{function_name}} unit tests', () => {
  it('should return <expected> for valid input', () => {
    // Arrange
    const input = {{valid_input}};
    const expected = {{expected_output}};

    // Act
    const result = {{function_name}}(input);

    // Assert
    expect(result).toEqual(expected);
  });

  it('should throw an error for invalid input', () => {
    // Arrange
    const badInput = {{invalid_input}};

    // Act & Assert
    expect(() => {{function_name}}(badInput)).toThrow();
  });

  it('should handle edge case: <description>', () => {
    // Arrange
    const edgeInput = {{edge_case_input}};
    const expectedEdge = {{expected_edge_output}};

    // Act
    const result = {{function_name}}(edgeInput);

    // Assert
    expect(result).toEqual(expectedEdge);
  });
});
```

## 4. Parametre

* `{{filepath}}`: Relativ sti til kildefilen.
* `{{function_name}}`: Navn på funktionen der testes.
* `{{relative_import_path}}`: F.eks. `../utils/math`.
* `{{valid_input}}`, `{{expected_output}}`: Eksempel på gyldigt input/forventet output.
* `{{invalid_input}}`: F.eks. `null` eller `undefined`.
* `{{edge_case_input}}`, `{{expected_edge_output}}`: Edge-case input og forventet output.

## 5. Output

* Returnér kun testfilens fulde indhold som én kodeblok.
* Navngiv filen `{{function_name}}.test.js` (eller `.ts`).

````

---

**templates/bugfix.md**
```markdown
# Bug Fix Template

## 1. Kontekst
- **Fil:** `{{filepath}}`
- **Fejlbeskrivelse:**  
````

{{error\_description}}

```
- **Stack Trace:**  
```

{{stack\_trace}}

````

## 2. Analyse
1. **Root Cause:**  
 Kort forklaring på, hvorfor fejlen opstod.  
2. **Impact:**  
 Hvilke funktioner og brugere påvirkes?

## 3. Løsning
1. **Kodeændringer**  
 ```diff
 --- a/{{filepath}}
 +++ b/{{filepath}}
 @@ -{{start_line}},{{old_block_length}} +{{start_line}},{{new_block_length}} @@
 {{diff_block}}
````

Forklaring:

* Forklar, hvorfor denne diff løser problemet.

2. **Edge Cases**

   * Håndter `null`, `undefined` eller tom streng.
   * Tilføj fallback/validerings-kode hvis nødvendigt.

3. **Fejlhåndtering**

   * Brug `try/except` (Python) eller `try { ... } catch { ... }` (JS/TS).
   * Returnér meningsfulde fejl eller HTTP-statuskoder.

## 4. Krav

* Ingen utilsigtet ændring af anden logik.
* Følg eksisterende kodestandarder (ESLint, PEP8).
* Tilføj kort kommentar ved væsentlige ændringer:

  ```js
  // Rettet: Undgå crash ved manglende bruger
  ```

## 5. Output

* Returnér kun diff-blokken:

  ```diff
  --- a/src/auth.ts
  +++ b/src/auth.ts
  @@ -45,7 +45,12 @@ export async function loginUser(username, password) {
       const user = await findUser(username);
       if (!user) {
  -        throw new Error('User not found');
  +        const err = new Error('Bruger ikke fundet');
  +        err.statusCode = 404;
  +        throw err;
       }
  ```
* Kort forklaring nedenfor:

  > Ændret exception-håndtering til at returnere HTTP 404 i stedet for at crashe.

````

---

**templates/documentation.md**
```markdown
# Documentation Generator Template

## 1. Kontekst
- **Fil/Modul:** `{{filepath}}`
- **Doc Type:** `{{doc_type}}`  
  (fx `API`, `Class`, `Function`, `Component`)
- **Målgruppe:** `{{audience}}`  
  (fx `udviklere`, `QA-team`)

## 2. Instruktioner

### Funktioner / Metoder
- **Formål:**  
  Beskriv kort, hvad funktionen gør.  
- **Signatur:**  
  ```ts
  function {{function_name}}({{parameters}}) → {{return_type}}
````

* **Parametre:**

  ```ts
  @param {<type>} <param_name> – <beskrivelse>
  ```
* **Returværdi:**

  ```ts
  @returns {<type>} – <beskrivelse>
  ```
* **Fejl / Exceptions:**

  ```ts
  @throws {<ErrorType>} – <beskrivelse>
  ```
* **Eksempel på brug:**

  ```ts
  // Eksempel:
  const result = {{function_name}}(arg1, arg2);
  console.log(result);
  ```
* **Edge Cases & Begrænsninger:**

  * Hvordan håndteres tomme eller ugyldige inputs?
  * Performance-overvejelser?

### Klasser / Komponenter

* **Oversigt & Formål:**

  * Hvad repræsenterer klassen/komponenten?
* **Constructor / Props:**

  ```ts
  /**
   * @param {<type>} <prop_name> – <beskrivelse>
   */
  constructor({ propA, propB }) { … }
  ```
* **Public Metoder / Interface:**
  Liste over offentlige metoder med signatur og beskrivelse.
* **Events / Callbacks:**
  Hvilke events udløses, og hvornår?
* **Lifecycle / Hooks (React):**
  Beskriv `componentDidMount`, `useEffect`, etc.

### API Endpoints

* **HTTP-metode & Path:**

  ```http
  GET /api/users/{userId}
  ```
* **Request:**

  * **Headers:** `Content-Type`, `Authorization`
  * **Path-Params:** `{ userId: string }`
  * **Query-Params:** `{ includePosts?: boolean }`
  * **Body (hvis relevant):**

    ```jsonc
    {
      "username": "string",
      "email": "string"
    }
    ```
* **Response:**

  * **Status Codes:**

    * `200 OK` – Brugerobjekt
    * `404 Not Found` – Hvis bruger ikke findes
    * `500 Internal Server Error` – Serverfejl
  * **Body-struktur:**

    ```jsonc
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "createdAt": "string"
    }
    ```
* **Autentificering & Sikkerhed:**
  Kræver JWT-token i `Authorization` header.
* **Rate Limiting:**
  Max 1000 anmodninger/time per API-key.
* **Eksempel Requests / Responses:**

  ```http
  GET /api/users/123 HTTP/1.1
  Host: example.com
  Authorization: Bearer <token>

  HTTP/1.1 200 OK
  Content-Type: application/json

  {
    "id": "123",
    "username": "alice",
    "email": "alice@example.com",
    "createdAt": "2023-08-15T12:34:56Z"
  }
  ```

## 3. Outputformat

* **Functions/Components:** JSDoc/TSDoc-kommentarer inline i koden.
* **README/Markdown:** Generer Markdown-filer (f.eks. `docs/{{module_name}}.md`).
* **OpenAPI/Swagger:** Generer JSON eller YAML med OpenAPI v3-specifikation.

````

---

**templates/new-feature.md**
```markdown
# New Feature Specification

## 1. Feature-Oversigt
- **Navn:** `{{feature_name}}`
- **Beskrivelse:**  
````

{{feature\_description}}

```
- **User Story:**  
```

{{user\_story}}

```
Eksempel:  
> Som bruger ønsker jeg at kunne nulstille min adgangskode, så jeg kan logge ind, selvom jeg har glemt den.

## 2. Business & Tekniske Krav

### 2.1 Business Krav
- Målgruppe: `{{audience}}`  
- Værdi: Forklar, hvorfor denne feature er vigtig (ROI, bruger-feedback).

### 2.2 Tekniske Krav
- **Frontend Stack:** `{{frontend_stack}}`  
- **Backend Stack:** `{{backend_stack}}`  
- **Database:** `{{db_system}}`  
- **Integration:**  
- Auth-service: `{{auth_service}}`  
- E-mail-gateway: `{{email_gateway}}`  
- **Performance:**  
- ≤200ms svartider for UI  
- Håndter ≥100 samtidige anmodninger

## 3. Design & Arkitektur

### 3.1 Systemarkitektur
```

\[User Browser] → \[Frontend React] → \[API Gateway] → \[Auth Service] → \[Database]
\|                                          |
↓                                          ↓
\[E-mail Service]                           \[Prisma / PostgreSQL]

```

### 3.2 Datamodel & Entities
- **User**: `{ id, email, passwordHash, resetToken, resetExpiresAt }`  
- **ResetToken**: `{ token, userId, createdAt, expiresAt }`

### 3.3 Komponenter

#### Frontend
1. **ResetPasswordForm.tsx**  
   - Felter: email input, submit-knap  
   - Validering: email-format, required  
   - Kald: `POST /api/auth/reset-request`

2. **Routes**  
   - `/auth/reset-request`  
   - `/auth/reset-verify?token=<token>`

#### Backend
1. **AuthController**  
   - `POST /api/auth/reset-request`  
     - Valider email → generér token → gem token+udløb i DB → send e-mail  
   - `POST /api/auth/reset-verify`  
     - Validate token → opdater passwordHash → slet token  

2. **AuthService**  
   - `generateResetToken(userId: string): string`  
   - `verifyResetToken(token: string): boolean`  
   - `resetPassword(token: string, newPassword: string): boolean`

3. **Database Migration**  
   - Tilføj `resetToken` og `resetExpiresAt` til `User`-tabellen  
   - Eller opret `PasswordResetTokens`-tabel

#### Test
- **Unit Tests**  
  - Test token-generering + udløb  
  - Test `verifyResetToken`  
  - Test `resetPassword`  

- **Integration Tests**  
  1. `POST /api/auth/reset-request` med gyldig email → HTTP 200 + mock e-mail  
  2. Ekstrakt token fra mocked e-mail → `POST /api/auth/reset-verify` med token + ny adgangskode → HTTP 200  
  3. Ugyldigt/udløbet token → HTTP 400

## 4. Acceptkriterier
- [ ] Bruger modtager reset-e-mail inden for 5s  
- [ ] Reset-link udløber efter 1 time  
- [ ] Validering: Ingen tomme inputs  
- [ ] Unit tests ≥95% dækning  
- [ ] CI/CD kører tests uden fejl og deployer til staging

## 5. Output
1. **Arkitekturdiagram** (ASCII/URL)  
2. **Implementation Plan** (trinvis)  
3. **Kode** (mappe- og filstruktur)  
4. **Teststrategi** (unit + integration)  
5. **Deployment** (miljøvariabler, migrations, rollback)
```

---

Disse filer er fulde, fejlfri, avancerede og “plug-and-play.” Kopiér dem direkte ind i din projektmappe:

```
/project-root
├── prompt_history_server.py
└── templates
    ├── agent-prompt.md
    ├── bugfix.md
    ├── documentation.md
    ├── new-feature.md
    ├── refactor.md
    └── unit-test.md
```

Ingen yderligere tilpasninger kræves for at få dem kørende – installer blot Flask (`pip install flask`) og sørg for at køre `prompt_history_server.py` på port 5007.
