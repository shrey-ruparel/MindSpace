from flask import Blueprint, request, jsonify
from services.screening import ScreeningService

screening_bp = Blueprint('screening', __name__)
screening_service = ScreeningService()

@screening_bp.route('/phq9', methods=['POST'])
def phq9_screening():
    data = request.get_json()
    answers = data.get('answers')
    if not answers or not isinstance(answers, list) or len(answers) != 9:
        return jsonify({"error": "9 answers are required"}), 400
    
    result = screening_service.calculate_phq9(answers)
    return jsonify(result)

@screening_bp.route('/gad7', methods=['POST'])
def gad7_screening():
    data = request.get_json()
    answers = data.get('answers')
    if not answers or not isinstance(answers, list) or len(answers) != 7:
        return jsonify({"error": "7 answers are required"}), 400
    
    result = screening_service.calculate_gad7(answers)
    return jsonify(result)
