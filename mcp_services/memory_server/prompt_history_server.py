#!/usr/bin/env python3
import os
import json
import re
from flask import Flask, request, jsonify
from datetime import datetime
from typing import Dict, List, Any

# --- Konfiguration af stier og mapper ---
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
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

    # Split på slut-markør, behold indholdet før hver '=== PROMPT_END ==='
    raw_blocks = content.split("=== PROMPT_END ===")
    blocks = []
    for block in raw_blocks:
        block = block.strip()
        if block:
            # Tilføj markør igen så hver blok er komplet
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

        # Definér mønstre pr. intent
        intent_patterns = {
            "unit-test": [
                r"\bunit\s*test\b", r"\bjest\b", r"\bmocha\b", r"\btest(s)?\b", r"\bspec\b"
            ],
            "bugfix": [
                r"\bfix\b", r"\bbug\b", r"\berror\b", r"\bissue\b", r"\bproblem\b",
                r"\bcrash\b", r"\bfejl\b", r"\brettet?\b"
            ],
            "refactor": [
                r"\brefactor(ed|ing)?\b", r"\bclean\b", r"\bimprove(d)?\b",
                r"\boptimi[sz]e(d)?\b", r"\breorgani[sz]e(d)?\b", r"\bsimplify(ed)?\b"
            ],
            "documentation": [
                r"\bdoc(s)?\b", r"\bdocument(s)?\b", r"\bcomment(s)?\b",
                r"\bexplain(s)?\b", r"\bdescribe(d)?\b", r"\breadme\b", r"\bjsdoc\b", r"\bdokument(s)?\b"
            ],
            "new-feature": [
                r"\bnew\b", r"\bfeature(s)?\b", r"\badd(s)?\b", r"\bcreate(s)?\b",
                r"\bimplement(s)?\b", r"\bbuild(s)?\b", r"\btilføj(s)?\b", r"\bny\b"
            ],
        }

        # Score intents
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

        # Find alle {{placeholder}} der stadig mangler
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
