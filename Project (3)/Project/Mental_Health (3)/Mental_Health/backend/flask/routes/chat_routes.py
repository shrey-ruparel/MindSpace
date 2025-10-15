from flask import Blueprint, request, jsonify
from services.chatbot import ChatbotService

chat_bp = Blueprint('chat', __name__)
chatbot_service = ChatbotService()

@chat_bp.route('/', methods=['POST'])
def chat_ai():
    data = request.get_json()
    message = data.get('message')
    if not message:
        return jsonify({"error": "Message is required"}), 400
    
    response = chatbot_service.get_response(message)
    return jsonify({"response": response})
