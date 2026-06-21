import { JSONFilePreset } from "lowdb/node";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function makeId() {
  return `MP-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Generate drip log entries for a patient
function generateDripLog(patientDbId, dripDoneMl, ratePerHr) {
  const points = 12;
  const log = [];
  let accumulated = 0;
  for (let i = 0; i < points; i++) {
    const minutesAgo = (points - i) * 20;
    const date = new Date(Date.now() - minutesAgo * 60 * 1000);
    const rateVar = ratePerHr > 0
      ? Math.max(10, ratePerHr + Math.round((Math.random() - 0.5) * ratePerHr * 0.6))
      : 0;
    accumulated += Math.round((rateVar / 60) * 20);
    accumulated = Math.min(accumulated, dripDoneMl);
    log.push({
      id: nanoid(8),
      patient_id: patientDbId,
      recorded_at: date.toISOString(),
      ml_done: accumulated,
      drip_rate_ml_per_hr: rateVar,
    });
  }
  return log;
}

const SEED_PATIENTS = [
  { name: "Riya Sharma",  patient_id: "MP-1001", bed: "ICU-01",  phone: "+91 98765 43210", ward: "ICU",          status: "critical",   blood_group: "B+",  disease: "Acute Myocardial Infarction", drip_type: "Heparin Drip",      drip_total_ml: 500,  drip_done_ml: 310, drip_rate_ml_per_hr: 80,  drip_active: 1, drip_threshold_pct: 80, heart_rate: 115, respiratory_rate: 18, body_temperature: 37.2, spo2: 95.5, systolic_bp: 135, diastolic_bp: 85, age: 62, gender: 'Female', weight: 68, height: 1.62, hrv: 0.08, diagnosis: "Post-op cardiac surgery monitoring", added_date: "2026-05-13" },
  { name: "Arjun Mehta",  patient_id: "MP-1002", bed: "GEN-05",  phone: "+91 91234 56789", ward: "General",      status: "stable",     blood_group: "O+",  disease: "Viral Fever & Dehydration",   drip_type: "Normal Saline",     drip_total_ml: 1000, drip_done_ml: 450, drip_rate_ml_per_hr: 60,  drip_active: 1, drip_threshold_pct: 80, heart_rate: 88,  respiratory_rate: 15, body_temperature: 37.8, spo2: 98.2, systolic_bp: 120, diastolic_bp: 78, age: 34, gender: 'Male', weight: 74, height: 1.78, hrv: 0.11, diagnosis: "Viral fever, dehydration", added_date: "2026-05-12" },
  { name: "Sunita Verma", patient_id: "MP-1003", bed: "PED-02",  phone: "+91 70000 11223", ward: "Pediatrics",  status: "recovering", blood_group: "A-",  disease: "Post Appendectomy",           drip_type: "Ringer's Lactate",  drip_total_ml: 750,  drip_done_ml: 600, drip_rate_ml_per_hr: 45,  drip_active: 1, drip_threshold_pct: 80, heart_rate: 78,  respiratory_rate: 16, body_temperature: 36.6, spo2: 99.1, systolic_bp: 115, diastolic_bp: 74, age: 22, gender: 'Female', weight: 52, height: 1.58, hrv: 0.13, diagnosis: "Post appendectomy recovery", added_date: "2026-05-11" },
  { name: "Rahul Nair",   patient_id: "MP-1004", bed: "EMR-03",  phone: "+91 88888 77654", ward: "Emergency",   status: "critical",   blood_group: "AB+", disease: "Polytrauma — Road Accident",  drip_type: "Blood Transfusion", drip_total_ml: 450,  drip_done_ml: 120, drip_rate_ml_per_hr: 100, drip_active: 1, drip_threshold_pct: 80, heart_rate: 128, respiratory_rate: 19, body_temperature: 36.1, spo2: 94.2, systolic_bp: 112, diastolic_bp: 70, age: 28, gender: 'Male', weight: 82, height: 1.82, hrv: 0.06, diagnosis: "Road accident, multiple fractures", added_date: "2026-05-13" },
  { name: "Priya Kapoor", patient_id: "MP-1005", bed: "CARD-01", phone: "+91 99001 23456", ward: "Cardiology",  status: "stable",     blood_group: "A+",  disease: "Cardiac Arrhythmia",          drip_type: "Amiodarone Drip",   drip_total_ml: 250,  drip_done_ml: 180, drip_rate_ml_per_hr: 30,  drip_active: 1, drip_threshold_pct: 80, heart_rate: 52,  respiratory_rate: 13, body_temperature: 36.8, spo2: 98.8, systolic_bp: 118, diastolic_bp: 76, age: 48, gender: 'Female', weight: 60, height: 1.65, hrv: 0.09, diagnosis: "Arrhythmia monitoring", added_date: "2026-05-10" },
  { name: "Deepak Singh", patient_id: "MP-1006", bed: "ORT-04",  phone: "+91 77777 88990", ward: "Orthopedics", status: "recovering", blood_group: "O-",  disease: "Hip Replacement Surgery",     drip_type: "Dextrose 5%",       drip_total_ml: 500,  drip_done_ml: 420, drip_rate_ml_per_hr: 55,  drip_active: 1, drip_threshold_pct: 80, heart_rate: 72,  respiratory_rate: 14, body_temperature: 36.7, spo2: 98.5, systolic_bp: 122, diastolic_bp: 80, age: 65, gender: 'Male', weight: 78, height: 1.70, hrv: 0.12, diagnosis: "Hip replacement, physiotherapy", added_date: "2026-05-09" },
  { name: "Kavya Iyer",   patient_id: "MP-1007", bed: "GEN-08",  phone: "+91 63456 78901", ward: "General",     status: "discharged", blood_group: "B-",  disease: "Mild Asthma Attack",          drip_type: "None",              drip_total_ml: 250,  drip_done_ml: 250, drip_rate_ml_per_hr: 0,   drip_active: 0, drip_threshold_pct: 80, heart_rate: 68,  respiratory_rate: 14, body_temperature: 36.6, spo2: 99.5, systolic_bp: 116, diastolic_bp: 78, age: 29, gender: 'Female', weight: 55, height: 1.60, hrv: 0.14, diagnosis: "Mild asthma attack, resolved", added_date: "2026-05-08" },
  { name: "Mohammed Ali", patient_id: "MP-1008", bed: "ICU-03",  phone: "+91 85432 10987", ward: "ICU",         status: "critical",   blood_group: "A+",  disease: "Respiratory Failure",         drip_type: "Norepinephrine",    drip_total_ml: 500,  drip_done_ml: 85,  drip_rate_ml_per_hr: 120, drip_active: 1, drip_threshold_pct: 80, heart_rate: 138, respiratory_rate: 19, body_temperature: 37.1, spo2: 92.5, systolic_bp: 130, diastolic_bp: 82, age: 59, gender: 'Male', weight: 85, height: 1.75, hrv: 0.07, diagnosis: "Respiratory failure, ventilator support", added_date: "2026-05-13" },
  { name: "Anjali Patel", patient_id: "MP-1009", bed: "GEN-11",  phone: "+91 94321 09876", ward: "General",     status: "stable",     blood_group: "AB-", disease: "Type 2 Diabetes Mellitus",    drip_type: "Insulin Drip",      drip_total_ml: 500,  drip_done_ml: 300, drip_rate_ml_per_hr: 50,  drip_active: 1, drip_threshold_pct: 80, heart_rate: 82,  respiratory_rate: 15, body_temperature: 36.8, spo2: 97.9, systolic_bp: 124, diastolic_bp: 82, age: 42, gender: 'Female', weight: 70, height: 1.63, hrv: 0.10, diagnosis: "Diabetes management, insulin regulation", added_date: "2026-05-11" },
];

let _db = null;

export async function getDb() {
  if (_db) return _db;
  const dbPath = path.join(__dirname, "medipulse.json");
  _db = await JSONFilePreset(dbPath, { patients: [], drip_log: [] });

  if (_db.data.patients.length === 0) {
    let autoId = 1;
    const patients = SEED_PATIENTS.map(p => ({ ...p, id: autoId++ }));
    const drip_log = [];
    patients.forEach(p => {
      drip_log.push(...generateDripLog(p.id, p.drip_done_ml, p.drip_rate_ml_per_hr));
    });
    _db.data.patients = patients;
    _db.data.drip_log = drip_log;
    await _db.write();
  } else {
    // Migrate: add new fields to existing patients that don't have them
    const defaults = {
      drip_active: 1,
      drip_threshold_pct: 80,
      heart_rate: 80,
      respiratory_rate: 15,
      body_temperature: 36.7,
      spo2: 98,
      systolic_bp: 120,
      diastolic_bp: 80,
      age: 45,
      gender: 'Female',
      weight: 70,
      height: 1.70,
      hrv: 0.10,
    };
    let migrated = false;
    _db.data.patients.forEach(p => {
      Object.entries(defaults).forEach(([k, v]) => {
        if (p[k] === undefined) { p[k] = v; migrated = true; }
      });
    });
    if (migrated) await _db.write();
  }

  return _db;
}
