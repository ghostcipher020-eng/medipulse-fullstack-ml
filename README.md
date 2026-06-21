# MediPulse — Patient Monitoring & Clinical Risk Prediction System

**MediPulse** is a full-stack real-time patient monitoring, IV drip control, and clinical risk prediction system. It features a React-based frontend dashboard (built with Vite) and a Node.js Express backend API integrated with a machine learning model (XGBoost/Scikit-learn) for predicting patient clinical risk levels based on live vital parameters.

---

## 🚀 Key Features

*   **Real-time Patient Monitoring**: Visualizes patient status with dynamic ECG simulation waveforms and pulse-rate trackers.
*   **IV Drip Controller**: Adjust flow rate (mL/hr), view total bag volume vs. remaining volume, stop/start switches, and view real-time Time-to-Empty (ETA) calculations.
*   **Machine Learning Risk Predictor**: Evaluates a patient's vitals (Heart Rate, Respiratory Rate, Body Temperature, SpO2, Systolic/Diastolic BP, Age, Gender, HRV, weight, and height) to predict clinical risk levels using a pre-trained Python machine learning model.
*   **Interactive Wards Overview**: Tracks bed occupancy and critical patient alert distributions across various hospital departments (ICU, General, Emergency, Pediatrics, Cardiology, Orthopedics).
*   **Reports & Analytics**: Status breakdowns and detailed tabular reports by ward.

---

## 📂 Project Structure

```text
├── client/                 # React & Vite frontend application
│   ├── src/
│   │   ├── components/     # UI components (Sidebar, DripControl, etc.)
│   │   ├── pages/          # Pages (Dashboard, PatientDetails, Reports, Alerts)
│   │   ├── App.jsx         # App routing and layout
│   │   └── main.jsx        # App entry point
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite configuration
│
├── server/                 # Express.js REST API backend
│   ├── db.js               # LowDB database adapter
│   ├── index.js            # Express server entry point & API endpoints
│   ├── medipulse.json      # JSON local database (LowDB storage)
│   ├── predict.py          # Python script executing ML predictions
│   ├── patient_risk_model.pkl # Pre-trained ML classifier model
│   └── package.json        # Backend dependencies
│
├── uploads/                # Directory for uploaded resources
└── README.md               # Project documentation
```

---

## 🛠️ Tech Stack

*   **Frontend**: React (v18+), Vite, TailwindCSS (or Vanilla CSS for custom components), React Router DOM (v6+).
*   **Backend**: Node.js, Express, LowDB (JSON-based lightweight database), Nanoid.
*   **Machine Learning (Python)**: Pandas, Joblib, Scikit-learn / XGBoost.

---

## ⚙️ Installation & Setup

### 1. Prerequisites
Ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v16+)
*   [Python 3](https://www.python.org/) (with `pandas` and `joblib` libraries)

### 2. Set Up the Server
Navigate to the `server` directory, install packages, and start the development server:
```bash
cd server
npm install
npm run dev
```
The server will start running at **`http://localhost:3001`**.

Make sure Python dependencies are installed in your environment:
```bash
pip install pandas joblib scikit-learn xgboost
```

### 3. Set Up the Client
Navigate to the `client` directory, install packages, and start the development server:
```bash
cd client
npm install
npm run dev
```
The client will start running at the local development address (typically **`http://localhost:5173`**).

---

## 🧬 Machine Learning Integration

The backend routes requests to a Python subprocess `predict.py` which accepts patient vitals via standard input (`stdin`), computes derived features (Pulse Pressure, BMI, Mean Arterial Pressure), loads the pre-trained `patient_risk_model.pkl`, and returns JSON predictions with classification probabilities.
