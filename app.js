const fileInput = document.getElementById("fileInput");
const uploadStatus = document.getElementById("uploadStatus");
const kpis = document.getElementById("kpis");
const filterYear = document.getElementById("filterYear");
const clearFiltersBtn = document.getElementById("clearFilters");

let charts = {};
let allRows = [];
let actualKeys = {};
let showAllRecords = false;

const FIELD_CANDIDATES = {
  country: ["PAIS", "PAÍS"],
  year: ["ANO", "AÑO"],
  attackType: ["TIPO DE ATAQUE"],
  industry: ["OBJECTIVO INDUSTRIAL", "OBJETIVO INDUSTRIAL"],
  loss: [
    "PERDIDA FINANCIERA",
    "PERDIDA FINANCIERA (IN MILLION $)",
    "PERDIDA FINANCIERA  (IN MILLION $)",
    "PERDIDA FINANCIERA (IN MILLONES $)",
    "PERDIDA FINANCIERA (IN MILLONES)",
    "PERDIDA FINANCIERA ($)",
  ],
  users: ["NUMEROS DE USUARIOS AFECTADOS", "NUMERO DE USUARIOS AFECTADOS"],
  vulnerability: ["TIPO DE VULNERABILIDAD DE SEGURIDAD"],
  defense: ["MECANISMO DE DEFENSA UTILIZADO"],
  resolution: ["TIEMPO DE RESOLUCION DE INCIDENTE"],
};

const sectorIndustriaEs = {
  IT: "Tecnología",
  Banking: "Banca",
  Healthcare: "Salud",
  Retail: "Comercio",
  Education: "Educación",
  Telecommunications: "Telecomunicaciones",
  Government: "Gobierno",
  Manufacturing: "Manufactura",
  Energy: "Energía",
  Technology: "Tecnología",
  Transportation: "Transporte",
  Construction: "Construcción",
  Agriculture: "Agricultura",
};

const vulnerabilidadEs = {
  "Zero-day": "Zero-day",
  "Social Engineering": "Ingeniería social",
  "Unpatched Software": "Software sin parchear",
  "Weak Passwords": "Contraseñas débiles",
  Physical: "Físicas",
  Cyber: "Cibernéticas",
  Operational: "Operativas",
  Environmental: "Ambientales",
  "Supply chain": "Cadena de suministro",
};

function traducirSectorIndustria(nombre) {
  return sectorIndustriaEs[nombre] ?? nombre;
}

function traducirVulnerabilidad(nombre) {
  return vulnerabilidadEs[nombre] ?? nombre;
}

function detectFields(sample) {
  const found = {};
  for (const [name, candidates] of Object.entries(FIELD_CANDIDATES)) {
    found[name] = pickKey(sample, candidates);
  }
  return found;
}

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

function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function getSelectedValue(select) {
  return select.value;
}

function buildFilterOptions(select, values, includeAll = true) {
  select.innerHTML = "";

  if (includeAll) {
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "Todos";
    select.appendChild(allOption);
  }

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function applyActiveFilters() {
  const year = getSelectedValue(filterYear);

  const filteredRows = allRows.filter((row) => {
    if (!year) return true;
    return String(row[actualKeys.year] ?? "") === year;
  });

  updateMetadata(filteredRows);
  buildDashboard(filteredRows);
}

function setupRecordToggle() {
  const toggleButton = document.getElementById("toggleRecords");
  if (!toggleButton) return;

  toggleButton.onclick = () => {
    showAllRecords = !showAllRecords;
    renderRecordsTable(allRows);
  };
}

function setupFilters(rows) {
  if (!actualKeys.year) return;

  const years = Array.from(
    new Set(rows.map((r) => String(r[actualKeys.year] ?? "")).filter(Boolean))
  ).sort((a, b) => (Number(a) || 0) - (Number(b) || 0));

  buildFilterOptions(filterYear, years);

  filterYear.onchange = applyActiveFilters;
  clearFiltersBtn.onclick = () => {
    filterYear.value = "";
    applyActiveFilters();
  };
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

function updateMetadata(rows) {
  const recordCount = document.getElementById("recordCount");
  const lastLoaded = document.getElementById("lastLoaded");
  if (recordCount) recordCount.textContent = `${rows.length.toLocaleString()} registros`;
  if (lastLoaded) lastLoaded.textContent = new Date().toLocaleString();
}

function renderTable(tableId, items) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.innerHTML = "";

  items.forEach((item) => {
    const tr = document.createElement("tr");
    const tdLabel = document.createElement("td");
    const tdValue = document.createElement("td");

    tdLabel.textContent = item.label;
    tdValue.textContent = item.value.toLocaleString();

    tr.appendChild(tdLabel);
    tr.appendChild(tdValue);
    tbody.appendChild(tr);
  });
}

function updateTables({ attackTypes, industries, vulnerabilities }) {
  renderTable("tableAttackTypes", attackTypes);
  renderTable("tableIndustry", industries);
  renderTable("tableVulnerabilities", vulnerabilities);
}

function renderRecordsTable(rows) {
  const headerRow = document.getElementById("recordsHeader");
  const body = document.getElementById("recordsBody");
  const tableCount = document.getElementById("tableCount");
  const toggleButton = document.getElementById("toggleRecords");

  if (!headerRow || !body || !tableCount || !toggleButton) return;

  headerRow.innerHTML = "";
  body.innerHTML = "";

  if (!rows.length) {
    tableCount.textContent = "No hay registros para mostrar.";
    toggleButton.style.display = "none";
    return;
  }

  const keys = Object.keys(rows[0]);
  keys.forEach((key) => {
    const th = document.createElement("th");
    th.textContent = key;
    headerRow.appendChild(th);
  });

  const maxRows = showAllRecords ? rows.length : 100;
  const limitedRows = rows.slice(0, maxRows);
  limitedRows.forEach((row) => {
    const tr = document.createElement("tr");
    keys.forEach((key) => {
      const td = document.createElement("td");
      td.textContent = row[key] ?? "";
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });

  tableCount.textContent = `Mostrando ${limitedRows.length} de ${rows.length} registros`;
  toggleButton.style.display = rows.length > 100 ? "inline-flex" : "none";
  toggleButton.textContent = showAllRecords ? "Mostrar menos" : "Mostrar todo";
}

function buildDashboard(rows) {
  kpis.innerHTML = "";

  const sample = rows[0] || {};
  actualKeys = detectFields(sample);

  const totalIncidents = rows.length;
  const totalUsers = sumBy(rows, actualKeys.users);
  const totalLoss = sumBy(rows, actualKeys.loss);
  const avgResolution = averageBy(rows, actualKeys.resolution);

  kpis.appendChild(renderKPI("Total de incidentes", formatNumber(totalIncidents)));
  kpis.appendChild(renderKPI("Usuarios afectados", formatNumber(totalUsers)));
  kpis.appendChild(renderKPI("Pérdidas financieras", formatCurrency(totalLoss)));
  kpis.appendChild(renderKPI("Tiempo promedio de resolución", `${avgResolution.toFixed(1)} días`));

  const countries = groupBy(rows, actualKeys.country).slice(0, 12);
  const attacks = groupBy(rows, actualKeys.attackType).slice(0, 10);
  const industries = groupBy(rows, actualKeys.industry)
    .slice(0, 10)
    .map((item) => ({ ...item, label: traducirSectorIndustria(item.label) }));
  const vulns = groupBy(rows, actualKeys.vulnerability)
    .slice(0, 10)
    .map((item) => ({ ...item, label: traducirVulnerabilidad(item.label) }));

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
  });

  updateTables({
    attackTypes: attacks,
    industries,
    vulnerabilities: vulns,
  });

  renderRecordsTable(rows);

  setStatus(`Datos cargados: ${totalIncidents} registros`, false);
}

function parseWorkbook(workbook) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return data;
}

if (fileInput) {
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

      allRows = rows;
      actualKeys = detectFields(rows[0] || {});
      setupFilters(rows);
      setupRecordToggle();
      applyActiveFilters();
    } catch (error) {
      console.error(error);
      setStatus("Error leyendo el archivo. Asegúrate de que sea un Excel válido.", true);
    }
  });
}

setStatus("Cargando datos pre-cargados...", false);

async function loadDefaultData() {
  try {
    const response = await fetch("./data.json");
    if (!response.ok) throw new Error("No se pudo cargar data.json");
    const rows = await response.json();

    if (!rows.length) throw new Error("data.json está vacío");

    allRows = rows;
    actualKeys = detectFields(rows[0] || {});
    setupFilters(rows);
    setupRecordToggle();
    applyActiveFilters();

    setStatus(`Datos cargados automáticamente (${rows.length} registros)`, false);
    updateMetadata(rows);
  } catch (error) {
    console.warn("No se cargó data.json:", error);
    setStatus("Carga un archivo Excel para comenzar.", false);
  }
}

loadDefaultData();
