import sys
import json
import joblib
import pandas as pd
import os

def main():
    try:
        # Read JSON from standard input
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({"status": "error", "message": "No input data provided on stdin"}))
            return

        data = json.loads(input_data)
        
        # Primary features mapping
        hr = float(data.get('heart_rate', 80))
        rr = float(data.get('respiratory_rate', 15))
        temp = float(data.get('body_temperature', 36.7))
        spo2 = float(data.get('spo2', 98))
        sys_bp = float(data.get('systolic_bp', 120))
        dia_bp = float(data.get('diastolic_bp', 80))
        age = float(data.get('age', 45))
        
        gender_str = str(data.get('gender', 'Female')).strip()
        gender_encoded = 0 if gender_str.lower() == 'female' else 1
        
        weight = float(data.get('weight', 70))
        height = float(data.get('height', 1.70))
        hrv = float(data.get('hrv', 0.10))
        
        # Derived features
        pulse_pressure = sys_bp - dia_bp
        bmi = weight / (height ** 2) if height > 0 else 22.0
        mean_arterial_pressure = dia_bp + (pulse_pressure / 3.0)
        
        script_dir = os.path.dirname(os.path.realpath(__file__))
        model_path = os.path.join(script_dir, "patient_risk_model.pkl")
        
        if not os.path.exists(model_path):
            print(json.dumps({"status": "error", "message": f"Model file not found at {model_path}"}))
            return
            
        model = joblib.load(model_path)
        
        # Build features in exact training order
        feature_names = [
            'Heart Rate',
            'Respiratory Rate',
            'Body Temperature',
            'Oxygen Saturation',
            'Systolic Blood Pressure',
            'Diastolic Blood Pressure',
            'Age',
            'Gender_encoded',
            'Weight (kg)',
            'Height (m)',
            'Derived_HRV',
            'Derived_Pulse_Pressure',
            'Derived_BMI',
            'Derived_MAP'
        ]
        
        input_row = [
            hr,
            rr,
            temp,
            spo2,
            sys_bp,
            dia_bp,
            age,
            gender_encoded,
            weight,
            height,
            hrv,
            pulse_pressure,
            bmi,
            mean_arterial_pressure
        ]
        
        df = pd.DataFrame([input_row], columns=feature_names)
        
        pred = int(model.predict(df)[0])
        prob = model.predict_proba(df)[0]
        confidence = float(prob[pred])
        
        print(json.dumps({
            "status": "success",
            "prediction": pred,
            "confidence": confidence,
            "probabilities": [float(x) for x in prob],
            "derived": {
                "pulse_pressure": round(pulse_pressure, 1),
                "bmi": round(bmi, 2),
                "map": round(mean_arterial_pressure, 1)
            }
        }))
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }))

if __name__ == "__main__":
    main()
