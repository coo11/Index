// 2023.12.7 From https://gaoweix.com/im-dict-converter/

async function readFileContent(file, asBinary) {
  return new Promise((resolve, reject) => {
    let fileReaderInstance = new FileReader();
    fileReaderInstance.onload = ({ target: { result: e } }) => resolve(e);
    fileReaderInstance.onerror = ({ target: { error: e } }) =>
      reject(new BusinessError(e.message || "读取文件失败。", e));
    asBinary
      ? fileReaderInstance.readAsArrayBuffer(file)
      : fileReaderInstance.readAsText(file);
  });
}

function saveBlob(e, filename) {
  var e = URL.createObjectURL(e),
    t = document.createElement("a");
  (t.download = filename),
    (t.style.display = "none"),
    (t.href = e),
    document.body.appendChild(t),
    t.click(),
    document.body.removeChild(t),
    URL.revokeObjectURL(e);
}

function saveData(e, filename, type = "") {
  saveBlob(new Blob([e], { type }), filename);
}

class BinaryReader {
  constructor(e) {
    (this.arrayBuffer = e),
      (this.dataView = new DataView(e)),
      (this.textDecoderMap = new Map()),
      (this.offset = 0);
  }
  length() {
    return this.arrayBuffer.byteLength;
  }
  nextUint8() {
    var e = this.dataView.getUint8(this.offset);
    return (this.offset += 1), e;
  }
  nextUint16(e = !1) {
    e = this.dataView.getUint16(this.offset, e);
    return (this.offset += 2), e;
  }
  nextUint32(e = !1) {
    e = this.dataView.getUint32(this.offset, e);
    return (this.offset += 4), e;
  }
  nextString(e, n = "utf-8") {
    (n = this.getTextDecoder(n).decode(
      new Int8Array(this.arrayBuffer, this.offset, e)
    )),
      (this.offset += e),
      (e = n.indexOf("\0"));
    return e < 0 ? n : n.substring(0, e);
  }
  getTextDecoder(e) {
    return (
      this.textDecoderMap.has(e) ||
        this.textDecoderMap.set(e, new TextDecoder(e)),
      this.textDecoderMap.get(e)
    );
  }
}

class BinaryWriter {
  constructor(e = 16) {
    (this.offset = 0),
      (this.arrayBuffer = new ArrayBuffer(e)),
      (this.textEncoder = new TextEncoder()),
      (this._dataView = null),
      (this._uint8Array = null);
  }
  appendUint8Array(e) {
    var n = e.byteLength ?? e.length;
    this.checkSize(n), this.unit8Array.set(e, this.offset), (this.offset += n);
  }
  appendArrayBuffer(e) {
    this.appendUint8Array(new Uint8Array(e));
  }
  appendUtf8String(e) {
    this.appendUint8Array(this.textEncoder.encode(e));
  }
  appendUtf16String(n, t = !1) {
    this.checkSize(2 * n.length);
    for (let e = 0; e < n.length; e++)
      this.dataView.setUint16(this.offset, n.charCodeAt(e), t),
        (this.offset += 2);
  }
  appendUint8(e) {
    this.checkSize(1),
      this.dataView.setUint8(this.offset, e),
      (this.offset += 1);
  }
  appendUint16(e, n = !1) {
    this.checkSize(2),
      this.dataView.setUint16(this.offset, e, n),
      (this.offset += 2);
  }
  appendUint32(e, n = !1) {
    this.checkSize(4),
      this.dataView.setUint32(this.offset, e, n),
      (this.offset += 4);
  }
  toArrayBuffer() {
    return this.arrayBuffer.slice(0, this.offset);
  }
  checkSize(n) {
    if (this.offset + n > this.arrayBuffer.byteLength) {
      let e = 2 * this.arrayBuffer.byteLength;
      for (; this.offset + n > e; ) e *= 2;
      var t = new ArrayBuffer(e);
      new Uint8Array(t).set(new Uint8Array(this.arrayBuffer)),
        (this.arrayBuffer = t),
        (this._dataView = null),
        (this._uint8Array = null);
    }
  }
  get unit8Array() {
    return (
      this._uint8Array || (this._uint8Array = new Uint8Array(this.arrayBuffer)),
      this._uint8Array
    );
  }
  get dataView() {
    return (
      this._dataView || (this._dataView = new DataView(this.arrayBuffer)),
      this._dataView
    );
  }
}

async function parse(e) {
  var n = await readFileContent(e, true),
    i = new BinaryReader(n),
    a = ((i.offset = 16), i.nextUint32(!0)),
    r = i.nextUint32(!0),
    s = i.nextUint32(!0),
    o = i.nextUint32(!0);
  const u = [];
  let c = r;
  for (let n = 0; n < o; n++) {
    let e;
    (e =
      n === o - 1 ? s : ((i.offset = a + 4 * (n + 1)), r + i.nextUint32(!0))),
      (i.offset = c + 4);
    var p = i.nextUint16(!0) - 16 - 2;
    const h = i.nextUint8();
    i.offset += 9;
    p = i.nextString(p, "utf-16le");
    i.offset += 2;
    const l = i.nextString(e - i.offset - 2, "utf-16le");
    try {
      // console.log(p, l, h);
      txa.value += `${p}=${h},${l}\n`;
    } catch (e) {}
    c = e;
  }
  return u;
}

async function dump(data, filename) {
  const i = new BinaryWriter();
  var t = data.length,
    a = 64 + 4 * t,
    a =
      (i.appendUtf8String("mschxudp"),
      i.appendUint8Array([2, 0, 96, 0, 1, 0, 0, 0]),
      i.appendUint32(64, !0),
      i.appendUint32(a, !0),
      i.offset);
  (i.offset += 4),
    i.appendUint32(t, !0),
    i.appendUint32(new Date().getTime() / 1e3, !0),
    (i.offset = 64);
  let r = 0;
  data.forEach(({ key: e, word: n }) => {
    i.appendUint32(r, !0), (r += 16 + 2 * e.length + 2 + 2 * n.length + 2);
  }),
    data.forEach(({ key: e, word: n, order: t }) => {
      i.appendUint8Array([16, 0, 16, 0]),
        i.appendUint16(16 + 2 * e.length + 2, !0),
        i.appendUint8(t || 1),
        i.appendUint8(6),
        i.appendUint8Array([0, 0, 0, 0]),
        i.appendUint32(
          (new Date().getTime() - new Date("2000-01-01").getTime()) / 1e3,
          !0
        ),
        i.appendUtf16String(e, !0),
        i.appendUint8Array([0, 0]),
        i.appendUtf16String(n, !0),
        i.appendUint8Array([0, 0]);
    });
  t = i.offset;
  (i.offset = a),
    i.appendUint32(t, !0),
    (i.offset = t),
    saveData(i.toArrayBuffer(), filename + ".dat");
}

const ipt = document.getElementById("file-input");
const txa = document.getElementById("show-area");
const btn = document.getElementById("dump-btn");
const etp = document.getElementById("err-tip");

ipt.onclick = ({ target: e }) => {
  e.value = "";
  etp.innerText = "";
};
ipt.onchange = ({ target: e }) => {
  e = e.files;
  console.debug("selected files: ", e);
  console.log(e[0]);
  parse(e[0]);
};
btn.onclick = () => {
  let data = txa.value.trim().split("\n");
  if (!data) return;
  let errMsg = "";
  try {
    data = data.map((i, idx) => {
      let [, key, order, word] =
        i.match(/([^=]+?)\s*=\s*(\d+)\s*,\s*(.*)/) || [];
      if (!key || !order || !word) {
        errMsg += `Line ${idx} error: ${i}\n`;
        return null;
      }
      if (key.startsWith("u") || key.startsWith("v")) {
        errMsg += `Line ${idx} error: ${i} - Phrase starts with "u/v" is invalid\n`;
        return null;
      }
      return { key, order, word };
    });
    data = data.filter(i => Boolean(i));
    if (!data.length) return;
    dump(data, "UserDefinedPhrase_" + Date.now());
  } catch (e) {
    errMsg += e.message;
  }
  etp.innerText = errMsg;
};
