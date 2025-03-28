from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Football Manager AI Bot is running!"})

if __name__ == "__main__":
    app.run(debug=True)
