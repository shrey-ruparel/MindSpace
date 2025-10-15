from transformers import pipeline

class ChatbotService:
    def __init__(self):
        self.chatbot = pipeline("text2text-generation", model="facebook/blenderbot-400M-distill")

    def get_response(self, message):
        # For stress-relief, a simple conversational model is used.
        # Escalation logic can be added here based on keywords or sentiment analysis.
        response = self.chatbot(message, max_new_tokens=50) # Added max_new_tokens for output control
        return response[0]['generated_text']
