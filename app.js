// ── Sample Data ──
let patients = [
  { id: 1, name: "Riya Sharma",   patientId: "MP-1001", bed: "ICU-01",  phone: "+91 98765 43210", ward: "ICU",          status: "critical",   diagnosis: "Post-op cardiac surgery monitoring", added: "2026-05-13" },
  { id: 2, name: "Arjun Mehta",   patientId: "MP-1002", bed: "GEN-05",  phone: "+91 91234 56789", ward: "General",      status: "stable",     diagnosis: "Viral fever, dehydration",           added: "2026-05-12" },
  { id: 3, name: "Sunita Verma",  patientId: "MP-1003", bed: "PED-02",  phone: "+91 70000 11223", ward: "Pediatrics",   status: "recovering", diagnosis: "Post appendectomy recovery",          added: "2026-05-11" },
  { id: 4, name: "Rahul Nair",    patientId: "MP-1004", bed: "EMR-03",  phone: "+91 88888 77654", ward: "Emergency",    status: "critical",   diagnosis: "Road accident, multiple fractures",   added: "2026-05-13" },
  { id: 5, name: "Priya Kapoor",  patientId: "MP-1005", bed: "CARD-01", phone: "+91 99001 23456", ward: "Cardiology",   status: "stable",     diagnosis: "Arrhythmia monitoring",              added: "2026-05-10" },
  { id: 6, name: "Deepak Singh",  patientId: "MP-1006", bed: "ORT-04",  phone: "+91 77777 88990", ward: "Orthopedics",  status: "recovering", diagnosis: "Hip replacement, physiotherapy",      added: "2026-05-09" },
  { id: 7, name: "Kavya Iyer",    patientId: "MP-1007", bed: "GEN-08",  phone: "+91 63456 78901", ward: "General",      status: "discharged", diagnosis: "Mild asthma attack, resolved",       added: "2026-05-08" },
  { id: 8, name: "Mohammed Ali",  patientId: "MP-1008", bed: "ICU-03",  phone: "+91 85432 10987", ward: "ICU",          status: "critical",   diagnosis: "Respiratory failure, ventilator",    added: "2026-05-13" },
  { id: 9, name: "Anjali Patel",  patientId: "MP-1009", bed: "GEN-11",  phone: "+91 94321 09876", ward: "General",      status: "stable",     diagnosis: "Diabetes management",                added: "2026-05-11" },
];
let nextId = 10;
let currentFilter = "all";
let currentView = "grid";
let currentPage = "dashboard";

// ── Avatar ──
const avatarColors = [
  ["#00d4ff","#0a3040"],["#7b61ff","#1a1040"],["#ff4d6d","#3a0010"],
  ["#00e5a0","#00301a"],["#ffb020","#302000"],["#ff6b6b","#400000"],
  ["#4ecdc4","#002d2a"],["#a8edea","#002222"]
];
function getAvatarColor(i){ return avatarColors[i % avatarColors.length]; }
function getInitials(name){ return name.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase(); }

// ── Live Time ──
function updateTime(){
  const el = document.getElementById("liveTime");
  if(el) el.textContent = new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
}
setInterval(updateTime,1000); updateTime();

// ── Navigation ──
function navigate(page){
  currentPage = page;
  // Update sidebar active state
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  const navEl = document.getElementById("nav-" + page);
  if(navEl) navEl.classList.add("active");
  // Hide all views
  document.querySelectorAll(".view-section").forEach(v => v.style.display = "none");
  // Show target view
  const target = document.getElementById("view-" + page);
  if(target) target.style.display = "block";
  // Update page title
  const titles = { dashboard:"Patient Monitor", patients:"All Patients", wards:"Ward Overview", reports:"Reports", alerts:"Alerts" };
  const h1 = document.querySelector(".page-title h1");
  if(h1) h1.textContent = titles[page] || "MediPulse";
  // Render view-specific content
  if(page === "dashboard" || page === "patients"){ currentFilter = "all"; resetFilterBtns(); applyFilters(); }
  if(page === "wards") renderWards();
  if(page === "reports") renderReports();
  if(page === "alerts") renderAlerts();
  // Close sidebar on mobile
  document.getElementById("sidebar").classList.remove("open");
}

function resetFilterBtns(){
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  const allBtn = document.querySelector(".filter-btn[data-filter='all']");
  if(allBtn) allBtn.classList.add("active");
}

// Wire nav items
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault();
    const page = item.id.replace("nav-","");
    navigate(page);
  });
});

// ── Stats ──
function updateStats(){
  document.getElementById("totalCount").textContent = patients.length;
  document.getElementById("criticalCount").textContent = patients.filter(p=>p.status==="critical").length;
  document.getElementById("stableCount").textContent = patients.filter(p=>p.status==="stable").length;
  document.getElementById("bedsCount").textContent = patients.filter(p=>p.status!=="discharged").length;
  // Update alerts badge
  const crit = patients.filter(p=>p.status==="critical").length;
  const badge = document.getElementById("alertsBadge");
  if(badge){ badge.textContent = crit; badge.style.display = crit > 0 ? "inline-block" : "none"; }
}

// ── Build a single patient card element ──
function buildCard(p, i){
  const [fg,bg] = getAvatarColor(p.id);
  const card = document.createElement("div");
  card.className = `patient-card ${p.status}`;
  card.style.animationDelay = `${i*0.05}s`;
  card.innerHTML = `
    <div class="card-top">
      <div class="patient-avatar" style="background:${bg};color:${fg};">
        ${getInitials(p.name)}<div class="pulse-ring" style="color:${fg};"></div>
      </div>
      <span class="status-badge status-${p.status}"><span class="status-dot"></span>${p.status}</span>
    </div>
    <div class="patient-name">${p.name}</div>
    <div class="patient-diagnosis">${p.diagnosis}</div>
    <div class="card-info">
      <div class="info-item"><span class="info-label">Patient ID</span><span class="info-value">${p.patientId}</span></div>
      <div class="info-item"><span class="info-label">Bed No.</span><span class="info-value">${p.bed}</span></div>
      <div class="info-item"><span class="info-label">Phone</span><span class="info-value">${p.phone}</span></div>
      <div class="info-item"><span class="info-label">Admitted</span><span class="info-value">${p.added}</span></div>
    </div>
    <div class="card-footer">
      <div class="card-ward">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        ${p.ward}
      </div>
      <div class="card-actions">
        <button class="card-action-btn" title="View details" onclick="openDetail(${p.id});event.stopPropagation();">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button class="card-action-btn danger" title="Remove patient" onclick="removePatient(${p.id});event.stopPropagation();">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>`;
  card.addEventListener("click", () => openDetail(p.id));
  return card;
}

// ── Render Patient Cards (writes to whichever grid is visible) ──
function renderCards(list){
  // Dashboard grid
  const grid  = document.getElementById("patientsGrid");
  const empty = document.getElementById("emptyState");
  // Patients tab grid
  const grid2  = document.getElementById("patientsGrid2");
  const empty2 = document.getElementById("emptyState2");

  // Clear both
  grid.innerHTML = ""; grid2.innerHTML = "";

  if(list.length === 0){
    empty.style.display  = "flex";
    empty2.style.display = "flex";
    return;
  }
  empty.style.display  = "none";
  empty2.style.display = "none";

  list.forEach((p,i) => {
    grid.appendChild(buildCard(p, i));
    grid2.appendChild(buildCard(p, i));
  });
}

// ── Filter & Search ──
function applyFilters(){
  const q = (document.getElementById("searchInput").value || "").toLowerCase().trim();
  let list = patients;
  if(currentFilter !== "all") list = list.filter(p => p.status === currentFilter);
  if(q) list = list.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.patientId.toLowerCase().includes(q) ||
    p.bed.toLowerCase().includes(q) ||
    p.phone.includes(q) ||
    p.ward.toLowerCase().includes(q)
  );
  renderCards(list);
  updateStats();
}

document.getElementById("searchInput").addEventListener("input", applyFilters);
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    applyFilters();
  });
});

// ── View Toggle ──
document.getElementById("gridView").addEventListener("click", () => {
  currentView = "grid";
  document.getElementById("patientsGrid").classList.remove("list-view");
  document.getElementById("gridView").classList.add("active");
  document.getElementById("listView").classList.remove("active");
});
document.getElementById("listView").addEventListener("click", () => {
  currentView = "list";
  document.getElementById("patientsGrid").classList.add("list-view");
  document.getElementById("listView").classList.add("active");
  document.getElementById("gridView").classList.remove("active");
});
// Patients tab view toggle
document.getElementById("gridView2").addEventListener("click", () => {
  document.getElementById("patientsGrid2").classList.remove("list-view");
  document.getElementById("gridView2").classList.add("active");
  document.getElementById("listView2").classList.remove("active");
});
document.getElementById("listView2").addEventListener("click", () => {
  document.getElementById("patientsGrid2").classList.add("list-view");
  document.getElementById("listView2").classList.add("active");
  document.getElementById("gridView2").classList.remove("active");
});

// ── Add Patient Modal ──
const modalOverlay = document.getElementById("modalOverlay");
document.getElementById("addPatientBtn").addEventListener("click", () => modalOverlay.classList.add("open"));
document.getElementById("cancelBtn").addEventListener("click", () => modalOverlay.classList.remove("open"));
document.getElementById("modalClose").addEventListener("click", () => modalOverlay.classList.remove("open"));
modalOverlay.addEventListener("click", e => { if(e.target===modalOverlay) modalOverlay.classList.remove("open"); });

document.getElementById("addPatientForm").addEventListener("submit", e => {
  e.preventDefault();
  const name      = document.getElementById("patientName").value.trim();
  const patientId = document.getElementById("patientId").value.trim();
  const bed       = document.getElementById("bedNo").value.trim();
  const phone     = document.getElementById("phoneNo").value.trim();
  const ward      = document.getElementById("ward").value;
  const status    = document.getElementById("status").value;
  const diagnosis = document.getElementById("diagnosis").value.trim() || "Under observation";
  if(!name||!patientId||!bed||!phone){ alert("Please fill in all required fields."); return; }
  patients.unshift({ id: nextId++, name, patientId, bed, phone, ward, status, diagnosis, added: new Date().toISOString().slice(0,10) });
  document.getElementById("addPatientForm").reset();
  modalOverlay.classList.remove("open");
  // Switch to show the new patient
  if(currentPage !== "dashboard" && currentPage !== "patients") navigate("dashboard");
  else { currentFilter = "all"; resetFilterBtns(); applyFilters(); }
  showToast(`Patient ${name} added successfully!`);
});

// ── Detail Modal + ECG + Drip ──
const detailOverlay = document.getElementById("detailOverlay");
let ecgAnimId = null;        // stores requestAnimationFrame ID
let dripInterval = null;     // countdown interval for drip ETA

function stopVitals(){
  if(ecgAnimId){ cancelAnimationFrame(ecgAnimId); ecgAnimId = null; }
  if(dripInterval){ clearInterval(dripInterval); dripInterval = null; }
}

document.getElementById("detailClose").addEventListener("click", () => {
  stopVitals();
  detailOverlay.classList.remove("open");
});
detailOverlay.addEventListener("click", e => {
  if(e.target === detailOverlay){ stopVitals(); detailOverlay.classList.remove("open"); }
});

function openDetail(id){
  const p = patients.find(x=>x.id===id);
  if(!p) return;
  stopVitals();
  const [fg,bg] = getAvatarColor(p.id);
  document.getElementById("detailTitle").textContent = "Patient Details";
  document.getElementById("detailContent").innerHTML = `
    <div class="detail-avatar-row">
      <div class="detail-avatar" style="background:${bg};color:${fg};">${getInitials(p.name)}</div>
      <div>
        <div class="detail-name">${p.name}</div>
        <span class="status-badge status-${p.status}" style="display:inline-flex;margin-top:6px;">
          <span class="status-dot"></span>${p.status}
        </span>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-field"><div class="detail-field-label">Patient ID</div><div class="detail-field-value">${p.patientId}</div></div>
      <div class="detail-field"><div class="detail-field-label">Bed Number</div><div class="detail-field-value">${p.bed}</div></div>
      <div class="detail-field"><div class="detail-field-label">Phone</div><div class="detail-field-value">${p.phone}</div></div>
      <div class="detail-field"><div class="detail-field-label">Ward</div><div class="detail-field-value">${p.ward}</div></div>
      <div class="detail-field" style="grid-column:1/-1"><div class="detail-field-label">Diagnosis / Notes</div><div class="detail-field-value">${p.diagnosis}</div></div>
      <div class="detail-field"><div class="detail-field-label">Admission Date</div><div class="detail-field-value">${p.added}</div></div>
      <div class="detail-field"><div class="detail-field-label">Status</div><div class="detail-field-value" style="text-transform:capitalize">${p.status}</div></div>
    </div>`;

  // Show the vitals + drip panel
  const panel = document.getElementById("vitalsDripPanel");
  panel.style.display = "block";

  // Seed per-patient drip values
  const dripBase = { remaining: 250 + (p.id * 37) % 251, rate: 40 + (p.id * 13) % 121 };
  let remaining = dripBase.remaining;
  const rateSlider = document.getElementById("dripRateSlider");
  const rateVal    = document.getElementById("dripRateVal");
  const dripRem    = document.getElementById("dripRemaining");
  const dripEta    = document.getElementById("dripEta");
  const dripStat   = document.getElementById("dripStatus");
  const dripStop   = document.getElementById("dripStopCheck");

  // Reset drip stop
  dripStop.checked = false;
  document.getElementById("dripVolume").textContent = "500 mL";
  rateSlider.value = dripBase.rate;
  rateVal.textContent = dripBase.rate;

  function calcEta(rem, rate){
    if(rate === 0 || dripStop.checked) return "∞";
    const hrs = rem / rate;
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    return `${h}h ${m}m`;
  }
  function refreshDrip(){
    dripRem.textContent  = `${Math.max(0,Math.round(remaining))} mL`;
    dripEta.textContent  = calcEta(remaining, Number(rateSlider.value));
    const stopped = dripStop.checked;
    dripStat.textContent = stopped ? "🔴 Stopped" : remaining <= 0 ? "⚠️ Empty" : "🟢 Running";
    dripStat.style.color = stopped ? "var(--critical)" : remaining <= 0 ? "var(--recovering)" : "var(--stable)";
  }
  refreshDrip();

  // Drip countdown every second
  dripInterval = setInterval(() => {
    if(!dripStop.checked && remaining > 0){
      remaining -= Number(rateSlider.value) / 3600;
      if(remaining < 0) remaining = 0;
    }
    refreshDrip();
  }, 1000);

  // Slider interaction
  rateSlider.oninput = () => { rateVal.textContent = rateSlider.value; refreshDrip(); };

  // Toggle drip stop
  dripStop.onchange = () => refreshDrip();

  // ── ECG Canvas Animation ──
  const bpmBase = p.status === "critical" ? 110 + (p.id*7)%30
                : p.status === "stable"   ? 68  + (p.id*3)%15
                : p.status === "recovering" ? 85 + (p.id*5)%20
                : 72;
  let bpm = bpmBase;
  document.getElementById("bpmDisplay").textContent = `${bpm} BPM`;

  const canvas = document.getElementById("ecgCanvas");
  const ctx    = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  let xPos = 0;
  let phase = 0;
  const beatInterval = 60 / bpm; // seconds per beat
  let lastTime = null;
  let timeSinceBeat = 0;

  // ECG waveform shape (normalised 0..1 time within one beat)
  function ecgY(t){
    if(t < 0.1)  return 0;
    if(t < 0.15) return -0.15 * Math.sin((t-0.1)/0.05 * Math.PI);
    if(t < 0.2)  return 0;
    if(t < 0.22) return -1.0;   // Q dip
    if(t < 0.25) return  1.0;   // R spike
    if(t < 0.27) return -0.5;   // S dip
    if(t < 0.35) return  0;
    if(t < 0.55) return  0.25 * Math.sin((t-0.35)/0.2 * Math.PI); // T wave
    return 0;
  }

  const lineColor  = p.status === "critical" ? "#ff4d6d" : p.status === "stable" ? "#00e5a0" : "#ffb020";
  const glowColor  = lineColor;
  const pixPerSec  = W / 3; // 3 seconds visible

  function drawECG(ts){
    if(!lastTime) lastTime = ts;
    const dt = (ts - lastTime) / 1000;
    lastTime = ts;
    timeSinceBeat += dt;
    if(timeSinceBeat >= beatInterval){
      timeSinceBeat -= beatInterval;
      // Slight BPM jitter for realism
      bpm = bpmBase + Math.round((Math.random()-0.5)*4);
      document.getElementById("bpmDisplay").textContent = `${bpm} BPM`;
    }

    const scrollPx = pixPerSec * dt;

    // Scroll existing canvas left
    const imgData = ctx.getImageData(scrollPx, 0, W - scrollPx, H);
    ctx.clearRect(0, 0, W, H);
    ctx.putImageData(imgData, 0, 0);

    // Draw new strip on the right
    const stripW = Math.ceil(scrollPx) + 2;
    ctx.clearRect(W - stripW, 0, stripW, H);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for(let gy = 0; gy < H; gy += 20){
      ctx.beginPath(); ctx.moveTo(W-stripW, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // ECG line for this time strip
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    const steps = Math.max(4, Math.round(stripW));
    for(let s = 0; s <= steps; s++){
      const fracTime = timeSinceBeat - dt + (s / steps) * dt;
      const t = ((fracTime % beatInterval) + beatInterval) % beatInterval / beatInterval;
      const y = H/2 - ecgY(t) * (H/2 - 6);
      const x = W - stripW + (s/steps)*stripW;
      if(s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    ecgAnimId = requestAnimationFrame(drawECG);
  }
  ecgAnimId = requestAnimationFrame(drawECG);

  detailOverlay.classList.add("open");
}

// ── Remove Patient ──
function removePatient(id){
  const p = patients.find(x=>x.id===id);
  if(!confirm(`Remove ${p ? p.name : "this patient"} from the board?`)) return;
  patients = patients.filter(p=>p.id!==id);
  applyFilters();
  if(currentPage==="alerts") renderAlerts();
  if(currentPage==="wards") renderWards();
  showToast("Patient removed.");
}

// ── Wards View ──
function renderWards(){
  const wardDefs = [
    { name:"ICU",         icon:"🏥", capacity:10, color:"#ff4d6d" },
    { name:"General",     icon:"🛏️", capacity:30, color:"#00e5a0" },
    { name:"Emergency",   icon:"🚨", capacity:8,  color:"#ffb020" },
    { name:"Pediatrics",  icon:"👶", capacity:12, color:"#7b61ff" },
    { name:"Cardiology",  icon:"❤️", capacity:15, color:"#00d4ff" },
    { name:"Orthopedics", icon:"🦴", capacity:20, color:"#a8edea" },
  ];
  const container = document.getElementById("wardsGrid");
  container.innerHTML = "";
  wardDefs.forEach(wd => {
    const inWard  = patients.filter(p=>p.ward===wd.name && p.status!=="discharged");
    const critCount = inWard.filter(p=>p.status==="critical").length;
    const pct = Math.round((inWard.length / wd.capacity)*100);
    const pctSafe = Math.min(pct,100);
    const card = document.createElement("div");
    card.className = "ward-card";
    card.innerHTML = `
      <div class="ward-card-header">
        <span class="ward-icon">${wd.icon}</span>
        <div>
          <div class="ward-name">${wd.name}</div>
          <div class="ward-sub">${inWard.length} / ${wd.capacity} beds occupied</div>
        </div>
        ${critCount>0 ? `<span class="ward-crit-badge">${critCount} critical</span>` : ""}
      </div>
      <div class="ward-progress-bar">
        <div class="ward-progress-fill" style="width:${pctSafe}%;background:${pct>=80?"#ff4d6d":pct>=50?"#ffb020":wd.color};"></div>
      </div>
      <div class="ward-pct">${pct}% full</div>
      <div class="ward-patients">
        ${inWard.length===0 ? '<span style="color:var(--text-dim);font-size:0.82rem;">No active patients</span>' :
          inWard.map(p=>`
            <div class="ward-patient-row" onclick="openDetail(${p.id})">
              <span class="ward-patient-name">${p.name}</span>
              <span class="status-badge status-${p.status}" style="font-size:0.68rem;padding:2px 8px;">
                <span class="status-dot"></span>${p.status}
              </span>
            </div>`).join("")}
      </div>`;
    container.appendChild(card);
  });
}

// ── Reports View ──
function renderReports(){
  const total     = patients.length;
  const critical  = patients.filter(p=>p.status==="critical").length;
  const stable    = patients.filter(p=>p.status==="stable").length;
  const recovering= patients.filter(p=>p.status==="recovering").length;
  const discharged= patients.filter(p=>p.status==="discharged").length;

  // Status breakdown bars
  const breakdown = [
    { label:"Critical",   count:critical,   color:"#ff4d6d" },
    { label:"Stable",     count:stable,     color:"#00e5a0" },
    { label:"Recovering", count:recovering, color:"#ffb020" },
    { label:"Discharged", count:discharged, color:"#7a8099" },
  ];
  document.getElementById("reportStatusBars").innerHTML = breakdown.map(b=>`
    <div class="report-bar-row">
      <span class="report-bar-label">${b.label}</span>
      <div class="report-bar-track">
        <div class="report-bar-fill" style="width:${total?Math.round((b.count/total)*100):0}%;background:${b.color};"></div>
      </div>
      <span class="report-bar-count">${b.count}</span>
    </div>`).join("");

  // Ward breakdown table
  const wards = [...new Set(patients.map(p=>p.ward))].sort();
  document.getElementById("reportWardTable").innerHTML = `
    <table class="report-table">
      <thead><tr><th>Ward</th><th>Total</th><th>Critical</th><th>Stable</th><th>Recovering</th><th>Discharged</th></tr></thead>
      <tbody>${wards.map(w=>{
        const wp = patients.filter(p=>p.ward===w);
        return `<tr>
          <td><strong>${w}</strong></td>
          <td>${wp.length}</td>
          <td style="color:#ff4d6d">${wp.filter(p=>p.status==="critical").length}</td>
          <td style="color:#00e5a0">${wp.filter(p=>p.status==="stable").length}</td>
          <td style="color:#ffb020">${wp.filter(p=>p.status==="recovering").length}</td>
          <td style="color:#7a8099">${wp.filter(p=>p.status==="discharged").length}</td>
        </tr>`;}).join("")}
      </tbody>
    </table>`;

  // Summary numbers
  document.getElementById("repTotal").textContent    = total;
  document.getElementById("repCritical").textContent = critical;
  document.getElementById("repStable").textContent   = stable;
  document.getElementById("repDisch").textContent    = discharged;
}

// ── Alerts View ──
function renderAlerts(){
  const criticalPatients  = patients.filter(p=>p.status==="critical");
  const recoveringPatients= patients.filter(p=>p.status==="recovering");
  const container = document.getElementById("alertsList");
  if(criticalPatients.length===0 && recoveringPatients.length===0){
    container.innerHTML = `<div class="alerts-empty"><span style="font-size:2rem;">✅</span><p>No active alerts — all patients are stable.</p></div>`;
    return;
  }
  container.innerHTML = [
    ...criticalPatients.map(p=>`
      <div class="alert-item critical-alert" onclick="openDetail(${p.id})">
        <div class="alert-dot critical-dot"></div>
        <div class="alert-info">
          <div class="alert-name">${p.name} <span class="alert-id">${p.patientId}</span></div>
          <div class="alert-desc">🚨 <strong>Critical:</strong> ${p.diagnosis}</div>
          <div class="alert-meta">${p.ward} · Bed ${p.bed}</div>
        </div>
        <button class="card-action-btn" onclick="openDetail(${p.id});event.stopPropagation();" title="View">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
      </div>`),
    ...recoveringPatients.map(p=>`
      <div class="alert-item recovering-alert" onclick="openDetail(${p.id})">
        <div class="alert-dot recovering-dot"></div>
        <div class="alert-info">
          <div class="alert-name">${p.name} <span class="alert-id">${p.patientId}</span></div>
          <div class="alert-desc">⚠️ <strong>Recovering:</strong> ${p.diagnosis}</div>
          <div class="alert-meta">${p.ward} · Bed ${p.bed}</div>
        </div>
        <button class="card-action-btn" onclick="openDetail(${p.id});event.stopPropagation();" title="View">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
      </div>`)
  ].join("");
}

// ── Toast ──
function showToast(msg){
  let t = document.getElementById("toast");
  if(!t){ t=document.createElement("div"); t.id="toast"; t.className="toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 2800);
}

// ── Sidebar Toggle (mobile) ──
document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// ── Init ──
navigate("dashboard");
