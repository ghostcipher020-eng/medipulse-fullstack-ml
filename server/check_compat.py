import pandas as pd, joblib
import numpy as np

# Load dataset
df = pd.read_csv(r'C:\Users\ronak\Downloads\human_vital_signs_dataset_2024.csv')

# Load model
model = joblib.load('patient_risk_model.pkl')
print('Model feature names:', model.feature_names_in_)
print('Model classes:', model.classes_)
print()

# Check if model features exist in dataset
model_features = list(model.feature_names_in_)
for f in model_features:
    if f in df.columns:
        print(f'  OK: "{f}" found in dataset')
        print(f'      Range: {df[f].min():.1f} - {df[f].max():.1f}, Mean: {df[f].mean():.1f}')
    else:
        print(f'  MISSING: "{f}" not in dataset')

print()

# Test model on 1000 dataset samples
sample = df[model_features].head(1000)
y_true_str = df['Risk Category'].head(1000)
# Dataset: "High Risk" / "Low Risk" => map to model classes 0 / 1
y_true = y_true_str.map({'High Risk': 0, 'Low Risk': 1})

preds = model.predict(sample)
accuracy = (preds == y_true).mean() * 100
print(f'Model accuracy on 1000 dataset samples: {accuracy:.1f}%')
print()

# Distribution check
print('Dataset Risk Category distribution:')
print(df['Risk Category'].value_counts())
print()
print('HR range in dataset:', df['Heart Rate'].min(), '-', df['Heart Rate'].max())
print('SpO2 range in dataset:', df['Oxygen Saturation'].min(), '-', df['Oxygen Saturation'].max())
print()

# Show 5 sample predictions vs actual
print('Sample predictions (HR, SpO2 -> Model -> Actual):')
sample_rows = df[model_features + ['Risk Category']].sample(5, random_state=42)
for _, row in sample_rows.iterrows():
    inp = pd.DataFrame([[row['Heart Rate'], row['Oxygen Saturation']]], columns=model_features)
    pred = int(model.predict(inp)[0])
    prob = model.predict_proba(inp)[0]
    label = 'Low Risk' if pred == 1 else 'High Risk'
    conf = round(float(prob[pred]) * 100)
    print(f'  HR={row["Heart Rate"]}, SpO2={row["Oxygen Saturation"]:.1f} -> Model: {label} ({conf}%) | Actual: {row["Risk Category"]}')
