from transformers import pipeline

class SentimentService:
    def __init__(self):
        self.sentiment_analyzer = pipeline("sentiment-analysis")

    def analyze_mood(self, text):
        result = self.sentiment_analyzer(text)[0]
        return {"mood": result['label'], "score": result['score']}
