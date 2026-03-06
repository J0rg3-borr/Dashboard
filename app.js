const fileInput = document.getElementById("fileInput");
const uploadStatus = document.getElementById("uploadStatus");
const kpis = document.getElementById("kpis");

let charts = {};

function normalizeKey(key) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

function pickKey(row, candidates) {
  const keys = Object.keys(row);
  const normalized = keys.reduce((acc, key) => {
    acc[normalizeKey(key)] = key;
    return acc;
  }, {});

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeKey(candidate);
    if (normalized[normalizedCandidate]) {
      return normalized[normalizedCandidate];
    }
  }
  return null;
}

function groupBy(rows, key) {
  const counts = new Map();
  for (const row of rows) {
    const value = String(row[key] ?? "").trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}

function sumBy(rows, key) {
  return rows.reduce((sum, row) => {
    const raw = row[key];
    const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[^0-9.\-]/g, ""));
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
}

function averageBy(rows, key) {
  const values = rows
    .map((row) => {
      const raw = row[key];
      const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[^0-9.\-]/g, ""));
      return Number.isFinite(n) ? n : null;
    })
    .filter((v) => v !== null);

  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function formatNumber(value) {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}

function renderKPI(title, value) {
  const card = document.createElement("div");
  card.className = "kpi";
  card.innerHTML = `
    <div class="kpi-title">${title}</div>
    <div class="kpi-value">${value}</div>
  `;
  return card;
}

function updateCharts(configs) {
  for (const [key, cfg] of Object.entries(configs)) {
    const canvas = document.getElementById(cfg.canvasId);
    if (!canvas) continue;

    if (charts[key]) {
      charts[key].destroy();
    }

    charts[key] = new Chart(canvas, {
      type: cfg.type,
      data: {
        labels: cfg.data.labels,
        datasets: [
          {
            label: cfg.data.label,
            data: cfg.data.values,
            backgroundColor: cfg.data.backgroundColor,
            borderColor: cfg.data.borderColor,
            borderWidth: 1,
          },
        ],
      },
      options: cfg.options || {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: "#c9d1d9" },
            grid: { color: "rgba(203, 213, 225, 0.1)" },
          },
          x: {
            ticks: { color: "#c9d1d9" },
            grid: { color: "rgba(203, 213, 225, 0.08)" },
          },
        },
      },
    });
  }
}

function setStatus(message, isError = false) {
  uploadStatus.textContent = message;
  uploadStatus.style.color = isError ? "#f87171" : "#8b949e";
}

function buildDashboard(rows) {
  kpis.innerHTML = "";

  const map = {
    country: ["PAIS", "PAÍS"],
    year: ["ANO", "AÑO"],
    attackType: ["TIPO DE ATAQUE"],
    industry: ["OBJECTIVO INDUSTRIAL", "OBJETIVO INDUSTRIAL"],
    loss: ["PERDIDA FINANCIERA"],
    users: ["NUMEROS DE USUARIOS AFECTADOS", "NUMERO DE USUARIOS AFECTADOS"],
    vulnerability: ["TIPO DE VULNERABILIDAD DE SEGURIDAD"],
    defense: ["MECANISMO DE DEFENSA UTILIZADO"],
    resolution: ["TIEMPO DE RESOLUCION DE INCIDENTE"],
  };

  const sample = rows[0] || {};
  const keys = Object.keys(sample);

  const actual = {};
  for (const [name, candidates] of Object.entries(map)) {
    actual[name] = pickKey(sample, candidates);
  }

  const totalIncidents = rows.length;
  const totalUsers = sumBy(rows, actual.users);
  const totalLoss = sumBy(rows, actual.loss);
  const avgResolution = averageBy(rows, actual.resolution);

  kpis.appendChild(renderKPI("Total de incidentes", formatNumber(totalIncidents)));
  kpis.appendChild(renderKPI("Usuarios afectados (total)", formatNumber(totalUsers)));
  kpis.appendChild(renderKPI("Pérdidas financieras", `$${formatNumber(totalLoss)}`));
  kpis.appendChild(renderKPI("Resolución promedio (días)", `${avgResolution.toFixed(1)} días`));

  const countries = groupBy(rows, actual.country).slice(0, 12);
  const attacks = groupBy(rows, actual.attackType).slice(0, 12);
  const industries = groupBy(rows, actual.industry).slice(0, 12);
  const vulns = groupBy(rows, actual.vulnerability).slice(0, 12);
  const defenses = groupBy(rows, actual.defense).slice(0, 12);

  const years = groupBy(rows, actual.year)
    .map((item) => ({ ...item, label: String(item.label) }))
    .sort((a, b) => Number(a.label) - Number(b.label));

  updateCharts({
    countries: {
      canvasId: "chartCountries",
      type: "bar",
      data: {
        label: "Incidentes",
        labels: countries.map((c) => c.label),
        values: countries.map((c) => c.value),
        backgroundColor: "rgba(88, 166, 255, 0.7)",
        borderColor: "rgba(88, 166, 255, 1)",
      },
    },
    attackTypes: {
      canvasId: "chartAttackTypes",
      type: "bar",
      data: {
        label: "Incidentes",
        labels: attacks.map((c) => c.label),
        values: attacks.map((c) => c.value),
        backgroundColor: "rgba(88, 255, 194, 0.7)",
        borderColor: "rgba(88, 255, 194, 1)",
      },
    },
    industry: {
      canvasId: "chartIndustry",
      type: "bar",
      data: {
        label: "Incidentes",
        labels: industries.map((c) => c.label),
        values: industries.map((c) => c.value),
        backgroundColor: "rgba(255, 170, 88, 0.7)",
        borderColor: "rgba(255, 170, 88, 1)",
      },
    },
    vulnerabilities: {
      canvasId: "chartVulnerabilities",
      type: "bar",
      data: {
        label: "Incidentes",
        labels: vulns.map((c) => c.label),
        values: vulns.map((c) => c.value),
        backgroundColor: "rgba(255, 88, 181, 0.7)",
        borderColor: "rgba(255, 88, 181, 1)",
      },
    },
    defense: {
      canvasId: "chartDefense",
      type: "bar",
      data: {
        label: "Incidentes",
        labels: defenses.map((c) => c.label),
        values: defenses.map((c) => c.value),
        backgroundColor: "rgba(134, 89, 255, 0.7)",
        borderColor: "rgba(134, 89, 255, 1)",
      },
    },
    years: {
      canvasId: "chartYears",
      type: "line",
      data: {
        label: "Incidentes por año",
        labels: years.map((c) => c.label),
        values: years.map((c) => c.value),
        backgroundColor: "rgba(64, 255, 146, 0.3)",
        borderColor: "rgba(64, 255, 146, 1)",
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: "#c9d1d9" },
            grid: { color: "rgba(203, 213, 225, 0.1)" },
          },
          x: {
            ticks: { color: "#c9d1d9" },
            grid: { color: "rgba(203, 213, 225, 0.08)" },
          },
        },
      },
    },
  });

  setStatus(`Datos cargados: ${totalIncidents} registros`, false);
}

function parseWorkbook(workbook) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return data;
}

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setStatus("Cargando...", false);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const rows = parseWorkbook(workbook);

    if (!rows.length) {
      setStatus("No se detectaron filas en el archivo.", true);
      return;
    }

    buildDashboard(rows);
  } catch (error) {
    console.error(error);
    setStatus("Error leyendo el archivo. Asegúrate de que sea un Excel válido.", true);
  }
});

setStatus("Carga un archivo Excel para comenzar.");
