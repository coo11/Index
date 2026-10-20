const form = document.forms.head;
const errorTipElement = document.getElementById("error");
const tBody = document.getElementById("tb");

const keyDict = {
  postScriptName: "PostScript名称",
  fontFamily: "字体家族名称",
  designer: "设计师",
  manufacturer: "生产商",
  manufacturerURL: "生产商网址",
  copyright: "版权描述",
  license: "授权许可",
  licenseURL: "授权许可网址",
  trademark: "商标",
  fullName: "全名",
  description: "描述",
  fontSubfamily: "样式名称",
  version: "版本",
  uniqueID: "唯一名称",
  sampleText: "样例文本"
};

const moreDict = {
  ascender: "上升部",
  descender: "下降部",
  defaultWidthX: "字形宽度",
  numGlyphs: "字形数",
  unitsPerEm: "UPM值",
  outlinesFormat: "轮廓形式",

  numberOfHMetrics: "",
  nominalWidthX: "",
  gsubrsBias: "",
  subrsBias: "",
  isCIDFont: ""
};

form.fontFile.onchange = e => {
  const file = e.target.files[0];
  if (file) display(file, file.name);
};

const showError = msg => {
  if (!msg?.trim()) {
    errorTipElement.style.display = "none";
  } else {
    errorTipElement.style.display = "block";
  }
  errorTipElement.textContent = msg;
};

const sortKeys = dict => {
  const keys = Object.keys(dict);
  const nonNumericKeys = keys.filter(key => isNaN(Number(key)));
  const numericKeys = keys.filter(key => !isNaN(Number(key)));
  nonNumericKeys.sort();
  numericKeys.sort((a, b) => Number(a) - Number(b));
  return [...nonNumericKeys, ...numericKeys];
};

const escapeHtml = unsafe => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\u0022/g, "&quot;")
    .replace(/\u0027/g, "&#039;");
};

const loadScript = src => new Promise((onload, onerror) => document.head.append(Object.assign(document.createElement("script"), { src, onload, onerror })));

function updateInfoTable(font, fontFileName) {
  tBody.innerHTML = "";

  let row = tBody.insertRow();
  row.classList.add("hl");
  let th = Object.assign(document.createElement("th"), { colSpan: 2, textContent: `Filename: ${fontFileName}` });
  row.appendChild(th);

  const names = font.names;
  const keys = sortKeys(names);
  for (let key of keys) {
    const property = names[key];
    const langKeys = sortKeys(property);
    let values = [];
    for (let langKey of langKeys) {
      const escapedProperty = escapeHtml(property[langKey]);
      values.push(`<span class="badge">${langKey}</span>${escapedProperty}`);
    }
    const row = tBody.insertRow();
    row.insertCell().textContent = keyDict[key] || key;
    row.insertCell().innerHTML = values.join("<br>");
  }

  row = tBody.insertRow();
  row.classList.add("hl");
  th = Object.assign(document.createElement("th"), { colSpan: 2, textContent: "More" });
  row.appendChild(th);

  for (let key in moreDict) {
    if (!font.hasOwnProperty(key)) continue;
    const row = tBody.insertRow();
    row.insertCell().textContent = moreDict[key] !== "" ? moreDict[key] : key;
    row.insertCell().textContent = font[key];
  }
}

async function display(file, name) {
  const isWoff2 = name.endsWith(".woff2");
  if (isWoff2 && !window.Module) {
    const wasmReady = new Promise(onRuntimeInitialized => (window.Module = { onRuntimeInitialized }));
    await loadScript("https://unpkg.com/wawoff2@2.0.1/build/decompress_binding.js"); // wawoff2 is globaly loaded as 'Module'
    await wasmReady; // WASM has called our onRuntimeInitialized() resolver
  }
  try {
    let data = await file.arrayBuffer();
    if (isWoff2) data = new Uint8Array(Module.decompress(data)).buffer;
    updateInfoTable(opentype.parse(data), name);
    showError("");
  } catch (err) {
    showError(err.toString());
  }
}

// demo.woff2
const demoFont =
  "data:application/font-woff2;base64,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";

fetch(demoFont).then(resp => display(resp, "demo.woff2"));
