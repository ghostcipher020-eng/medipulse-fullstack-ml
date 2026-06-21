import pandas as pd
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

print("Loading dataset...")
df = pd.read_csv(r'C:\Users\ronak\Downloads\human_vital_signs_dataset_2024.csv')
print(f"Dataset shape: {df.shape}")

# Map Risk Category to 0/1 (0=High Risk, 1=Low Risk)
df['label'] = df['Risk Category'].map({'High Risk': 0, 'Low Risk': 1})

# Map Gender to binary
df['Gender_encoded'] = df['Gender'].map({'Female': 0, 'Male': 1})

features = [
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

X = df[features]
y = df['label']

print(f"\nClass distribution:")
print(y.value_counts().rename({0: 'High Risk (0)', 1: 'Low Risk (1)'}))

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print(f"\nTrain size: {len(X_train)}, Test size: {len(X_test)}")

# Train XGBoost
print("\nTraining XGBoost model on all 14 features...")
model = XGBClassifier(
    n_estimators=100,
    max_depth=6,
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

# Save the feature list metadata for reference
joblib.dump(features, 'feature_names.pkl')
print("Features metadata saved to: feature_names.pkl")
