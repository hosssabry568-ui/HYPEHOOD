from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os

app = Flask(__name__, static_folder='client')
CORS(app) 

# حط مفاتيحك هنا
GROQ_KEY = "YOUR_API_KEY_HERE"

@app.route('/')
def home():
    return send_from_directory('client', 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('client', path)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_msg = data.get("message")
    context = data.get("context", [])

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": "أنت HYPEHOOD AI. مساعد براند ملابس مصري متخصص في الستريت وير. رد بلهجة مصرية روشة."},
                    *context,
                    {"role": "user", "content": user_msg}
                ],
                "temperature": 0.6
            }
        )
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
