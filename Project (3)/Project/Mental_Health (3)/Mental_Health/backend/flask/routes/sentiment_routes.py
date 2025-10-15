from flask import Blueprint, request, jsonify
from services.sentiment import SentimentService

sentiment_bp = Blueprint('sentiment', __name__)
sentiment_service = SentimentService()

@sentiment_bp.route('/', methods=['POST'])
def predict_mood():
    data = request.get_json()
    text = data.get('text')
    if not text:
        return jsonify({"error": "Text is required"}), 400
    
    result = sentiment_service.analyze_mood(text)
    return jsonify(result)
