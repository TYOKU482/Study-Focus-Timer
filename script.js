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

// modal
const timeModal = document.getElementById("timeModal");
const hourInput = document.getElementById("hourInput");
const minuteInput = document.getElementById("minuteInput");
const cancelTimeBtn = document.getElementById("cancelTimeBtn");
const setTimeBtn = document.getElementById("setTimeBtn");

// ===== 設定 =====
const defaultSubjects = ["数学","国語","英語","理科","社会"];
const settings = JSON.parse(localStorage.getItem("settings")) || {
  mode: "timer",
  subjects: defaultSubjects
};

// ===== 状態 =====
let seconds = 0;
let totalSeconds = 0;
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

// ===== タイマー描画 =====
function drawTimer() {
  tctx.clearRect(0, 0, 260, 260);

  const cx = 130;
  const cy = 130;
  const r = 110;

  // 背景円
  tctx.lineWidth = 10;
  tctx.strokeStyle = "#ddd";
  tctx.beginPath();
  tctx.arc(cx, cy, r, 0, Math.PI * 2);
  tctx.stroke();

  // 進捗円（タイマーのみ）
  if (settings.mode === "timer" && totalSeconds > 0) {
    const ratio = seconds / totalSeconds;
    tctx.strokeStyle = "#4285f4";
    tctx.beginPath();
    tctx.arc(
      cx,
      cy,
      r,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * ratio
    );
    tctx.stroke();
  }

  // 時間表示
  const s = Math.max(seconds, 0);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");

  tctx.fillStyle = "#000";
  tctx.font = "32px Arial";
  tctx.textAlign = "center";
  tctx.textBaseline = "middle";
  tctx.fillText(`${mm}:${ss}`, cx, cy);
}

// ===== タイマー制御 =====
function startTimer() {
  if (running) return;

  // ★ 正しいモード判定
  if (settings.mode === "timer" && totalSeconds === 0) {
    timeModal.style.display = "flex";
    return;
  }

  running = true;
  timerId = setInterval(() => {
    seconds += settings.mode === "timer" ? -1 : 1;

    if (settings.mode === "timer" && seconds <= 0) {
      seconds = 0;
      stopTimer();
    }
    drawTimer();
  }, 1000);

  updateButtons();
}

function stopTimer() {
  running = false;
  clearInterval(timerId);
  updateButtons();
}

function resetTimer() {
  stopTimer();
  seconds = settings.mode === "timer" ? totalSeconds : 0;
  drawTimer();
}

// ===== ボタン表示 =====
function updateButtons() {
  startBtn.style.display = running ? "none" : "inline-block";
  stopBtn.style.display = running ? "inline-block" : "none";
  resetBtn.style.display = running ? "inline-block" : "none";
  recordBtn.style.display = running ? "inline-block" : "none";
}

// ===== 記録保存 =====
function saveRecord() {
  const used = settings.mode === "timer"
    ? totalSeconds - seconds
    : seconds;

  if (used <= 0) return;

  const rec = JSON.parse(localStorage.getItem("records")) || {};
  const today = new Date().toISOString().slice(0, 10);
  const sub = subjectSelect.value;

  if (!rec[today]) rec[today] = {};
  rec[today][sub] = (rec[today][sub] || 0) + Math.floor(used / 60);

  localStorage.setItem("records", JSON.stringify(rec));
  drawGraphs(currentRange);
}

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
      (range === "month" &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear())
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

    bctx.fillStyle = "#000";
    bctx.font = "11px Arial";
    bctx.fillText(`${v}m`, x, y - 4);
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

// ===== モード切替（★重要バグ修正）=====
modeSelect.value = settings.mode;
modeSelect.onchange = () => {
  settings.mode = modeSelect.value;
  localStorage.setItem("settings", JSON.stringify(settings));

  stopTimer();
  totalSeconds = 0;
  seconds = settings.mode === "timer" ? 0 : 0;

  drawTimer();
  updateButtons();
};

// ===== モーダル =====
setTimeBtn.onclick = () => {
  totalSeconds =
    Number(hourInput.value) * 3600 +
    Number(minuteInput.value) * 60;
  seconds = totalSeconds;
  timeModal.style.display = "none";
  drawTimer();
};

cancelTimeBtn.onclick = () => {
  timeModal.style.display = "none";
};

// ===== ボタン =====
startBtn.onclick = startTimer;
stopBtn.onclick = stopTimer;
resetBtn.onclick = resetTimer;
recordBtn.onclick = saveRecord;

// ===== 初期化 =====
drawTimer();
drawGraphs("month");
updateButtons();
