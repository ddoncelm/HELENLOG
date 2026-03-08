import { useState, useEffect, useCallback } from "react";
import JSZip from "jszip";

// ── DATOS CLÍNICOS ──────────────────────────────────────────────────────────
const FRANJAS = [
  { id: "0-6",   label: "0–6 m" },
  { id: "6-12",  label: "6–12 m" },
  { id: "12-18", label: "12–18 m" },
  { id: "18-24", label: "18–24 m" },
  { id: "24-36", label: "24–36 m" },
  { id: "36-48", label: "36–48 m" },
];

const HITOS = {
  "0-6": {
    preverbal:    ["Llanto diferenciado según necesidad","Sonrisa social ante el rostro humano","Contacto ocular sostenido","Vocaliza en respuesta al adulto","Gorjeo y arrullos"],
    comprension:  ["Reacciona a la voz humana","Se calma ante el tono tranquilizador","Orienta la mirada hacia el sonido","Anticipa rutinas cotidianas (baño, comida)"],
    expresion:    ["Vocaliza espontáneamente","Alterna vocalizaciones con el adulto (protoconversación)","Emite sonidos vocálicos variados"],
    habla:        ["Producción de vocales abiertas (a, e)","Balbuceo inicial","Sonidos bilabiales (p, b, m)"],
    pragmatica:   ["Mantiene contacto ocular","Sonríe en interacción","Responde a la cara del cuidador","Inicia intercambios con la mirada"],
  },
  "6-12": {
    preverbal:    ["Señalización proto-imperativa (pide objetos)","Señalización proto-declarativa (comparte interés)","Seguimiento de la mirada del adulto","Uso de gestos comunicativos (adiós, toma)","Atención conjunta sostenida"],
    comprension:  ["Comprende 'no' en contexto","Responde a su nombre","Comprende palabras familiares aisladas (mamá, papá, bibe)","Sigue órdenes simples con gesto","Comprende 3-5 palabras en contexto"],
    expresion:    ["Balbuceo canónico (ba-ba, ma-ma)","Balbuceo variado (combinaciones consonante-vocal)","Primera palabra funcional","Jerga entonada con intención comunicativa"],
    habla:        ["Producción de sílabas CV repetidas (ma-ma, pa-pa)","Consonantes bilabiales en posición inicial","Vocales en contexto de sílaba"],
    pragmatica:   ["Inicia interacción con el adulto","Responde al turno conversacional","Usa gestos para comunicar","Muestra objetos al adulto","Juego de turnos (dar-tomar)"],
  },
  "12-18": {
    preverbal:    ["Señala con índice para pedir y mostrar","Combina gesto + vocalización","Atención conjunta bien establecida","Seguimiento de punto de mirada del adulto"],
    comprension:  ["Comprende 10-20 palabras","Sigue órdenes simples sin gesto","Identifica objetos nombrados","Comprende preguntas simples (¿dónde está?)","Reconoce partes del cuerpo principales"],
    expresion:    ["Vocabulario expresivo de 5-20 palabras","Usa palabras funcionales (más, no, aquí)","Denomina objetos familiares","Combina gesto + palabra"],
    habla:        ["Consonantes p, b, m, t, d en posición inicial","Estructura CV estable","Vocales estabilizadas","Inteligibilidad ~25% para extraños"],
    pragmatica:   ["Pide ayuda al adulto","Rechaza activamente","Comenta con mirada y gesto","Muestra interés en otros niños","Imita acciones del adulto"],
  },
  "18-24": {
    preverbal:    ["Comunicación multimodal (palabra+gesto+mirada)","Intención comunicativa clara y persistente","Reparación comunicativa ante fallo"],
    comprension:  ["Comprende 200-300 palabras","Sigue órdenes de dos elementos","Comprende conceptos espaciales básicos (dentro, encima)","Identifica objetos por función","Comprende preguntas ¿qué? y ¿dónde?"],
    expresion:    ["Vocabulario expresivo de 50+ palabras","Combinaciones de dos palabras (más agua, papá no)","Usa pronombres mío, mía","Nombra imágenes en libro","Vocabulario crece rápidamente"],
    habla:        ["Consonantes p, b, m, t, d, n bien establecidas","Primeras fricativas (f, s)","Inteligibilidad ~50% para extraños","Estructura CVC simple"],
    pragmatica:   ["Conversación de 2-3 intercambios","Solicita información (¿qué es eso?)","Mantiene tema brevemente","Participa en juego simbólico simple","Respeta turno conversacional básico"],
  },
  "24-36": {
    preverbal:    ["Comunicación principalmente verbal","Usa lenguaje para regular conducta propia y ajena","Narración de experiencias recientes"],
    comprension:  ["Comprende frases complejas","Comprende conceptos temporales (antes, después)","Sigue instrucciones de tres elementos","Comprende preguntas ¿por qué? y ¿cómo?","Comprende negación en frases"],
    expresion:    ["Vocabulario de 200-500 palabras","Frases de 3-4 palabras","Usa plurales e irregulares básicos","Hace preguntas ¿qué?, ¿dónde?, ¿quién?","Describe lo que ve en imágenes"],
    habla:        ["Consonantes k, g, l establecidas","Primeras sílabas trabadas (bla, pla)","Inteligibilidad ~75% para extraños","Consonante en posición final estabilizada"],
    pragmatica:   ["Narra cuentos simples","Mantiene conversación de varios turnos","Adapta el lenguaje al interlocutor","Juego simbólico elaborado","Comprende y usa bromas simples"],
  },
  "36-48": {
    preverbal:    ["Comunicación completamente verbal en contextos familiares","Usa lenguaje para planificar y regular comportamiento"],
    comprension:  ["Comprende vocabulario abstracto básico","Comprende frases pasivas simples","Sigue instrucciones complejas de 3-4 pasos","Comprende analogías simples","Comprende conceptos de cantidad y tamaño"],
    expresion:    ["Vocabulario de 1000+ palabras","Frases de 4-6 palabras bien estructuradas","Usa pasado, presente y futuro","Cuenta cuentos con inicio-nudo-desenlace","Hace preguntas ¿por qué? y ¿cuándo?"],
    habla:        ["r simple presente","Grupos consonánticos en posición inicial","Inteligibilidad >90% para extraños","Procesos fonológicos reducidos"],
    pragmatica:   ["Relata experiencias pasadas con coherencia","Mantiene tema en conversación","Ajusta registro según contexto","Comprende intenciones comunicativas","Participa en juego cooperativo"],
  },
};

const AREA_META = {
  preverbal:   { label: "Preverbal",     full: "Comunicación preverbal",    color: "#4ECDC4", icon: "💬" },
  comprension: { label: "Comprensión",   full: "Comprensión del lenguaje",  color: "#45B7D1", icon: "👂" },
  expresion:   { label: "Expresión",     full: "Expresión verbal",          color: "#96CEB4", icon: "🗣️" },
  habla:       { label: "Habla",         full: "Habla / Articulación",      color: "#FFEAA7", icon: "🔤" },
  pragmatica:  { label: "Pragmática",    full: "Pragmática social",         color: "#DDA0DD", icon: "🤝" },
};

const AREAS = Object.keys(AREA_META);

// ── STORAGE ────────────────────────────────────────────────────────────────
const STORE_KEY = "helenlog_v1";
function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { pacientes: [] }; }
  catch { return { pacientes: [] }; }
}
function saveStore(data) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch {}
}

// ── UTILS ──────────────────────────────────────────────────────────────────
function calcularPerfil(checks, franja) {
  const res = {};
  AREAS.forEach(a => {
    const total = HITOS[franja][a]?.length || 0;
    const ok = HITOS[franja][a]?.filter((_, i) => checks?.[a]?.[i]).length || 0;
    res[a] = total > 0 ? Math.round((ok / total) * 100) : 0;
  });
  return res;
}

function fmtFecha(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function calcEdad(fechaNac) {
  if (!fechaNac) return null;
  const hoy = new Date(), nac = new Date(fechaNac);
  let m = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
  if (m < 0) return null;
  return m < 12 ? `${m} meses` : `${Math.floor(m/12)}a ${m%12}m`;
}

// ── RADAR CHART ────────────────────────────────────────────────────────────
function RadarChart({ perfil, perfilAnterior = null, size = 220 }) {
  const cx = size/2, cy = size/2, r = size*0.37;
  const n = AREAS.length;
  const step = (2 * Math.PI) / n;
  const off = -Math.PI / 2;

  function pt(i, pct) {
    const a = off + i * step;
    const d = (pct / 100) * r;
    return [cx + d * Math.cos(a), cy + d * Math.sin(a)];
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: size, display: "block", margin: "0 auto" }}>
      {[25,50,75,100].map(lvl => (
        <polygon key={lvl}
          points={AREAS.map((_,i) => pt(i,lvl).join(",")).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      ))}
      {AREAS.map((_,i) => {
        const [x,y] = pt(i,100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>;
      })}
      {/* Polígono anterior (naranja, si existe) */}
      {perfilAnterior && (
        <>
          <polygon
            points={AREAS.map((a,i) => pt(i, perfilAnterior[a]||0).join(",")).join(" ")}
            fill="rgba(255,165,80,0.15)" stroke="#FFA550" strokeWidth="2" strokeDasharray="5,3"/>
          {AREAS.map((a,i) => {
            const [x,y] = pt(i, perfilAnterior[a]||0);
            return <circle key={a} cx={x} cy={y} r="3" fill="#FFA550"/>;
          })}
        </>
      )}
      {/* Polígono actual (teal) */}
      <polygon
        points={AREAS.map((a,i) => pt(i, perfil[a]||0).join(",")).join(" ")}
        fill="rgba(78,205,196,0.2)" stroke="#4ECDC4" strokeWidth="2"/>
      {AREAS.map((a,i) => {
        const [x,y] = pt(i, perfil[a]||0);
        return <circle key={a} cx={x} cy={y} r="4" fill="#4ECDC4"/>;
      })}
      {AREAS.map((a,i) => {
        const angle = off + i * step;
        const lx = cx + (r+22)*Math.cos(angle);
        const ly = cy + (r+22)*Math.sin(angle);
        return <text key={a} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={size*0.07}>{AREA_META[a].icon}</text>;
      })}
    </svg>
  );
}

// ── BARRA ──────────────────────────────────────────────────────────────────
function Barra({ pct, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 6, height: 7, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.5s ease" }}/>
    </div>
  );
}

// ── EXPORTAR INFORME ───────────────────────────────────────────────────────

function nombreArchivo(paciente, ext) {
  return `HelenLog_${paciente.nombre.replace(/\s+/g,"_")}_${new Date().toISOString().split("T")[0]}.${ext}`;
}

// ── ODT (OpenOffice / LibreOffice) ─────────────────────────────────────────
async function exportarODT(paciente) {
  const evals = paciente.evaluaciones || [];
  const ultima = evals[evals.length - 1];

  // ODT is a ZIP with XML inside. We build it manually.
  // content.xml
  function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  const perfilRows = ultima ? AREAS.map(a => {
    const pct = ultima.perfil[a] || 0;
    const bar = "█".repeat(Math.round(pct/5)) + "░".repeat(20-Math.round(pct/5));
    return `<table:table-row>
      <table:table-cell office:value-type="string"><text:p text:style-name="Table_20_Contents">${esc(AREA_META[a].full)}</text:p></table:table-cell>
      <table:table-cell office:value-type="string"><text:p text:style-name="Table_20_Contents">${bar}</text:p></table:table-cell>
      <table:table-cell office:value-type="string"><text:p text:style-name="Table_20_Contents">${pct}%</text:p></table:table-cell>
    </table:table-row>`;
  }).join("") : "";

  const historial = evals.map((ev, i) => {
    const franjaLabel = FRANJAS.find(f=>f.id===ev.franja)?.label.replace(" m"," meses") || ev.franja;
    const areaBlocks = AREAS.map(a => {
      const hitos = HITOS[ev.franja][a] || [];
      const logrados = hitos.filter((_,idx) => ev.checks?.[a]?.[idx]).length;
      const items = hitos.map((h,idx) => {
        const ok = ev.checks?.[a]?.[idx];
        return `<text:list-item><text:p text:style-name="List_20_Bullet">${ok?"✓":"○"} ${esc(h)}</text:p></text:list-item>`;
      }).join("");
      return `<text:p text:style-name="Heading_20_4">${esc(AREA_META[a].full)} (${logrados}/${hitos.length})</text:p>
      <text:list>${items}</text:list>`;
    }).join("");
    return `<text:p text:style-name="Heading_20_3">Evaluación ${i+1} — ${esc(fmtFecha(ev.fecha))} · ${esc(franjaLabel)}</text:p>
    ${ev.notas ? `<text:p text:style-name="Quotations">${esc(ev.notas)}</text:p>` : ""}
    ${areaBlocks}`;
  }).join(`<text:p text:style-name="Horizontal_20_Line">──────────────────────────────</text:p>`);

  const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  office:version="1.3">
<office:body><office:text>
  <text:p text:style-name="Title">HelenLog — Informe de Seguimiento Logopédico</text:p>
  <text:p text:style-name="Subtitle">Atención Temprana</text:p>
  <text:p text:style-name="Heading_20_2">Datos del paciente</text:p>
  <text:p text:style-name="Text_20_Body"><text:span text:style-name="Strong_20_Emphasis">Paciente: </text:span>${esc(paciente.nombre)}</text:p>
  ${paciente.fechaNac ? `<text:p text:style-name="Text_20_Body"><text:span text:style-name="Strong_20_Emphasis">F. nacimiento: </text:span>${esc(fmtFecha(paciente.fechaNac))}</text:p>` : ""}
  <text:p text:style-name="Text_20_Body"><text:span text:style-name="Strong_20_Emphasis">Evaluaciones: </text:span>${evals.length}</text:p>
  <text:p text:style-name="Text_20_Body"><text:span text:style-name="Strong_20_Emphasis">Informe generado: </text:span>${esc(fmtFecha(new Date().toISOString()))}</text:p>
  ${paciente.observaciones ? `<text:p text:style-name="Text_20_Body"><text:span text:style-name="Strong_20_Emphasis">Observaciones: </text:span>${esc(paciente.observaciones)}</text:p>` : ""}
  ${ultima ? `
  <text:p text:style-name="Heading_20_2">Perfil comunicativo actual</text:p>
  <text:p text:style-name="Text_20_Body">Última evaluación: ${esc(fmtFecha(ultima.fecha))} · Franja: ${esc(FRANJAS.find(f=>f.id===ultima.franja)?.label.replace(" m"," meses"))}</text:p>
  <table:table>
    <table:table-column/><table:table-column/><table:table-column/>
    <table:table-row>
      <table:table-cell office:value-type="string"><text:p text:style-name="Table_20_Heading">Área</text:p></table:table-cell>
      <table:table-cell office:value-type="string"><text:p text:style-name="Table_20_Heading">Progreso</text:p></table:table-cell>
      <table:table-cell office:value-type="string"><text:p text:style-name="Table_20_Heading">%</text:p></table:table-cell>
    </table:table-row>
    ${perfilRows}
  </table:table>` : ""}
  <text:p text:style-name="Heading_20_2">Historial de evaluaciones</text:p>
  ${historial || `<text:p text:style-name="Text_20_Body">Sin evaluaciones registradas.</text:p>`}
  <text:p text:style-name="Footer">Generado con HelenLog · ${new Date().toLocaleDateString("es-ES")}</text:p>
</office:text></office:body></office:document-content>`;

  const mimetypeContent = "application/vnd.oasis.opendocument.text";
  const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

  const zip = new JSZip();
  zip.file("mimetype", mimetypeContent);
  zip.folder("META-INF").file("manifest.xml", manifestXml);
  zip.file("content.xml", contentXml);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombreArchivo(paciente, "odt"); a.click();
  URL.revokeObjectURL(url);
}

// ── DOCX (Word) ────────────────────────────────────────────────────────────
async function exportarDOCX(paciente) {
  const evals = paciente.evaluaciones || [];
  const ultima = evals[evals.length - 1];

  // DOCX is also a ZIP with XML (OOXML)
  function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function para(text, style="Normal") {
    return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
  }
  function heading(text, level=1) { return para(text, `Heading${level}`); }
  function bold(label, val) {
    return `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${esc(label)}</w:t></w:r><w:r><w:t xml:space="preserve">${esc(val)}</w:t></w:r></w:p>`;
  }
  function tableRow(...cells) {
    const tds = cells.map(c => `<w:tc><w:p><w:r><w:t>${esc(c)}</w:t></w:r></w:p></w:tc>`).join("");
    return `<w:tr>${tds}</w:tr>`;
  }

  const perfilTable = ultima ? `
  <w:tbl>
    <w:tblPr><w:tblW w:w="9000" w:type="dxa"/></w:tblPr>
    ${tableRow("Área", "Progreso (████░░)", "%")}
    ${AREAS.map(a => {
      const pct = ultima.perfil[a]||0;
      const bar = "█".repeat(Math.round(pct/5))+"░".repeat(20-Math.round(pct/5));
      return tableRow(AREA_META[a].full, bar, pct+"%");
    }).join("")}
  </w:tbl>` : "";

  const historialXml = evals.map((ev, i) => {
    const franjaLabel = FRANJAS.find(f=>f.id===ev.franja)?.label.replace(" m"," meses") || ev.franja;
    const areaXml = AREAS.map(a => {
      const hitos = HITOS[ev.franja][a] || [];
      const logrados = hitos.filter((_,idx) => ev.checks?.[a]?.[idx]).length;
      const items = hitos.map((h,idx) => {
        const ok = ev.checks?.[a]?.[idx];
        return `<w:p><w:pPr><w:pStyle w:val="ListBullet"/></w:pPr><w:r><w:t xml:space="preserve">${ok?"✓ ":"○ "}${esc(h)}</w:t></w:r></w:p>`;
      }).join("");
      return heading(`${AREA_META[a].full} (${logrados}/${hitos.length})`, 4) + items;
    }).join("");
    return heading(`Evaluación ${i+1} — ${fmtFecha(ev.fecha)} · ${franjaLabel}`, 3)
      + (ev.notas ? para(`Notas: ${ev.notas}`) : "")
      + areaXml
      + `<w:p><w:r><w:t>──────────────────────────</w:t></w:r></w:p>`;
  }).join("");

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
  ${heading("HelenLog — Informe de Seguimiento Logopédico", 1)}
  ${para("Atención Temprana")}
  ${heading("Datos del paciente", 2)}
  ${bold("Paciente: ", paciente.nombre)}
  ${paciente.fechaNac ? bold("Fecha de nacimiento: ", fmtFecha(paciente.fechaNac)) : ""}
  ${bold("Total evaluaciones: ", String(evals.length))}
  ${bold("Informe generado: ", fmtFecha(new Date().toISOString()))}
  ${paciente.observaciones ? bold("Observaciones: ", paciente.observaciones) : ""}
  ${ultima ? heading("Perfil comunicativo actual", 2) + bold("Última evaluación: ", `${fmtFecha(ultima.fecha)} · ${FRANJAS.find(f=>f.id===ultima.franja)?.label.replace(" m"," meses")}`) + perfilTable : ""}
  ${heading("Historial de evaluaciones", 2)}
  ${historialXml || para("Sin evaluaciones registradas.")}
  ${para(`Generado con HelenLog · ${new Date().toLocaleDateString("es-ES")}`)}
</w:body></w:document>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const zip = new JSZip();
  zip.file("[Content_Types].xml", contentTypesXml);
  zip.folder("_rels").file(".rels", relsXml);
  const word = zip.folder("word");
  word.file("document.xml", documentXml);
  word.folder("_rels").file("document.xml.rels", wordRelsXml);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombreArchivo(paciente, "docx"); a.click();
  URL.revokeObjectURL(url);
}

// ── GENERAR HTML DEL INFORME ──────────────────────────────────────────────
function generarInformeHTML(paciente) {
  const evals = paciente.evaluaciones || [];
  const ultima = evals[evals.length - 1];

  const perfilHtml = ultima ? AREAS.map(a => {
    const pct = ultima.perfil[a] || 0;
    return `<tr>
      <td>${AREA_META[a].icon} ${AREA_META[a].full}</td>
      <td><div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${AREA_META[a].color}"></div></div></td>
      <td><strong>${pct}%</strong></td>
    </tr>`;
  }).join("") : "";

  const historialHtml = evals.map((ev, i) => {
    const franjaLabel = FRANJAS.find(f=>f.id===ev.franja)?.label.replace(" m"," meses") || ev.franja;
    return `
    <div class="eval-block">
      <h3>Evaluación ${i+1} — ${fmtFecha(ev.fecha)} · ${franjaLabel}</h3>
      ${ev.notas ? `<p class="notas">${ev.notas}</p>` : ""}
      <table>
        ${AREAS.map(a => {
          const hitos = HITOS[ev.franja][a] || [];
          const logrados = hitos.filter((_,idx) => ev.checks?.[a]?.[idx]).length;
          return `<tr>
            <td class="area-cell">${AREA_META[a].icon} <strong>${AREA_META[a].label}</strong><br><small>${logrados}/${hitos.length}</small></td>
            <td><ul>${hitos.map((h,idx) => `<li class="${ev.checks?.[a]?.[idx]?'ok':'no'}">${ev.checks?.[a]?.[idx]?'✓':'○'} ${h}</li>`).join("")}</ul></td>
          </tr>`;
        }).join("")}
      </table>
    </div>`;
  }).join("<hr>");

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>HelenLog · ${paciente.nombre}</title>
  <style>
    body{font-family:Georgia,serif;max-width:820px;margin:20px auto;color:#222;line-height:1.6;padding:0 16px}
    h1{color:#2d6a6a;margin-bottom:2px} h2{color:#2d6a6a;border-bottom:2px solid #4ECDC4;padding-bottom:5px;margin-top:28px}
    h3{color:#2d6a6a;margin:0 0 8px}
    .meta{background:#f0fafa;padding:14px 18px;border-radius:8px;margin:14px 0 24px;font-size:14px}
    .meta p{margin:4px 0}
    table{width:100%;border-collapse:collapse;margin-bottom:12px}
    td{padding:7px 10px;vertical-align:top;border-bottom:1px solid #e8f0f0}
    .area-cell{width:140px;font-size:13px}
    ul{margin:0;padding-left:16px} li{margin-bottom:3px;font-size:13px}
    li.ok{color:#2d6a6a} li.no{color:#bbb}
    .bar-bg{background:#e0eded;border-radius:4px;height:12px;width:160px;overflow:hidden;display:inline-block}
    .bar-fill{height:100%;border-radius:4px}
    .eval-block{margin-bottom:24px}
    .notas{background:#f0fafa;padding:8px 12px;border-radius:6px;font-style:italic;margin-bottom:10px}
    hr{border:none;border-top:1px solid #ddd;margin:20px 0}
    @media print{body{margin:10px}}
  </style></head><body>
  <h1>🗣️ HelenLog</h1>
  <p style="color:#888;font-size:13px;margin:0 0 16px">Informe de Seguimiento Logopédico · Atención Temprana</p>
  <div class="meta">
    <p><strong>Paciente:</strong> ${paciente.nombre}</p>
    ${paciente.fechaNac ? `<p><strong>F. nacimiento:</strong> ${fmtFecha(paciente.fechaNac)}</p>` : ""}
    <p><strong>Evaluaciones:</strong> ${evals.length}</p>
    <p><strong>Generado:</strong> ${fmtFecha(new Date().toISOString())}</p>
    ${paciente.observaciones ? `<p><strong>Observaciones:</strong> ${paciente.observaciones}</p>` : ""}
  </div>
  ${ultima ? `<h2>Perfil comunicativo actual</h2>
  <p style="color:#888;font-size:13px">${fmtFecha(ultima.fecha)} · ${FRANJAS.find(f=>f.id===ultima.franja)?.label.replace(" m"," meses")}</p>
  <table>${perfilHtml}</table>` : ""}
  <h2>Historial de evaluaciones</h2>
  ${historialHtml || "<p style='color:#aaa'>Sin evaluaciones registradas.</p>"}
  <p style="color:#bbb;font-size:11px;margin-top:32px;border-top:1px solid #eee;padding-top:10px">
    Generado con HelenLog · ${new Date().toLocaleDateString("es-ES")}
  </p>
  </body></html>`;
}

// ══════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [store, setStore] = useState(loadStore);
  const [vista, setVista] = useState("lista");
  const [pidActivo, setPidActivo] = useState(null);
  const [evalIdx, setEvalIdx] = useState(null);
  const [franjaEval, setFranjaEval] = useState("12-18");
  const [checks, setChecks] = useState({});
  const [notas, setNotas] = useState("");
  const [areaTab, setAreaTab] = useState("preverbal");
  const [formNuevo, setFormNuevo] = useState({ nombre: "", fechaNac: "", observaciones: "" });
  const [busqueda, setBusqueda] = useState("");
  const [exportMenu, setExportMenu] = useState(false);
  const [informeHTML, setInformeHTML] = useState("");

  useEffect(() => { saveStore(store); }, [store]);

  const paciente = store.pacientes.find(p => p.id === pidActivo);
  const pacientesFiltrados = store.pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  function guardarEval() {
    const hoy = new Date().toISOString().split("T")[0];
    const ev = {
      id: Date.now(),
      fecha: hoy,
      franja: franjaEval,
      checks,
      notas,
      perfil: calcularPerfil(checks, franjaEval),
    };
    setStore(prev => ({
      pacientes: prev.pacientes.map(p => {
        if (p.id !== pidActivo) return p;
        const evs = evalIdx !== null
          ? p.evaluaciones.map((e, i) => i === evalIdx ? ev : e)
          : [...(p.evaluaciones || []), ev];
        return { ...p, evaluaciones: evs };
      })
    }));
    setVista("paciente");
    setEvalIdx(null); setChecks({}); setNotas("");
  }

  function abrirEval(idx = null) {
    if (idx !== null) {
      const ev = paciente.evaluaciones[idx];
      setFranjaEval(ev.franja);
      setChecks(ev.checks || {});
      setNotas(ev.notas || "");
      setEvalIdx(idx);
    } else {
      // Autodetectar franja por edad
      if (paciente?.fechaNac) {
        const meses = Math.floor((Date.now() - new Date(paciente.fechaNac)) / (1000*60*60*24*30.44));
        if (meses <= 6) setFranjaEval("0-6");
        else if (meses <= 12) setFranjaEval("6-12");
        else if (meses <= 18) setFranjaEval("12-18");
        else if (meses <= 24) setFranjaEval("18-24");
        else if (meses <= 36) setFranjaEval("24-36");
        else setFranjaEval("36-48");
      } else {
        setFranjaEval("12-18");
      }
      setChecks({}); setNotas(""); setEvalIdx(null);
    }
    setAreaTab("preverbal");
    setVista("evaluacion");
  }

  function toggleCheck(area, i) {
    setChecks(prev => {
      const arr = [...(prev[area] || [])];
      arr[i] = !arr[i];
      return { ...prev, [area]: arr };
    });
  }

  function crearPaciente() {
    if (!formNuevo.nombre.trim()) return;
    const p = { id: Date.now(), ...formNuevo, nombre: formNuevo.nombre.trim(), evaluaciones: [] };
    setStore(prev => ({ pacientes: [...prev.pacientes, p] }));
    setPidActivo(p.id);
    setFormNuevo({ nombre: "", fechaNac: "", observaciones: "" });
    setVista("paciente");
  }

  function eliminarPaciente(id) {
    if (!confirm("¿Eliminar este paciente y todas sus evaluaciones? Esta acción no se puede deshacer.")) return;
    setStore(prev => ({ pacientes: prev.pacientes.filter(p => p.id !== id) }));
    setVista("lista");
  }

  function eliminarEval(i) {
    if (!confirm("¿Eliminar esta evaluación?")) return;
    setStore(prev => ({
      pacientes: prev.pacientes.map(p =>
        p.id !== pidActivo ? p : { ...p, evaluaciones: p.evaluaciones.filter((_, idx) => idx !== i) }
      )
    }));
  }

  // ── ESTILOS ──────────────────────────────────────────────────────────────
  const S = {
    app: {
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #0a1628 0%, #112233 60%, #0d1f2d 100%)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: "#e2eff0",
      paddingBottom: 80,
      maxWidth: 680,
      margin: "0 auto",
    },
    header: {
      background: "rgba(10,22,40,0.95)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(78,205,196,0.15)",
      padding: "14px 20px",
      paddingTop: "calc(24px + env(safe-area-inset-top))",
      display: "flex", alignItems: "center", gap: 10,
      position: "sticky", top: 0, zIndex: 100,
    },
    logo: { fontWeight: 800, fontSize: 20, color: "#4ECDC4", letterSpacing: "-0.3px" },
    sub:  { fontSize: 11, color: "rgba(78,205,196,0.55)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" },
    body: { padding: "20px 16px" },
    card: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "16px 18px", marginBottom: 10,
      cursor: "pointer", transition: "background 0.18s, border-color 0.18s",
    },
    btn: (bg = "#4ECDC4", col = "#0a1628") => ({
      background: bg, color: col, border: "none",
      borderRadius: 10, padding: "11px 22px",
      fontWeight: 700, fontSize: 14, cursor: "pointer",
      fontFamily: "inherit", transition: "opacity 0.15s",
    }),
    btnGhost: {
      background: "transparent", color: "#4ECDC4",
      border: "1px solid rgba(78,205,196,0.3)",
      borderRadius: 10, padding: "8px 16px",
      fontWeight: 600, fontSize: 13, cursor: "pointer",
      fontFamily: "inherit",
    },
    input: {
      width: "100%", background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
      padding: "11px 14px", color: "#e2eff0", fontSize: 14,
      outline: "none", fontFamily: "inherit", boxSizing: "border-box",
    },
    label: { fontSize: 11, fontWeight: 700, color: "rgba(78,205,196,0.7)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6, display: "block" },
    pill: (active, color = "#4ECDC4") => ({
      padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      cursor: "pointer", border: "none", fontFamily: "inherit",
      background: active ? color : "rgba(255,255,255,0.07)",
      color: active ? "#0a1628" : "rgba(255,255,255,0.45)",
      transition: "all 0.15s",
    }),
  };

  // ════════════════════════════════════════════════════════════════════════
  // LISTA PACIENTES
  // ════════════════════════════════════════════════════════════════════════
  if (vista === "lista") return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={{ flex: 1 }}>
          <div style={S.logo}>🗣️ HelenLog</div>
          <div style={S.sub}>Atención Temprana</div>
        </div>
        <button style={S.btn()} onClick={() => setVista("nuevo")}>+ Paciente</button>
      </div>
      <div style={S.body}>
        {/* Buscador */}
        {store.pacientes.length > 3 && (
          <input style={{ ...S.input, marginBottom: 16 }}
            placeholder="🔍  Buscar paciente..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Pacientes", val: store.pacientes.length },
            { label: "Evaluaciones", val: store.pacientes.reduce((a,p) => a+(p.evaluaciones?.length||0),0) },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: "rgba(78,205,196,0.08)", border: "1px solid rgba(78,205,196,0.15)", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#4ECDC4" }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pacientes */}
        {pacientesFiltrados.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "rgba(255,255,255,0.25)" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>👶</div>
            <p>{busqueda ? "Sin resultados" : "Crea tu primer paciente para comenzar"}</p>
          </div>
        )}
        {pacientesFiltrados.map(p => {
          const n = p.evaluaciones?.length || 0;
          const ult = p.evaluaciones?.[n-1];
          return (
            <div key={p.id} style={S.card}
              onClick={() => { setPidActivo(p.id); setVista("paciente"); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.nombre}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 3 }}>
                    {p.fechaNac ? calcEdad(p.fechaNac) : "Sin F. nac."}
                    {ult ? ` · ${fmtFecha(ult.fecha)}` : ""}
                  </div>
                </div>
                <div style={{
                  background: n > 0 ? "rgba(78,205,196,0.12)" : "rgba(255,255,255,0.05)",
                  color: n > 0 ? "#4ECDC4" : "rgba(255,255,255,0.25)",
                  borderRadius: 8, padding: "3px 9px", fontSize: 12, fontWeight: 700,
                }}>{n} {n===1?"eval":"evals"}</div>
              </div>
              {ult && (
                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {AREAS.map(a => (
                    <span key={a} style={{ fontSize: 11, color: AREA_META[a].color }}>
                      {AREA_META[a].icon} {ult.perfil[a]}%
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // NUEVO PACIENTE
  // ════════════════════════════════════════════════════════════════════════
  if (vista === "nuevo") return (
    <div style={S.app}>
      <div style={S.header}>
        <button style={S.btnGhost} onClick={() => setVista("lista")}>← Volver</button>
        <div style={{ marginLeft: 12, ...S.logo, fontSize: 16 }}>Nuevo paciente</div>
      </div>
      <div style={S.body}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 500 }}>
          <div>
            <label style={S.label}>Nombre completo *</label>
            <input style={S.input} placeholder="Ej. Lucía García"
              value={formNuevo.nombre} onChange={e => setFormNuevo(p => ({...p, nombre: e.target.value}))} />
          </div>
          <div>
            <label style={S.label}>Fecha de nacimiento</label>
            <input style={S.input} type="date"
              value={formNuevo.fechaNac} onChange={e => setFormNuevo(p => ({...p, fechaNac: e.target.value}))} />
          </div>
          <div>
            <label style={S.label}>Observaciones iniciales</label>
            <textarea style={{ ...S.input, minHeight: 90, resize: "vertical" }}
              placeholder="Motivo de derivación, antecedentes..."
              value={formNuevo.observaciones} onChange={e => setFormNuevo(p => ({...p, observaciones: e.target.value}))} />
          </div>
          <button style={{ ...S.btn(), padding: "13px" }} onClick={crearPaciente}
            disabled={!formNuevo.nombre.trim()}>
            Crear paciente
          </button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // FICHA PACIENTE
  // ════════════════════════════════════════════════════════════════════════
  if (vista === "paciente" && paciente) {
    const evals = paciente.evaluaciones || [];
    const ult = evals[evals.length - 1];
    const penult = evals.length >= 2 ? evals[evals.length - 2] : null;

    return (
      <div style={S.app}>
        <div style={S.header}>
          <button style={S.btnGhost} onClick={() => setVista("lista")}>←</button>
          <div style={{ flex: 1, marginLeft: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{paciente.nombre}</div>
            <div style={S.sub}>{paciente.fechaNac ? calcEdad(paciente.fechaNac) : "Edad no registrada"}</div>
          </div>
          <div style={{ position: "relative" }}>
            <button style={S.btnGhost} onClick={() => setExportMenu(v => !v)}>⬇ Informe ▾</button>
            {exportMenu && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 200,
                background: "#112233", border: "1px solid rgba(78,205,196,0.25)",
                borderRadius: 10, overflow: "hidden", minWidth: 160,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}>
                {[
                  { label: "📄 Ver / Imprimir (iOS + PC)", fn: () => { setInformeHTML(generarInformeHTML(paciente)); setVista("informe"); setExportMenu(false); } },
                  { label: "📝 Word (.docx)", fn: () => { exportarDOCX(paciente); setExportMenu(false); } },
                  { label: "📋 OpenOffice (.odt)", fn: () => { exportarODT(paciente); setExportMenu(false); } },
                ].map(opt => (
                  <button key={opt.label} onClick={opt.fn} style={{
                    display: "block", width: "100%", textAlign: "left",
                    background: "transparent", border: "none", color: "#e2eff0",
                    padding: "11px 16px", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}>{opt.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={S.body}>
          {/* Perfil radar */}
          {ult && (
            <div style={{ ...S.card, cursor: "default", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(78,205,196,0.8)", marginBottom: 4 }}>
                Perfil comunicativo
              </div>
              {/* Leyenda */}
              <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                  <div style={{ width: 20, height: 3, background: "#4ECDC4", borderRadius: 2 }}/>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Actual · {fmtFecha(ult.fecha)}</span>
                </div>
                {penult && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                    <div style={{ width: 20, height: 3, background: "#FFA550", borderRadius: 2, borderTop: "2px dashed #FFA550" }}/>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>Anterior · {fmtFecha(penult.fecha)}</span>
                  </div>
                )}
              </div>
              <RadarChart perfil={ult.perfil} perfilAnterior={penult?.perfil || null} />
              {/* Barras comparativas */}
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {AREAS.map(a => {
                  const actual = ult.perfil[a] || 0;
                  const anterior = penult?.perfil[a] ?? null;
                  const diff = anterior !== null ? actual - anterior : null;
                  return (
                    <div key={a}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span>{AREA_META[a].icon} {AREA_META[a].full}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {diff !== null && (
                            <span style={{
                              fontSize: 11, fontWeight: 700,
                              color: diff > 0 ? "#4ECDC4" : diff < 0 ? "#ff8080" : "rgba(255,255,255,0.3)"
                            }}>
                              {diff > 0 ? `▲ +${diff}%` : diff < 0 ? `▼ ${diff}%` : "= sin cambio"}
                            </span>
                          )}
                          <span style={{ fontWeight: 700, color: AREA_META[a].color }}>{actual}%</span>
                        </span>
                      </div>
                      {/* Barra anterior (gris) */}
                      {anterior !== null && (
                        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, height: 5, overflow: "hidden", marginBottom: 2 }}>
                          <div style={{ width: `${anterior}%`, height: "100%", background: "#FFA550", borderRadius: 6, opacity: 0.5 }}/>
                        </div>
                      )}
                      {/* Barra actual */}
                      <Barra pct={actual} color={AREA_META[a].color} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button style={{ ...S.btn(), width: "100%", padding: 14, marginBottom: 20 }} onClick={() => abrirEval(null)}>
            + Nueva evaluación
          </button>

          {evals.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>
                Historial
              </div>
              {[...evals].map((ev, i) => {
                const ri = evals.length - 1 - i;
                const evRev = evals[evals.length-1-i];
                return (
                  <div key={evRev.id} style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div onClick={() => abrirEval(evals.length-1-i)} style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>Evaluación {evals.length-i}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>
                          {fmtFecha(evRev.fecha)} · {FRANJAS.find(f=>f.id===evRev.franja)?.label}
                        </div>
                      </div>
                      <button style={{ ...S.btnGhost, padding: "4px 10px", fontSize: 12 }}
                        onClick={e => { e.stopPropagation(); eliminarEval(evals.length-1-i); }}>✕</button>
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}
                      onClick={() => abrirEval(evals.length-1-i)}>
                      {AREAS.map(a => (
                        <span key={a} style={{ fontSize: 11 }}>
                          <span style={{ color: AREA_META[a].color }}>{evRev.perfil[a]}%</span>
                          <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: 3 }}>{AREA_META[a].icon}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {paciente.observaciones && (
            <div style={{ ...S.card, cursor: "default", marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>OBSERVACIONES</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{paciente.observaciones}</div>
            </div>
          )}

          <button style={{ ...S.btn("rgba(255,70,70,0.12)", "#ff8080"), width: "100%", padding: 12, marginTop: 16, border: "1px solid rgba(255,70,70,0.2)", borderRadius: 10 }}
            onClick={() => eliminarPaciente(paciente.id)}>
            Eliminar paciente
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // EVALUACIÓN
  // ════════════════════════════════════════════════════════════════════════
  if (vista === "evaluacion") {
    const hitosActuales = HITOS[franjaEval][areaTab] || [];
    const logA = hitosActuales.filter((_,i) => checks[areaTab]?.[i]).length;
    const totalG = AREAS.reduce((a,ar) => a+(HITOS[franjaEval][ar]?.length||0), 0);
    const logG = AREAS.reduce((a,ar) => a+(HITOS[franjaEval][ar]?.filter((_,i) => checks[ar]?.[i]).length||0), 0);
    const pctG = totalG > 0 ? Math.round((logG/totalG)*100) : 0;

    return (
      <div style={S.app}>
        <div style={S.header}>
          <button style={S.btnGhost} onClick={() => { setVista("paciente"); setChecks({}); }}>← Cancelar</button>
          <div style={{ flex: 1, marginLeft: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{paciente?.nombre}</div>
            <div style={S.sub}>{evalIdx !== null ? "Editando" : "Nueva evaluación"}</div>
          </div>
          <div style={{ fontWeight: 800, fontSize: 20, color: "#4ECDC4" }}>{pctG}%</div>
        </div>

        <div style={S.body}>
          {/* Franja */}
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Franja de edad</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FRANJAS.map(f => (
                <button key={f.id} style={S.pill(franjaEval===f.id)}
                  onClick={() => { setFranjaEval(f.id); setChecks({}); }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progreso global */}
          <div style={{ marginBottom: 14 }}>
            <Barra pct={pctG} color="#4ECDC4" />
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
              {logG}/{totalG} hitos logrados
            </div>
          </div>

          {/* Tabs área */}
          <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
            {AREAS.map(a => {
              const tot = HITOS[franjaEval][a]?.length || 0;
              const log = HITOS[franjaEval][a]?.filter((_,i) => checks[a]?.[i]).length || 0;
              return (
                <button key={a} style={S.pill(areaTab===a, AREA_META[a].color)}
                  onClick={() => setAreaTab(a)}>
                  {AREA_META[a].icon} {log}/{tot}
                </button>
              );
            })}
          </div>

          {/* Área title */}
          <div style={{ fontSize: 13, fontWeight: 700, color: AREA_META[areaTab].color, marginBottom: 10 }}>
            {AREA_META[areaTab].full} — {logA}/{hitosActuales.length}
          </div>

          {/* Hitos */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20 }}>
            {hitosActuales.map((hito, i) => {
              const checked = checks[areaTab]?.[i] || false;
              const color = AREA_META[areaTab].color;
              return (
                <div key={i} onClick={() => toggleCheck(areaTab, i)} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  background: checked ? `${color}14` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${checked ? color+"44" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 11, padding: "12px 14px", cursor: "pointer", transition: "all 0.15s",
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    background: checked ? color : "rgba(255,255,255,0.08)",
                    border: `2px solid ${checked ? color : "rgba(255,255,255,0.15)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: "#0a1628", fontWeight: 900, transition: "all 0.15s",
                  }}>{checked ? "✓" : ""}</div>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: checked ? "#e2eff0" : "rgba(255,255,255,0.45)" }}>
                    {hito}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Notas */}
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Notas clínicas</label>
            <textarea style={{ ...S.input, minHeight: 80, resize: "vertical" }}
              placeholder="Observaciones de sesión, comportamiento, contexto..."
              value={notas} onChange={e => setNotas(e.target.value)} />
          </div>

          <button style={{ ...S.btn(), width: "100%", padding: 14, fontSize: 15 }} onClick={guardarEval}>
            {evalIdx !== null ? "Actualizar evaluación" : "Guardar evaluación"}
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // VISTA INFORME (dentro de la app, iOS friendly)
  // ════════════════════════════════════════════════════════════════════════
  if (vista === "informe") {
    return (
      <div style={{ ...S.app, paddingBottom: 0 }}>
        {/* Barra superior fija con safe area iOS */}
        <div style={{
          ...S.header,
          display: "flex", alignItems: "center", gap: 10,
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          paddingTop: "calc(24px + env(safe-area-inset-top))",
        }}>
          <button style={S.btnGhost} onClick={() => setVista("paciente")}>← Volver</button>
          <div style={{ flex: 1, ...S.logo, fontSize: 15 }}>Informe · {paciente?.nombre}</div>
          <button style={S.btn()} onClick={() => window.print()}>🖨️ Imprimir / PDF</button>
        </div>

        {/* Iframe con el informe HTML */}
        <iframe
          srcDoc={informeHTML}
          style={{
            width: "100%",
            height: "100dvh",
            border: "none",
            paddingTop: "calc(60px + env(safe-area-inset-top))",
            boxSizing: "border-box",
            background: "#fff",
          }}
          title="Informe HelenLog"
        />
      </div>
    );
  }

  return null;
}
