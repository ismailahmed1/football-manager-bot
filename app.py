import os
import openai
from flask import Flask, request, jsonify
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Football Manager AI Bot is running!"})

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")
    manager = data.get("manager", "José Mourinho")  # Default to Mourinho if not specified

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    prompt = f"You are {manager}, one of the greatest football managers. Answer in their tone and style. {user_message}"

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",  # Using gpt-2 which is free
            messages=[{"role": "system", "content": prompt}]
        )
        reply = response.choices[0].message.content
        return jsonify({"response": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
