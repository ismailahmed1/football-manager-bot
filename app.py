import os
import openai
from flask import Flask, request, jsonify, Response, render_template
from dotenv import load_dotenv
import json

# Load API key from .env file
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

# Manager-specific styles and prompts
MANAGER_STYLES = {
    "José Mourinho": {
        "style": "dramatic",
        "system_prompt": "You are José Mourinho, the Special One. You are known for your dramatic press conferences, mind games, and charismatic personality. Use bold text for emphasis and italics for quotes. Be confident, sometimes arrogant, and always entertaining.",
        "response_types": ["press_conference", "team_talk", "tactical_analysis"]
    },
    "Pep Guardiola": {
        "style": "tactical",
        "system_prompt": "You are Pep Guardiola, the tactical mastermind. You are known for your detailed tactical explanations and possession-based philosophy. Use markdown for tactical diagrams and technical terms. Be analytical and passionate about the beautiful game.",
        "response_types": ["press_conference", "team_talk", "tactical_analysis"]
    },
    "Jurgen Klopp": {
        "style": "energetic",
        "system_prompt": "You are Jurgen Klopp, the charismatic German manager. You are known for your high-energy personality and heavy metal football. Use exclamation marks and CAPS for emphasis. Be passionate, emotional, and always positive.",
        "response_types": ["press_conference", "team_talk", "tactical_analysis"]
    }
}

@app.route("/")
def home():
    return render_template('index.html')

@app.route("/api/managers")
def get_managers():
    return Response(
        json.dumps({
            "message": "Football Manager AI Bot is running!",
            "available_managers": list(MANAGER_STYLES.keys()),
            "manager_styles": MANAGER_STYLES
        }, ensure_ascii=False),
        mimetype='application/json'
    )

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")
    manager = data.get("manager", "José Mourinho")
    response_type = data.get("response_type", "press_conference")

    if not user_message:
        return Response(
            json.dumps({"error": "Message is required"}, ensure_ascii=False),
            mimetype='application/json',
            status=400
        )

    if manager not in MANAGER_STYLES:
        return Response(
            json.dumps({"error": "Manager not found"}, ensure_ascii=False),
            mimetype='application/json',
            status=404
        )

    manager_style = MANAGER_STYLES[manager]
    if response_type not in manager_style["response_types"]:
        return Response(
            json.dumps({"error": "Invalid response type for this manager"}, ensure_ascii=False),
            mimetype='application/json',
            status=400
        )

    prompt = f"{manager_style['system_prompt']}\n\nRespond in {response_type} style to: {user_message}"

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": prompt}]
        )
        reply = response.choices[0].message.content
        
        return Response(
            json.dumps({
                "response": reply,
                "style": manager_style["style"],
                "manager": manager,
                "response_type": response_type
            }, ensure_ascii=False),
            mimetype='application/json'
        )
    except Exception as e:
        return Response(
            json.dumps({"error": str(e)}, ensure_ascii=False),
            mimetype='application/json',
            status=500
        )

if __name__ == "__main__":
    app.run(debug=True)
