// ===== Canvas =====
const timerCanvas = document.getElementById("timerCanvas");
const tctx = timerCanvas.getContext("2d");
const barCanvas = document.getElementById("barChart");
const bctx = barCanvas.getContext("2d");
const pieCanvas = document.getElementById("pieChart");
const pctx = pieCanvas.getContext("2d");

// ===== DOM =====
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const recordBtn = document.getElementById("recordBtn");
const modeSelect = document.getElementById("modeSelect");
const subjectSelect = document.getElementById("subjectSelect");
const newSubjectInput = document.getElementById("newSubjectInput");
const addSubjectBtn = document.getElementById("addSubjectBtn");
const noDataMsg = document.getElementById("noDataMsg");
const tabBtns = document.querySelectorAll(".graph-tabs button");

// ===== 設定 =====
const defaultSubjects = ["数学","国語","英語","理科","社会"];
const settings = JSON.parse(localStorage.getItem("settings")) || {
  mode: "timer",
  subjects: defaultSubjects
};

// ===== 状態 =====
let seconds = 0;
let totalSeconds = 0;
let timerSet = false;
let running = false;
let timerId = null;
let currentRange = "month";

// ===== 教科色 =====
const subjectColors = {};
function getColor(subject, index) {
  if (!subjectColors[subject]) {
    subjectColors[subject] = `hsl(${index * 60 % 360},70%,55%)`;
  }
  return subjectColors[subject];
}

// ===== 教科 =====
function renderSubjects() {
  subjectSelect.innerHTML = "";
  settings.subjects.forEach((s, i) => {
    const o = document.createElement("option");
    o.textContent = s;
    if (i === 0) o.selected = true;
    subjectSelect.appendChild(o);
  });
}
renderSubjects();

addSubjectBtn.onclick = () => {
  const v = newSubjectInput.value.trim();
  if (!v || settings.subjects.includes(v)) return;
  settings.subjects.push(v);
  localStorage.setItem("settings", JSON.stringify(settings));
  renderSubjects();
  subjectSelect.value = v;
  newSubjectInput.value = "";
};

// ===== 記録判定 =====
function hasAnyRecord() {
  const rec = JSON.parse(localStorage.getItem("records")) || {};
  return Object.keys(rec).length > 0;
}

function updateGraphVisibility() {
  const visible = hasAnyRecord();
  barCanvas.style.display = visible ? "block" : "none";
  pieCanvas.style.display = visible ? "block" : "none";
  document.querySelectorAll(".graph-title")
    .forEach(el => el.style.display = visible ? "block" : "none");
  noDataMsg.style.display = visible ? "none" : "block";
}

// ===== グラフ =====
function drawGraphs(range) {
  updateGraphVisibility();
  if (!hasAnyRecord()) return;
  drawBar(range);
  drawPie(range);
}

// ===== データ取得 =====
function getRangeData(range) {
  const rec = JSON.parse(localStorage.getItem("records")) || {};
  const now = new Date();
  const result = {};
  for (const d in rec) {
    const date = new Date(d);
    const diff = (now - date) / (1000 * 60 * 60 * 24);
    if (
      (range === "day" && diff < 1) ||
      (range === "week" && diff < 7) ||
      (range === "month" && date.getMonth() === now.getMonth())
    ) {
      for (const s in rec[d]) {
        result[s] = (result[s] || 0) + rec[d][s];
      }
    }
  }
  return result;
}

// ===== 棒グラフ =====
function drawBar(range) {
  bctx.clearRect(0, 0, barCanvas.width, barCanvas.height);
  const data = getRangeData(range);
  const max = Math.max(...Object.values(data), 1);

  Object.entries(data).forEach(([s, v], i) => {
    const h = (v / max) * (barCanvas.height - 40);
    const x = 20 + i * 60;
    const y = barCanvas.height - h - 25;

    bctx.fillStyle = getColor(s, i);
    bctx.fillRect(x, y, 40, h);

    const hh = Math.floor(v / 60);
    const mm = v % 60;
    bctx.fillStyle = "#000";
    bctx.font = "11px Arial";
    bctx.fillText(`${hh > 0 ? hh + "h" : ""}${mm}m`, x, y - 4);
    bctx.fillText(s, x, barCanvas.height - 8);
  });
}

// ===== 円グラフ =====
function drawPie(range) {
  pctx.clearRect(0, 0, 220, 220);
  const data = getRangeData(range);
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return;

  let angle = -Math.PI / 2;
  Object.entries(data).forEach(([s, v], i) => {
    const slice = (v / total) * Math.PI * 2;
    pctx.fillStyle = getColor(s, i);
    pctx.beginPath();
    pctx.moveTo(110, 110);
    pctx.arc(110, 110, 100, angle, angle + slice);
    pctx.fill();

    const percent = Math.round((v / total) * 100);
    const mid = angle + slice / 2;
    pctx.fillStyle = "#000";
    pctx.font = "12px Arial";
    pctx.fillText(
      `${percent}%`,
      110 + Math.cos(mid) * 60,
      110 + Math.sin(mid) * 60
    );

    angle += slice;
  });
}

// ===== タブ =====
tabBtns.forEach(btn => {
  btn.onclick = () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentRange = btn.dataset.range;
    drawGraphs(currentRange);
  };
});

// ===== 初期化 =====
drawGraphs("month");
