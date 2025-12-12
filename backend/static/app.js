/****************************************
 * إعدادات وثوابت
 ****************************************/
const API_URL = "https://syntrue-absher.onrender.com/api/events";

const DEFAULT_HOME_ID = "HOME-1234";
const DEFAULT_ABSHER_ID = "1234567890";

// مواقع أجهزة المنزل في الخريطة
const DEVICE_LOCATIONS = {
    door_sensor_1: [24.7136, 46.6753],
    motion_sensor_1: [24.7143, 46.6768],
    camera_front: [24.7129, 46.6742],
    gas_sensor_kitchen: [24.7130, 46.6760],
};

// مركز القيادة + مواقع افتراضية للعسكر
const HQ_COORDS = [24.7138, 46.6758];
const OFFICER_LOCATIONS = {
    officer_riyadh_1: [24.7160, 46.6780],
    officer_riyadh_2: [24.7105, 46.6735],
    officer_riyadh_3: [24.7180, 46.6725],
};

const LEVEL_COLORS = {
    info: "#22c55e",
    warning: "#eab308",
    danger: "#ef4444",
};

const LEVEL_WEIGHTS = {
    info: 0.2,
    warning: 0.6,
    danger: 1.0,
};

let fetchingEnabled = true;
let simulationEnabled = false;

let allEvents = [];
let visibleEventsCache = [];

let lastTotal = 0;
let lastDanger = 0;

let currentLevelFilter = "all";
let currentTimeFilter = "all";
let currentDeviceFilter = "all";
let currentStatusFilter = "open";
let currentViewMode = "owner";

let simulationInterval = null;
let officerViewEnabled = false;

// حالات العسكر الأخيرة (تُحدَّث من updateOfficerCard)
let latestOfficers = {};
let lastOfficerEmergencyCount = 0;
let lastOfficerUnstableCount = 0;

/****************************************
 * عناصر DOM
 ****************************************/
const totalEl = document.getElementById("total-events");
const dangerEl = document.getElementById("danger-count");
const lastEventEl = document.getElementById("last-event");
const riskBarFill = document.getElementById("risk-bar-fill");
const riskLabel = document.getElementById("risk-label");

const levelSelect = document.getElementById("level-filter");
const timeSelect = document.getElementById("time-filter");
const deviceSelect = document.getElementById("device-filter");
const statusSelect = document.getElementById("status-filter");
const viewModeSelect = document.getElementById("view-mode");

const connectionStatus = document.getElementById("connection-status");
const toggleBtn = document.getElementById("toggle-fetch-btn");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const simulationToggleBtn = document.getElementById("simulation-toggle-btn");
const exportExcelBtn = document.getElementById("export-excel-btn");
const goReportsBtn = document.getElementById("go-reports-btn");
const resolveAllBtn = document.getElementById("resolve-all-btn");
const importExcelBtn = document.getElementById("import-excel-btn");
const fileInput = document.getElementById("file-input");

const toastContainer = document.getElementById("toast-container");
const alertSound = document.getElementById("alert-sound");
const offlineBanner = document.getElementById("offline-banner");
const devicesSummaryEl = document.getElementById("devices-summary");

// كرت الدوريات السرية
const officerSummaryText = document.getElementById("officer-summary-text");
const officerSafeEl = document.getElementById("officer-safe-count");
const officerUnstableEl = document.getElementById("officer-unstable-count");
const officerEmergencyEl = document.getElementById("officer-emergency-count");
const officerViewToggleBtn = document.getElementById("officer-view-toggle");

// خرائط
let map = null;
let deviceMarkers = {};
let heatLayer = null;
let heatPoints = [];

let patrolMap = null;
let patrolCarMarker = null;
let patrolDroneMarker = null;
let patrolStep = 0;

let officersMap = null;
let officerMarkers = {};
let officerTrails = {};
let officerLines = {};
let officersHeatLayer = null;
let officersHeatPoints = [];

// Live chart
let liveChart = null;

/****************************************
 * دوال مساعدة للفلاتر
 ****************************************/
function parseEventTime(e) {
    return new Date(e.timestamp);
}

function filterByTime(events) {
    if (currentTimeFilter === "all") return events;
    const mins = parseInt(currentTimeFilter, 10);
    const now = Date.now();
    const threshold = now - mins * 60 * 1000;
    return events.filter(e => parseEventTime(e).getTime() >= threshold);
}

function filterByLevel(events) {
    if (currentLevelFilter === "all") return events;
    return events.filter(e => e.level === currentLevelFilter);
}

function filterByDevice(events) {
    if (currentDeviceFilter === "all") return events;
    return events.filter(e => e.device_id === currentDeviceFilter);
}

function filterByStatus(events) {
    if (currentStatusFilter === "all") return events;
    return events.filter(e => (e.status || "open") === currentStatusFilter);
}

function filterByViewMode(events) {
    if (currentViewMode === "ops") return events; // غرفة عمليات ترى الكل
    return events.filter(e => (e.home_id || DEFAULT_HOME_ID) === DEFAULT_HOME_ID);
}

/****************************************
 * أنيميشن أرقام
 ****************************************/
function animateNumber(el, from, to) {
    if (from === to) {
        el.textContent = to;
        return;
    }
    const duration = 300;
    const start = performance.now();

    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const value = Math.round(from + (to - from) * progress);
        el.textContent = value;
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
    el.classList.remove("number-pulse");
    void el.offsetWidth;
    el.classList.add("number-pulse");
}

/****************************************
 * Toasts
 ****************************************/
function showToast(message, level = "info") {
    const toast = document.createElement("div");
    toast.classList.add("toast");
    if (level === "danger") toast.classList.add("toast-danger");
    else if (level === "warning") toast.classList.add("toast-warning");
    else toast.classList.add("toast-info");

    const msg = document.createElement("p");
    msg.classList.add("toast-message");
    msg.textContent = message;

    const close = document.createElement("span");
    close.classList.add("toast-close");
    close.textContent = "×";
    close.onclick = () => toast.remove();

    toast.appendChild(msg);
    toast.appendChild(close);
    toastContainer.appendChild(toast);

    if (toastContainer.children.length > 10) {
        toastContainer.removeChild(toastContainer.firstChild);
    }

    setTimeout(() => toast.remove(), 6000);
}

/****************************************
 * مؤشر مستوى الخطر العام
 ****************************************/
function updateRiskIndicator(activeEvents) {
    if (activeEvents.length === 0) {
        riskBarFill.style.width = "0%";
        riskLabel.textContent = "لا توجد بلاغات مفتوحة حالياً";
        document.querySelector(".danger-card")?.classList.remove("danger-glow");
        return;
    }

    const dangerCount = activeEvents.filter(e => e.level === "danger").length;
    const ratio = (dangerCount / activeEvents.length) * 100;
    riskBarFill.style.width = `${Math.min(100, ratio)}%`;

    let text = "";
    if (ratio < 10) text = "مستوى الخطر منخفض";
    else if (ratio < 30) text = "مستوى الخطر متوسط";
    else text = "مستوى الخطر مرتفع";

    riskLabel.textContent = text;

    const dangerCard = document.querySelector(".danger-card");
    if (ratio >= 30 && dangerCard) dangerCard.classList.add("danger-glow");
    else if (dangerCard) dangerCard.classList.remove("danger-glow");
}

/****************************************
 * خريطة المنزل + Heatmap
 ****************************************/
let highlightTimeout = null;

function initMap() {
    const center = [24.7136, 46.6753];
    map = L.map("map", { zoomControl: false }).setView(center, 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
    }).addTo(map);

    const homeBounds = [
        [24.7126, 46.6745],
        [24.7146, 46.6765],
    ];
    L.rectangle(homeBounds, {
        color: "#38bdf8",
        weight: 1,
        dashArray: "4 4",
        fillOpacity: 0.03,
    }).addTo(map);

    Object.entries(DEVICE_LOCATIONS).forEach(([id, coords]) => {
        const marker = L.circleMarker(coords, {
            radius: 6,
            color: "#64748b",
            fillColor: "#0ea5e9",
            fillOpacity: 0.9,
        }).addTo(map);
        marker.bindPopup(`<b>${id}</b>`);
        deviceMarkers[id] = marker;
    });

    heatLayer = L.heatLayer([], {
        radius: 35,
        blur: 25,
        maxZoom: 19,
        max: 1.0,
    }).addTo(map);
}

function updateMapForEvent(ev) {
    if (!map) return;
    const coords = DEVICE_LOCATIONS[ev.device_id];
    const marker = deviceMarkers[ev.device_id];
    if (!coords || !marker) return;

    const color = LEVEL_COLORS[ev.level] || LEVEL_COLORS.info;
    const weight = LEVEL_WEIGHTS[ev.level] || LEVEL_WEIGHTS.info;

    map.panTo(coords, { animate: true, duration: 0.6 });
    marker.openPopup();

    marker.setStyle({ color, fillColor: color, radius: 11 });
    clearTimeout(highlightTimeout);
    highlightTimeout = setTimeout(() => {
        marker.setStyle({
            color: "#64748b",
            fillColor: "#0ea5e9",
            radius: 6,
        });
    }, 900);

    heatPoints.push([coords[0], coords[1], weight]);
    if (heatPoints.length > 200) {
        heatPoints = heatPoints.slice(-200);
    }
    heatLayer.setLatLngs(heatPoints);
}

/****************************************
 * خريطة الجولة الأمنية (محاكاة دورية + درون)
 ****************************************/
function initPatrolMap() {
    const center = [24.7136, 46.6753];
    patrolMap = L.map("patrol-map", { zoomControl: false }).setView(center, 14);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
    }).addTo(patrolMap);

    const route = [
        [24.7125, 46.6735],
        [24.7135, 46.6748],
        [24.7143, 46.6760],
        [24.7150, 46.6770],
        [24.7140, 46.6780],
    ];

    L.polyline(route, {
        color: "#38bdf8",
        weight: 3,
        dashArray: "6 6",
    }).addTo(patrolMap);

    patrolCarMarker = L.circleMarker(route[0], {
        radius: 7,
        color: "#0ea5e9",
        fillColor: "#0ea5e9",
        fillOpacity: 0.9,
    }).addTo(patrolMap).bindPopup("🚓 دورية أمنية");

    patrolDroneMarker = L.circleMarker(route[route.length - 1], {
        radius: 6,
        color: "#facc15",
        fillColor: "#facc15",
        fillOpacity: 0.9,
    }).addTo(patrolMap).bindPopup("🛸 درون مراقبة");

    setInterval(() => {
        patrolStep = (patrolStep + 1) % route.length;
        const carPos = route[patrolStep];
        const dronePos = route[(route.length - 1) - patrolStep] || route[0];
        patrolCarMarker.setLatLng(carPos);
        patrolDroneMarker.setLatLng(dronePos);
    }, 2000);
}

/****************************************
 * خريطة الدوريات السرية (العسكر)
 ****************************************/
function initOfficersMap() {
    const center = HQ_COORDS;
    officersMap = L.map("officers-map", { zoomControl: false }).setView(center, 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
    }).addTo(officersMap);

    // مركز القيادة
    L.circleMarker(HQ_COORDS, {
        radius: 8,
        color: "#38bdf8",
        fillColor: "#0ea5e9",
        fillOpacity: 0.9,
    })
        .addTo(officersMap)
        .bindPopup("🏢 مركز القيادة");

    officersHeatLayer = L.heatLayer([], {
        radius: 35,
        blur: 25,
        maxZoom: 19,
        max: 1.0,
    }).addTo(officersMap);
}

function getOfficerCoords(officerId) {
    if (OFFICER_LOCATIONS[officerId]) return OFFICER_LOCATIONS[officerId];
    // fallback: حدد نقطة قريبة من مركز القيادة
    const baseLat = HQ_COORDS[0];
    const baseLng = HQ_COORDS[1];
    const randomLat = baseLat + (Math.random() - 0.5) * 0.01;
    const randomLng = baseLng + (Math.random() - 0.5) * 0.01;
    OFFICER_LOCATIONS[officerId] = [randomLat, randomLng];
    return OFFICER_LOCATIONS[officerId];
}

function updateOfficersMap() {
    if (!officersMap) return;

    officersHeatPoints = [];

    Object.entries(latestOfficers).forEach(([officerId, ev]) => {
        const level = ev.level || "info";
        const color = LEVEL_COLORS[level] || LEVEL_COLORS.info;
        const weight = LEVEL_WEIGHTS[level] || LEVEL_WEIGHTS.info;
        const coords = getOfficerCoords(officerId);

        // marker
        let marker = officerMarkers[officerId];
        if (!marker) {
            marker = L.circleMarker(coords, {
                radius: 7,
                color,
                fillColor: color,
                fillOpacity: 0.9,
            }).addTo(officersMap);
            marker.bindPopup(
                `🎖 ${officerId}<br/>الحالة: ${ev.type}<br/>المستوى: ${ev.level}`
            );
            officerMarkers[officerId] = marker;
        } else {
            marker.setLatLng(coords);
            marker.setStyle({ color, fillColor: color });
            marker.setPopupContent(
                `🎖 ${officerId}<br/>الحالة: ${ev.type}<br/>المستوى: ${ev.level}`
            );
        }

        // trail / مسار الحركة (محاكاة – نكرر نفس النقطة لتكوين خط بسيط)
        if (!officerTrails[officerId]) officerTrails[officerId] = [];
        officerTrails[officerId].push(coords);
        if (officerTrails[officerId].length > 15) {
            officerTrails[officerId] = officerTrails[officerId].slice(-15);
        }

        if (officerLines[officerId]) {
            officersMap.removeLayer(officerLines[officerId]);
        }
        const lineColor =
            level === "danger"
                ? "#ef4444"
                : level === "warning"
                ? "#eab308"
                : "#38bdf8";

        officerLines[officerId] = L.polyline([HQ_COORDS, coords], {
            color: lineColor,
            weight: 2,
            dashArray: "6 4",
        }).addTo(officersMap);

        // Heatmap
        officersHeatPoints.push([coords[0], coords[1], weight]);
    });

    officersHeatLayer.setLatLngs(officersHeatPoints);
}

/****************************************
 * Live Chart
 ****************************************/
function initLiveChart() {
    const ctx = document.getElementById("liveChart").getContext("2d");
    liveChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "إجمالي الأحداث عبر الزمن",
                    data: [],
                    borderColor: "#38bdf8",
                    backgroundColor: "rgba(56,189,248,0.15)",
                    tension: 0.3,
                    fill: true,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: "#e5e7eb" } },
            },
            scales: {
                x: { ticks: { color: "#9ca3af" } },
                y: { ticks: { color: "#9ca3af" }, beginAtZero: true },
            },
        },
    });
}

function updateLiveChart(totalCount) {
    if (!liveChart) return;
    const now = new Date();
    const label = now.toTimeString().slice(0, 8);
    liveChart.data.labels.push(label);
    liveChart.data.datasets[0].data.push(totalCount);

    if (liveChart.data.labels.length > 20) {
        liveChart.data.labels.shift();
        liveChart.data.datasets[0].data.shift();
    }
    liveChart.update("none");
}

/****************************************
 * ملخص الأجهزة + قائمة الجهاز
 ****************************************/
function updateDevicesSummary(events) {
    const counts = {};
    events.forEach(e => {
        counts[e.device_id] = (counts[e.device_id] || 0) + 1;
    });

    const devices = Object.keys(counts);
    const prevSelected = deviceSelect.value;
    deviceSelect.innerHTML = `<option value="all">كل الأجهزة</option>`;
    devices.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = `${d} (${counts[d]} حدث)`;
        deviceSelect.appendChild(opt);
    });
    if (devices.includes(prevSelected)) deviceSelect.value = prevSelected;

    devicesSummaryEl.innerHTML = "";
    if (devices.length === 0) {
        const li = document.createElement("li");
        li.textContent = "لا توجد بيانات أجهزة حتى الآن.";
        devicesSummaryEl.appendChild(li);
        return;
    }

    const sorted = devices
        .map(d => ({ id: d, count: counts[d] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    sorted.forEach(d => {
        const li = document.createElement("li");
        li.textContent = `${d.id} - ${d.count} حدث`;
        devicesSummaryEl.appendChild(li);
    });
}

/****************************************
 * كرت وضع الدوريات السرية (العسكريين)
 ****************************************/
function updateOfficerCard(events) {
    const byOfficer = {};

    events.forEach(ev => {
        if (!ev.device_id || !ev.device_id.startsWith("officer_")) return;

        const key = ev.device_id;
        const existing = byOfficer[key];

        if (!existing || parseEventTime(ev) > parseEventTime(existing)) {
            byOfficer[key] = ev;
        }
    });

    latestOfficers = byOfficer;

    const officers = Object.values(byOfficer);
    const totalOfficers = officers.length;

    if (totalOfficers === 0) {
        officerSummaryText.textContent = "لا توجد بيانات عن الدوريات حتى الآن.";
        officerSafeEl.textContent = "0";
        officerUnstableEl.textContent = "0";
        officerEmergencyEl.textContent = "0";
        document.querySelector(".officer-card")?.classList.remove("alert");
        return;
    }

    let safe = 0,
        unstable = 0,
        emergency = 0;

    officers.forEach(ev => {
        const t = (ev.type || "").toLowerCase();
        if (t.endsWith("safe")) safe++;
        else if (t.endsWith("unstable")) unstable++;
        else if (t.endsWith("emergency")) emergency++;
        else {
            if (ev.level === "info") safe++;
            else if (ev.level === "warning") unstable++;
            else if (ev.level === "danger") emergency++;
        }
    });

    officerSafeEl.textContent = safe;
    officerUnstableEl.textContent = unstable;
    officerEmergencyEl.textContent = emergency;

    officerSummaryText.textContent = `إجمالي الدوريات السرية: ${totalOfficers} عسكري • آمن: ${safe} • غير مستقر: ${unstable} • طارئ: ${emergency}`;

    const card = document.querySelector(".officer-card");
    if (emergency > 0 && card) card.classList.add("alert");
    else if (card) card.classList.remove("alert");

    // منطق اقتراحات ذكية (Group Command / Mission Mode)
    if (emergency > lastOfficerEmergencyCount && emergency >= 2) {
        showToast("توصية: إرسال دعم إضافي لقطاع الدوريات السرية 🔴", "danger");
    } else if (
        emergency === 0 &&
        unstable > lastOfficerUnstableCount &&
        unstable >= 1
    ) {
        showToast(
            "تنبيه: بعض الدوريات في حالة غير مستقرة، يُفضّل المتابعة من غرفة العمليات 🟠",
            "warning"
        );
    }

    lastOfficerEmergencyCount = emergency;
    lastOfficerUnstableCount = unstable;

    // تحديث خريطة العسكر
    updateOfficersMap();
}

/****************************************
 * تحديث الكروت والجدول
 ****************************************/
function updateTopCards(activeEvents, visibleEvents, allEventsFull) {
    animateNumber(totalEl, lastTotal, activeEvents.length);
    lastTotal = activeEvents.length;

    const dangerCount = visibleEvents.filter(
        e => e.level === "danger" && (e.status || "open") === "open"
    ).length;
    animateNumber(dangerEl, lastDanger, dangerCount);
    lastDanger = dangerCount;

    if (allEventsFull.length > 0) {
        const last = allEventsFull[allEventsFull.length - 1];
        lastEventEl.textContent = `${last.timestamp} - ${last.device_id} - ${last.type}`;
    } else {
        lastEventEl.textContent = "لا يوجد بيانات";
    }

    updateLiveChart(allEventsFull.length);
}

function updateTable(events, previousLength) {
    const tbody = document.getElementById("events-table-body");
    tbody.innerHTML = "";

    events
        .slice()
        .reverse()
        .forEach(event => {
            const tr = document.createElement("tr");

            if (event.level === "info") tr.classList.add("level-info");
            else if (event.level === "warning") tr.classList.add("level-warning");
            else if (event.level === "danger") tr.classList.add("level-danger");

            if (event.status === "resolved") tr.classList.add("row-resolved");

            const tdTime = document.createElement("td");
            tdTime.textContent = event.timestamp;

            const tdDevice = document.createElement("td");
            tdDevice.textContent = event.device_id;

            const tdType = document.createElement("td");
            tdType.textContent = event.type;

            const tdLevel = document.createElement("td");
            tdLevel.textContent = event.level;

            const tdStatus = document.createElement("td");
            tdStatus.textContent = event.status || "open";

            tr.appendChild(tdTime);
            tr.appendChild(tdDevice);
            tr.appendChild(tdType);
            tr.appendChild(tdLevel);
            tr.appendChild(tdStatus);

            tbody.appendChild(tr);
        });
}

/****************************************
 * الأحداث الجديدة + ربط البيت مع العسكر
 ****************************************/
function handleNewEvents(previousCount, newEvents) {
    if (newEvents.length <= previousCount) return;
    const justArrived = newEvents.slice(previousCount);

    justArrived.forEach(ev => {
        if (ev.status === "resolved") return;

        const isOfficer = ev.device_id && ev.device_id.startsWith("officer_");

        if (ev.level === "danger") {
            if (isOfficer) {
                showToast(`🚨 حالة طارئة لعسكري: ${ev.device_id} - ${ev.type}`, "danger");
            } else {
                showToast(`🚨 خطر من ${ev.device_id}: ${ev.type}`, "danger");
                // توصية بتوجيه أقرب دورية
                if (Object.keys(latestOfficers).length > 0) {
                    showToast(
                        "توصية: توجيه أقرب دورية للموقع المتأثر بهذا البلاغ.",
                        "warning"
                    );
                }
            }
            if (alertSound) {
                alertSound.currentTime = 0;
                alertSound.play().catch(() => {});
            }
        } else if (ev.level === "warning") {
            if (isOfficer) {
                showToast(
                    `⚠️ وضع غير مستقر لعسكري: ${ev.device_id} - ${ev.type}`,
                    "warning"
                );
            } else {
                showToast(`⚠️ تحذير من ${ev.device_id}: ${ev.type}`, "warning");
            }
        }

        if (!isOfficer) {
            updateMapForEvent(ev);
        }
    });
}

/****************************************
 * تصدير CSV
 ****************************************/
function exportVisibleEventsToExcel() {
    if (!visibleEventsCache || visibleEventsCache.length === 0) {
        alert("لا توجد بيانات لتصديرها.");
        return;
    }

    const header = [
        "timestamp",
        "device_id",
        "type",
        "level",
        "status",
        "home_id",
        "absher_id",
    ];

    const rows = visibleEventsCache.map(e => [
        e.timestamp,
        e.device_id,
        e.type,
        e.level,
        e.status || "open",
        e.home_id || DEFAULT_HOME_ID,
        e.absher_id || DEFAULT_ABSHER_ID,
    ]);

    const escape = v => `"${String(v).replace(/"/g, '""')}"`;

    let csv =
        header.join(";") +
        "\r\n" +
        rows.map(r => r.map(escape).join(";")).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const now = new Date();
    const filename = `events_${now.toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/****************************************
 * استيراد CSV
 ****************************************/
function handleFileImport(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async e => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length <= 1) {
            alert("الملف فارغ أو غير صحيح.");
            return;
        }

        const header = lines[0].split(/[;,]/).map(h => h.trim().toLowerCase());
        const hasHeader = header.includes("timestamp");
        let start = hasHeader ? 1 : 0;

        let imported = 0;

        for (let i = start; i < lines.length; i++) {
            const parts = lines[i].split(/[;,]/).map(p => p.trim());
            if (parts.length < 4) continue;

            const ev = {
                timestamp: parts[0],
                device_id: parts[1],
                type: parts[2],
                level: parts[3],
                home_id: parts[5] || DEFAULT_HOME_ID,
                absher_id: parts[6] || DEFAULT_ABSHER_ID,
            };

            try {
                await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(ev),
                });
                imported++;
            } catch (err) {
                console.error("Error importing row:", err);
            }
        }

        showToast(`تم استيراد ${imported} حدث من CSV ✅`, "info");
        fetchEvents();
    };

    reader.readAsText(file, "utf-8");
}

/****************************************
 * الثيم
 ****************************************/
function applyTheme(theme) {
    if (theme === "light") {
        document.body.classList.add("light-theme");
        themeToggleBtn.textContent = "🌙 الوضع الداكن";
    } else {
        document.body.classList.remove("light-theme");
        themeToggleBtn.textContent = "☀️ الوضع الفاتح";
    }
    localStorage.setItem("dashboardTheme", theme);
}

/****************************************
 * المحاكاة
 ****************************************/
function generateRandomEvent() {
    const devices = Object.keys(DEVICE_LOCATIONS);
    const types = ["door_open", "door_close", "motion_detected", "gas_detected"];

    const device = devices[Math.floor(Math.random() * devices.length)];
    const type = types[Math.floor(Math.random() * types.length)];

    let level = "info";
    if (type === "gas_detected") level = Math.random() < 0.8 ? "danger" : "warning";
    else if (type === "motion_detected") level = Math.random() < 0.6 ? "danger" : "warning";
    else if (type === "door_open") level = Math.random() < 0.4 ? "warning" : "info";

    return {
        device_id: device,
        type,
        level,
        timestamp: new Date().toISOString(),
        home_id: DEFAULT_HOME_ID,
        absher_id: DEFAULT_ABSHER_ID,
    };
}

async function sendSimulatedEvent() {
    const ev = generateRandomEvent();
    try {
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ev),
        });
    } catch (err) {
        console.error("Error sending simulated event:", err);
    }
}

function startSimulation() {
    if (simulationEnabled) return;
    simulationEnabled = true;
    simulationToggleBtn.textContent = "⏹ إيقاف المحاكاة";
    simulationInterval = setInterval(sendSimulatedEvent, 2000);
}

function stopSimulation() {
    simulationEnabled = false;
    simulationToggleBtn.textContent = "▶ تشغيل المحاكاة";
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }
}

/****************************************
 * جلب البيانات (مع Offline Mode + وضع الدوريات)
 ****************************************/
async function fetchEvents() {
    if (!fetchingEnabled) return;

    try {
        const res = await fetch(API_URL);
        const events = await res.json();

        offlineBanner.style.display = "none";
        connectionStatus.innerHTML = `<span class="conn-dot"></span> متصل`;
        connectionStatus.classList.add("conn-online");
        connectionStatus.classList.remove("conn-offline");

        handleNewEvents(allEvents.length, events);
        const previousLength = allEvents.length;
        allEvents = events;

        let viewFiltered = filterByViewMode(allEvents);

        if (officerViewEnabled) {
            viewFiltered = viewFiltered.filter(
                e => e.device_id && e.device_id.startsWith("officer_")
            );
        }

        const activeEvents = viewFiltered.filter(e => (e.status || "open") === "open");

        const timeFiltered = filterByTime(viewFiltered);
        const levelFiltered = filterByLevel(timeFiltered);
        const deviceFiltered = filterByDevice(levelFiltered);
        const statusFiltered = filterByStatus(deviceFiltered);

        visibleEventsCache = statusFiltered;

        updateTopCards(activeEvents, statusFiltered, viewFiltered);
        updateTable(statusFiltered, previousLength);
        updateRiskIndicator(activeEvents);
        updateDevicesSummary(viewFiltered);
        updateOfficerCard(allEvents);
    } catch (err) {
        console.error("Error fetching events:", err);
        offlineBanner.style.display = "block";
        connectionStatus.innerHTML = `<span class="conn-dot"></span> غير متصل`;
        connectionStatus.classList.add("conn-offline");
        connectionStatus.classList.remove("conn-online");
    }
}

/****************************************
 * صفحة تقارير للطباعة
 ****************************************/
function openReportsPage() {
    const win = window.open("", "_blank");
    const events = allEvents.slice().reverse();

    const html = `
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8" />
<title>تقرير الأمان الذكي</title>
<style>
body { font-family: system-ui, sans-serif; padding: 20px; }
h1 { margin-top: 0; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: right; }
th { background: #f3f4f6; }
.meta { margin-bottom: 10px; color: #555; }
.btn-print { margin-bottom: 15px; padding: 6px 10px; }
</style>
</head>
<body>
<h1>تقرير الأمان الذكي</h1>
<p class="meta">إجمالي الأحداث: ${allEvents.length}</p>
<button class="btn-print" onclick="window.print()">🖨 طباعة / حفظ PDF</button>
<table>
<thead>
<tr>
<th>الوقت</th>
<th>الجهاز</th>
<th>النوع</th>
<th>الخطورة</th>
<th>الحالة</th>
<th>المنزل</th>
<th>حساب أبشر</th>
</tr>
</thead>
<tbody>
${events
    .map(
        e => `
<tr>
<td>${e.timestamp}</td>
<td>${e.device_id}</td>
<td>${e.type}</td>
<td>${e.level}</td>
<td>${e.status || "open"}</td>
<td>${e.home_id || DEFAULT_HOME_ID}</td>
<td>${e.absher_id || DEFAULT_ABSHER_ID}</td>
</tr>`
    )
    .join("")}
</tbody>
</table>
</body>
</html>
`;
    win.document.write(html);
    win.document.close();
}

/****************************************
 * تهيئة
 ****************************************/
document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("dashboardTheme") || "dark";
    applyTheme(savedTheme);

    initMap();
    initPatrolMap();
    initOfficersMap();
    initLiveChart();

    fetchEvents();
    setInterval(fetchEvents, 3000);

    levelSelect.addEventListener("change", () => {
        currentLevelFilter = levelSelect.value;
        fetchEvents();
    });

    timeSelect.addEventListener("change", () => {
        currentTimeFilter = timeSelect.value;
        fetchEvents();
    });

    deviceSelect.addEventListener("change", () => {
        currentDeviceFilter = deviceSelect.value;
        fetchEvents();
    });

    statusSelect.addEventListener("change", () => {
        currentStatusFilter = statusSelect.value;
        fetchEvents();
    });

    viewModeSelect.addEventListener("change", () => {
        currentViewMode = viewModeSelect.value;
        fetchEvents();
    });

    toggleBtn.addEventListener("click", () => {
        fetchingEnabled = !fetchingEnabled;
        if (fetchingEnabled) {
            toggleBtn.textContent = "⏸ إيقاف التحديث";
            toggleBtn.classList.remove("paused");
            fetchEvents();
        } else {
            toggleBtn.textContent = "▶ تشغيل التحديث";
            toggleBtn.classList.add("paused");
        }
    });

    themeToggleBtn.addEventListener("click", () => {
        const isLight = document.body.classList.contains("light-theme");
        applyTheme(isLight ? "dark" : "light");
    });

    exportExcelBtn.addEventListener("click", exportVisibleEventsToExcel);

    simulationToggleBtn.addEventListener("click", () => {
        if (simulationEnabled) stopSimulation();
        else startSimulation();
    });

    goReportsBtn.addEventListener("click", openReportsPage);

    resolveAllBtn.addEventListener("click", async () => {
        const ok = confirm("هل أنت متأكد من تعليم كل البلاغات المفتوحة كـ تم الحل؟");
        if (!ok) return;
        try {
            const res = await fetch(`${API_URL}/resolve_all`, { method: "POST" });
            const data = await res.json();
            showToast(`تم حل ${data.resolved} بلاغ ✅`, "info");
            fetchEvents();
        } catch (err) {
            console.error(err);
            showToast("حدث خطأ أثناء تحديث الحالات", "warning");
        }
    });

    importExcelBtn.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        handleFileImport(file);
        fileInput.value = "";
    });

    officerViewToggleBtn.addEventListener("click", () => {
        officerViewEnabled = !officerViewEnabled;

        if (officerViewEnabled) {
            officerViewToggleBtn.textContent = "🎖 وضع الدوريات السرية: مفعّل";
            officerViewToggleBtn.classList.add("paused");
            showToast("تم تفعيل عرض الدوريات السرية فقط.", "info");
        } else {
            officerViewToggleBtn.textContent = "🎖 تفعيل وضع الدوريات السرية";
            officerViewToggleBtn.classList.remove("paused");
            showToast("تم إيقاف عرض الدوريات فقط، والعودة لكل الأجهزة.", "info");
        }

        fetchEvents();
    });
});
