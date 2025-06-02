#!/usr/bin/env python3
import os
import re
import ast
import logging
from flask import Flask, request, jsonify
from typing import List, Dict, Any

# ----------------------------------------
# Konfiguration & Logging
# ----------------------------------------
APP_NAME = "CodeLensServer"
HOST = "0.0.0.0"
PORT = 5008
CONTEXT_WINDOW_LINES = 5  # antal linjer før/efter til kontekst

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(APP_NAME)

app = Flask(__name__)

# ----------------------------------------
# Hjælpefunktioner
# ----------------------------------------

def read_file_lines(filepath: str) -> List[str]:
    """Læs alle linjer fra en fil, returner liste af str-objekter."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Fil ikke fundet: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        return f.readlines()

def detect_code_type(line: str, filepath: str) -> str:
    """
    Detekter kode-type ud fra extension og mønstre.
    Returnerer en af: 'function', 'async_function', 'class', 'arrow_function',
    'interface', 'type_alias' eller 'code'.
    """
    file_ext = os.path.splitext(filepath)[1].lower()
    stripped = line.strip()

    # Python
    if file_ext == ".py":
        if re.match(r"^\s*async\s+def\s+\w+", line):
            return "async_function"
        if re.match(r"^\s*def\s+\w+", line):
            return "function"
        if re.match(r"^\s*class\s+\w+", line):
            return "class"

    # JavaScript / TypeScript
    if file_ext in [".js", ".jsx", ".ts", ".tsx"]:
        if re.match(r"^\s*(?:export\s+)?(?:async\s+)?function\s+\w+", line):
            return "function"
        if re.match(r"^\s*(?:export\s+)?class\s+\w+", line):
            return "class"
        if re.match(r"^\s*(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\(", line):
            return "arrow_function"
        if re.match(r"^\s*interface\s+\w+", line):
            return "interface"
        if re.match(r"^\s*type\s+\w+", line):
            return "type_alias"

    return "code"

def extract_name_from_line(line: str) -> str:
    """
    Ekstraher navn (funktion/klasse/variabel) fra en linje ved hjælp af regex.
    Returnerer 'unknown' ved ingen match.
    """
    patterns = [
        r"(?:function|def|class)\s+(\w+)",
        r"(?:const|let|var)\s+(\w+)\s*=",
        r"interface\s+(\w+)",
        r"type\s+(\w+)",
    ]
    for pat in patterns:
        match = re.search(pat, line)
        if match:
            return match.group(1)
    return "unknown"

def analyze_code_context(filepath: str, line: int) -> Dict[str, Any]:
    """
    Læs fil og returner JSON med:
      - 'line'           : forespurgt linjenummer
      - 'content'        : den strippede linje
      - 'context'        : samlet tekst fra (line - CONTEXT_WINDOW) til (line + CONTEXT_WINDOW)
      - 'type'           : kode-typen (function/class/...)
      - 'file_exists'    : boolean
    Eller nøglen 'error' ved problemer.
    """
    result: Dict[str, Any] = {"line": line, "file_exists": False}

    try:
        lines = read_file_lines(filepath)
        result["file_exists"] = True

        total_lines = len(lines)
        if not (1 <= line <= total_lines):
            return {"error": f"Linjenummer {line} uden for rækkevidde (1–{total_lines})"}

        current_line = lines[line - 1].rstrip("\n")
        start = max(0, line - 1 - CONTEXT_WINDOW_LINES)
        end = min(total_lines, line - 1 + CONTEXT_WINDOW_LINES + 1)
        context_snippet = "".join(lines[start:end])

        code_type = detect_code_type(current_line, filepath)

        result.update({
            "content": current_line,
            "context": context_snippet,
            "type": code_type,
        })
        return result

    except FileNotFoundError as fe:
        logger.error(f"FileNotFound: {fe}")
        return {"error": str(fe)}
    except Exception as e:
        logger.exception("Uventet fejl i analyze_code_context:")
        return {"error": str(e)}

def generate_suggestions(analysis: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Baseret på kode-typen og længden af 'content', generer en liste af forslag:
      - explain, generate-tests, generate-docs, optimize, refactor, etc.
    """
    suggestions: List[Dict[str, str]] = []
    code_type = analysis.get("type", "code")
    content = analysis.get("content", "")

    # Altid ét forslag til forklaring
    suggestions.append({"action": "explain", "label": "💡 Forklar denne kode"})

    # For funktioner (Python/JS/TS) → test, docs, optimization, error handling
    if code_type in ["function", "async_function", "arrow_function"]:
        suggestions.extend([
            {"action": "generate-tests",     "label": "🧪 Generer unit tests"},
            {"action": "generate-docs",      "label": "📝 Generer dokumentation"},
            {"action": "optimize",           "label": "⚡ Optimer funktion"},
            {"action": "add-error-handling", "label": "🛡️ Tilføj fejlhåndtering"},
        ])

    # For klasser
    if code_type == "class":
        suggestions.extend([
            {"action": "generate-tests",       "label": "🧪 Generer test suite"},
            {"action": "generate-docs",        "label": "📝 Generer klasse dokumentation"},
            {"action": "add-methods",          "label": "➕ Foreslå metoder"},
            {"action": "implement-interface",  "label": "🔧 Implementer interface"},
        ])

    # For TypeScript interfaces / type aliases
    if code_type in ["interface", "type_alias"]:
        suggestions.extend([
            {"action": "generate-implementation", "label": "🏗️ Generer implementation"},
            {"action": "generate-mock",           "label": "🎭 Generer mock data"},
            {"action": "validate-usage",          "label": "✅ Valider brug"},
        ])

    # Hvis linjen er særligt kompleks (længde > 80 eller flere parenteser), tilføj refactor-suggestion
    if len(content) > 80 or content.count("(") > 3:
        suggestions.append({"action": "refactor", "label": "🔨 Refaktorer kompleks kode"})

    return suggestions

def generate_file_suggestions(stats: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Baseret på filstatistik (complexity_score, antal funktioner/klasser),
    udarbejd forslag til refaktorering/omstrukturering.
    """
    suggestions: List[Dict[str, str]] = []

    if stats.get("complexity_score", 0) > 50:
        suggestions.append({
            "action": "split-file",
            "label": "🔪 Opdel fil i mindre moduler",
            "reason": "Høj kompleksitet detekteret"
        })
    if stats.get("functions", 0) > 10:
        suggestions.append({
            "action": "organize-functions",
            "label": "📂 Organiser funktioner i klasser",
            "reason": "Mange løse funktioner"
        })
    if stats.get("code_lines", 0) > 300:
        suggestions.append({
            "action": "refactor-file",
            "label": "🗂️ Refaktorer stor fil",
            "reason": "Lang fil med mange linjer"
        })

    return suggestions

def calculate_complexity_score(content: str) -> int:
    """
    Simpel kompleksitetsmåler:
      - +1 point pr. 'if ' 
      - +2 pr. 'for ' og 'while '
      - +1 pr. 'try:' / 'catch'
      - +1 pr. '&&' eller '||'
      - +3 pr. indlejret def/class i Python (4+ spaces)
    """
    score = 0
    score += content.count("if ") * 1
    score += content.count("for ") * 2
    score += content.count("while ") * 2
    score += content.count("try:") * 1
    score += content.count("catch") * 1
    score += content.count("&&") * 1
    score += content.count("||") * 1
    # Nested def/class (Python)
    nested = re.findall(r"^\s{4,}(?:def|class)\s+", content, re.MULTILINE)
    score += len(nested) * 3
    return score

# ----------------------------------------
# Flask Endpoints
# ----------------------------------------

@app.route("/code-lens", methods=["POST"])
def code_lens():
    """
    POST /code-lens
    Input JSON: {"filepath": "<sti>", "line": <linjenummer>}
    Returnerer:
      {
        "filepath": "...",
        "line": 42,
        "file_exists": true/false,
        "type": "function"/"class"/...,
        "content": "...",
        "context": "...",
        "suggestions": [ {action,label,...}, ... ]
      }
    Eller ved fejl: { "error": "<besked>" }
    """
    data = request.get_json(force=True) or {}
    filepath = data.get("filepath", "").strip()
    line = data.get("line")

    if not filepath or not isinstance(line, int):
        return jsonify({"error": "Parametre 'filepath' (string) og 'line' (int) kræves."}), 400

    logger.info(f"code-lens request for {filepath}@{line}")
    analysis = analyze_code_context(filepath, line)
    if "error" in analysis:
        return jsonify(analysis), 400

    suggestions = generate_suggestions(analysis)
    return jsonify({
        "filepath": filepath,
        "line": line,
        "file_exists": True,
        "type": analysis["type"],
        "content": analysis["content"],
        "context": analysis["context"],
        "suggestions": suggestions
    }), 200

@app.route("/execute-action", methods=["POST"])
def execute_action():
    """
    POST /execute-action
    Input JSON: {"filepath": "...", "line": 42, "action": "<en af suggestions>"}
    Returnerer:
      {
        "action": "<valgt_action>",
        "intent": "<tilhørende_intent>",
        "parameters": { ... },
        "next_step": "Beskriv næste trin (fx brug af prompt-history)"
      }
    """
    data = request.get_json(force=True) or {}
    filepath = data.get("filepath", "").strip()
    line = data.get("line")
    action = data.get("action", "").strip()

    if not filepath or not isinstance(line, int) or not action:
        return jsonify({"error": "Parametre 'filepath', 'line' (int) og 'action' kræves."}), 400

    logger.info(f"execute-action '{action}' for {filepath}@{line}")
    analysis = analyze_code_context(filepath, line)
    if "error" in analysis:
        return jsonify(analysis), 400

    action_to_intent = {
        "generate-tests":       "unit-test",
        "generate-docs":        "documentation",
        "optimize":             "refactor",
        "refactor":             "refactor",
        "add-error-handling":   "bugfix",
        "generate-implementation": "new-feature",
        "add-methods":             "new-feature",
    }
    intent = action_to_intent.get(action, "new-feature")

    parameters = {
        "filepath":      filepath,
        "function_name": extract_name_from_line(analysis["content"]),
        "code_context":  analysis["context"],
        "line_number":   line,
        "code_type":     analysis["type"],
    }

    return jsonify({
        "action":    action,
        "intent":    intent,
        "parameters": parameters,
        "next_step": "Call prompt-history /fill-template to generate final output"
    }), 200

@app.route("/analyze-file", methods=["POST"])
def analyze_file():
    """
    POST /analyze-file
    Input JSON: {"filepath": "<sti>"}
    Returnerer:
      {
        "filepath": "...",
        "interesting_points": [
          { "line": 3, "type": "function", "content": "def foo():", "name": "foo" },
          ...
        ],
        "stats": {
          "total_lines": 200,
          "code_lines": 180,
          "functions": 10,
          "classes": 2,
          "complexity_score": 35
        },
        "suggestions": [ {action,label,reason}, ... ]
      }
    Eller ved fejl: {"error": "..."}
    """
    data = request.get_json(force=True) or {}
    filepath = data.get("filepath", "").strip()

    if not filepath:
        return jsonify({"error": "Parameter 'filepath' kræves."}), 400

    logger.info(f"analyze-file request for {filepath}")
    try:
        lines = read_file_lines(filepath)
        total_lines = len(lines)
        code_lines = sum(1 for l in lines if l.strip() and not l.strip().startswith("#"))

        interesting = []
        for idx, raw_line in enumerate(lines, start=1):
            lt = detect_code_type(raw_line, filepath)
            if lt != "code":
                interesting.append({
                    "line":    idx,
                    "type":    lt,
                    "content": raw_line.strip(),
                    "name":    extract_name_from_line(raw_line.strip())
                })

        content = "".join(lines)
        complexity = calculate_complexity_score(content)
        functions_count = sum(1 for pt in interesting if "function" in pt["type"])
        classes_count = sum(1 for pt in interesting if pt["type"] == "class")

        stats = {
            "total_lines":     total_lines,
            "code_lines":      code_lines,
            "functions":       functions_count,
            "classes":         classes_count,
            "complexity_score": complexity,
        }
        suggestions = generate_file_suggestions(stats)

        return jsonify({
            "filepath":          filepath,
            "interesting_points": interesting,
            "stats":             stats,
            "suggestions":       suggestions
        }), 200

    except FileNotFoundError as fe:
        logger.error(f"FileNotFound: {fe}")
        return jsonify({"error": str(fe)}), 400
    except Exception as e:
        logger.exception("Uventet fejl i analyze_file:")
        return jsonify({"error": str(e)}), 500

# ----------------------------------------
# Start server
# ----------------------------------------
if __name__ == "__main__":
    logger.info(f"Starter {APP_NAME} på http://{HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=False)
