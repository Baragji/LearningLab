# scripts/prompt_history_server.py
import os
from flask import Flask, request, jsonify
from datetime import datetime

# Opret en Flask applikation
app = Flask(__name__)

# Definer stien til logfilen.
# Da dette script ligger i /scripts, skal vi gå et niveau op (../) for at finde /prompt_history.
LOG_FILE_PATH = os.path.join(os.path.dirname(__file__), '..', 'prompt_history', 'history.log')

@app.route('/append', methods=['POST'])
def append_to_history():
    """
    Modtager en ny samtaleblok og tilføjer den til history.log.
    Forventer JSON-input: {"user_prompt": "...", "assistant_response": "..."}
    """
    data = request.get_json()
    if not data or 'user_prompt' not in data or 'assistant_response' not in data:
        return jsonify({"error": "Invalid input. 'user_prompt' and 'assistant_response' are required."}), 400

    user_prompt = data['user_prompt']
    assistant_response = data['assistant_response']
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Formatér blokken som specificeret i planen
    log_entry = (
        f"=== PROMPT_START ===\n"
        f"{timestamp}\n"
        f"BRUGER: {user_prompt}\n"
        f"ASSISTENT: {assistant_response}\n"
        f"=== PROMPT_END ===\n\n"
    )

    try:
        # Tilføj den nye blok til filen
        with open(LOG_FILE_PATH, 'a', encoding='utf-8') as f:
            f.write(log_entry)
        return jsonify({"success": "History appended."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/last', methods=['GET'])
def get_last_entries():
    """
    Returnerer de seneste 'n' samtaleblokke fra history.log.
    Bruger query parameter: /last?n=2
    """
    try:
        n = int(request.args.get('n', 2)) # Standard til 2 hvis 'n' ikke er angivet
    except ValueError:
        return jsonify({"error": "Query parameter 'n' must be an integer."}), 400

    try:
        with open(LOG_FILE_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split historikken op i blokke baseret på slut-separatoren
        blocks = content.strip().split('=== PROMPT_END ===')
        # Fjern tomme strenge, der kan opstå efter split
        blocks = [block.strip() for block in blocks if block.strip()]

        # Find de seneste n blokke
        last_n_blocks = blocks[-n:]

        # Sæt dem sammen igen til en enkelt tekststreng
        result = "\n".join(block + "\n=== PROMPT_END ===" for block in last_n_blocks).strip()
        
        return jsonify({"history": result}), 200
    except FileNotFoundError:
        return jsonify({"history": ""}), 200 # Returner tom historik hvis filen ikke findes endnu
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Serveren kører på port 5001 for at undgå konflikter med andre standardporte
    app.run(host='0.0.0.0', port=5007, debug=True)