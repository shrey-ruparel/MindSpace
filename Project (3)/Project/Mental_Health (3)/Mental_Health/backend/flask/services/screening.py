class ScreeningService:
    def calculate_phq9(self, answers):
        score = sum(answers)
        severity = ""
        if score >= 20:
            severity = "severe"
        elif score >= 15:
            severity = "moderately severe"
        elif score >= 10:
            severity = "moderate"
        elif score >= 5:
            severity = "mild"
        else:
            severity = "minimal"
        return {"score": score, "severity": severity}

    def calculate_gad7(self, answers):
        score = sum(answers)
        severity = ""
        if score >= 15:
            severity = "severe"
        elif score >= 10:
            severity = "moderate"
        elif score >= 5:
            severity = "mild"
        else:
            severity = "minimal"
        return {"score": score, "severity": severity}
