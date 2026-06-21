import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import { getDb } from "./db.js";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ── GET all patients ──
app.get("/api/patients", async (req, res) => {
  const db = await getDb();
  res.json([...db.data.patients].reverse());
});

// ── GET single patient ──
app.get("/api/patients/:id", async (req, res) => {
  const db = await getDb();
  const patient = db.data.patients.find(p => p.id === Number(req.params.id));
  if (!patient) return res.status(404).json({ error: "Patient not found" });
  res.json(patient);
});

// ── POST new patient ──
app.post("/api/patients", async (req, res) => {
  const { name, patient_id, bed, phone, ward, status, blood_group, disease,
          drip_type, drip_total_ml, drip_done_ml, drip_rate_ml_per_hr, diagnosis,
          heart_rate, respiratory_rate, body_temperature, spo2, systolic_bp,
          diastolic_bp, age, gender, weight, height, hrv } = req.body;

  if (!name || !patient_id || !bed || !phone)
    return res.status(400).json({ error: "name, patient_id, bed, phone required" });

  const db = await getDb();
  if (db.data.patients.find(p => p.patient_id === patient_id))
    return res.status(409).json({ error: "Patient ID already exists" });

  const newId = (db.data.patients.reduce((m, p) => Math.max(m, p.id), 0)) + 1;
  const patient = {
    id: newId, name, patient_id, bed, phone,
    ward: ward || "General",
    status: status || "stable",
    blood_group: blood_group || "O+",
    disease: disease || "Under observation",
    drip_type: drip_type || "Normal Saline",
    drip_total_ml: Number(drip_total_ml) || 500,
    drip_done_ml: Number(drip_done_ml) || 0,
    drip_rate_ml_per_hr: Number(drip_rate_ml_per_hr) || 60,
    diagnosis: diagnosis || "Under observation",
    added_date: new Date().toISOString().slice(0, 10),
    heart_rate: Number(heart_rate) || 80,
    respiratory_rate: Number(respiratory_rate) || 15,
    body_temperature: Number(body_temperature) || 36.7,
    spo2: Number(spo2) || 98,
    systolic_bp: Number(systolic_bp) || 120,
    diastolic_bp: Number(diastolic_bp) || 80,
    age: Number(age) || 45,
    gender: gender || "Female",
    weight: Number(weight) || 70,
    height: Number(height) || 1.70,
    hrv: Number(hrv) || 0.10,
  };

  db.data.patients.push(patient);
  // Initial drip log entry
  db.data.drip_log.push({
    id: nanoid(8), patient_id: newId,
    recorded_at: new Date().toISOString(),
    ml_done: patient.drip_done_ml,
    drip_rate_ml_per_hr: patient.drip_rate_ml_per_hr,
  });
  await db.write();
  res.status(201).json(patient);
});

// ── PUT update patient ──
app.put("/api/patients/:id", async (req, res) => {
  const db = await getDb();
  const idx = db.data.patients.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Patient not found" });

  const updated = { ...db.data.patients[idx], ...req.body, id: Number(req.params.id) };
  db.data.patients[idx] = updated;

  if (req.body.drip_done_ml !== undefined) {
    db.data.drip_log.push({
      id: nanoid(8), patient_id: updated.id,
      recorded_at: new Date().toISOString(),
      ml_done: Number(req.body.drip_done_ml),
      drip_rate_ml_per_hr: Number(req.body.drip_rate_ml_per_hr ?? updated.drip_rate_ml_per_hr),
    });
  }
  await db.write();
  res.json(updated);
});

// ── DELETE patient ──
app.delete("/api/patients/:id", async (req, res) => {
  const db = await getDb();
  const idx = db.data.patients.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Patient not found" });
  db.data.patients.splice(idx, 1);
  db.data.drip_log = db.data.drip_log.filter(l => l.patient_id !== Number(req.params.id));
  await db.write();
  res.json({ success: true });
});

// ── GET drip log for chart ──
app.get("/api/patients/:id/drip-log", async (req, res) => {
  const db = await getDb();
  const logs = db.data.drip_log
    .filter(l => l.patient_id === Number(req.params.id))
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  res.json(logs);
});

// ── POST drip log entry ──
app.post("/api/patients/:id/drip-log", async (req, res) => {
  const db = await getDb();
  db.data.drip_log.push({
    id: nanoid(8), patient_id: Number(req.params.id),
    recorded_at: new Date().toISOString(),
    ml_done: Number(req.body.ml_done),
    drip_rate_ml_per_hr: Number(req.body.drip_rate_ml_per_hr),
  });
  await db.write();
  res.status(201).json({ success: true });
});

// ── POST run risk prediction (using XGBoost model) ──
app.post("/api/predict", (req, res) => {
  const scriptPath = path.join(__dirname, "predict.py");
  const child = exec(`python "${scriptPath}"`, (err, stdout, stderr) => {
    if (err || (stderr && !stdout)) {
      console.error("Prediction execution error:", err || stderr);
      return res.status(500).json({ error: "Failed to run risk prediction execution" });
    }
    try {
      const result = JSON.parse(stdout);
      if (result.status === "error") {
        return res.status(500).json({ error: result.message });
      }
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: "Failed to parse prediction result JSON" });
    }
  });
  child.stdin.write(JSON.stringify(req.body));
  child.stdin.end();
});

app.listen(PORT, () => console.log(`✅ MediPulse API → http://localhost:${PORT}`));
