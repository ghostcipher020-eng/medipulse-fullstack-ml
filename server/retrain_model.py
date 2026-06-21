import pandas as pd
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

print("Loading dataset...")
df = pd.read_csv(r'C:\Users\ronak\Downloads\human_vital_signs_dataset_2024.csv')
print(f"Dataset shape: {df.shape}")

# Map Risk Category to 0/1 (same as existing model: 0=High Risk, 1=Low Risk)
df['label'] = df['Risk Category'].map({'High Risk': 0, 'Low Risk': 1})

# Use only the 2 features the app uses
features = ['Heart Rate', 'Oxygen Saturation']
X = df[features]
y = df['label']

print(f"\nClass distribution:")
print(y.value_counts().rename({0: 'High Risk (0)', 1: 'Low Risk (1)'}))

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print(f"\nTrain size: {len(X_train)}, Test size: {len(X_test)}")

# Train XGBoost (same algorithm as original model)
print("\nTraining XGBoost model...")
model = XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.1,
    use_label_encoder=False,
    eval_metric='logloss',
    random_state=42
)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\nAccuracy on test set: {acc*100:.2f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['High Risk (0)', 'Low Risk (1)']))

# Save model
output_path = 'patient_risk_model.pkl'
joblib.dump(model, output_path)
print(f"\nModel saved to: {output_path}")

# Quick sanity checks
print("\nSanity checks:")
tests = [
    (72, 98),
    (95, 95.1),
    (82, 97.4),
    (99, 99.9),
    (60, 95.0),
]
for hr, spo2 in tests:
    inp = pd.DataFrame([[hr, spo2]], columns=features)
    pred = int(model.predict(inp)[0])
    prob = model.predict_proba(inp)[0]
    label = 'Low Risk (1)' if pred == 1 else 'High Risk (0)'
    conf = round(float(prob[pred]) * 100)
    print(f"  HR={hr}, SpO2={spo2} -> {label} ({conf}%)")
