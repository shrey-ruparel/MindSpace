from flask import Flask, request, jsonify
from routes.chat_routes import chat_bp
from routes.sentiment_routes import sentiment_bp
from routes.screening_routes import screening_bp

app = Flask(__name__)

app.register_blueprint(chat_bp, url_prefix='/chat_ai')
app.register_blueprint(sentiment_bp, url_prefix='/predict_mood')
app.register_blueprint(screening_bp, url_prefix='/screening')

@app.route('/')
def health_check():
    return jsonify({"status": "Flask AI service is running"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
