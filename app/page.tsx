"use client";

import { ChangeEvent, useMemo, useState } from "react";

type Item = { id: number; area: string; description: string; amount: number };
type Include = { id: number; title: string; description: string };

const admiraGreen = "#689F3A";
const defaultItems: Item[] = [
  { id: 1, area: "Producción y coordinación", description: "Planificación, gestión y seguimiento integral", amount: 0 },
  { id: 2, area: "Equipo técnico especializado", description: "Preparación, operación y soporte", amount: 0 },
  { id: 3, area: "Logística y transporte", description: "Desplazamientos, material y montaje", amount: 0 },
];
const defaultIncludes: Include[] = [
  { id: 1, title: "Concepto y puesta en escena", description: "Definición creativa, adaptación visual y preparación de la experiencia." },
  { id: 2, title: "Equipo especializado", description: "Coordinación, pruebas, puesta en marcha y acompañamiento operativo." },
  { id: 3, title: "Operación y soporte", description: "Recursos técnicos y medidas necesarias para una ejecución segura y fluida." },
  { id: 4, title: "Logística y cobertura", description: "Traslados, materiales, producción y coberturas asociadas al servicio." },
];

const money = (value: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value || 0);

function spreadsheetNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  let text = value.trim().replace(/\u00a0/g, " ").replace(/[€$£\s]/g, "");
  if (!text || !/\d/.test(text)) return null;
  const negative = /^\(.*\)$/.test(text) || text.startsWith("-");
  text = text.replace(/[()\-+]/g, "").replace(/[^\d.,]/g, "");
  if (text.includes(",") && text.includes(".")) {
    text = text.lastIndexOf(",") > text.lastIndexOf(".") ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  } else if (text.includes(",")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, "");
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? (negative ? -parsed : parsed) : null;
}

function rowText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function spreadsheetPercent(text: string): number | null {
  const match = text.match(/(-?\d+(?:[.,]\d+)?)\s*%/);
  if (!match) return null;
  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState(false);
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [subtitle, setSubtitle] = useState("Una propuesta diseñada para convertir una idea en un momento memorable.");
  const [location, setLocation] = useState("");
  const [dates, setDates] = useState("");
  const [format, setFormat] = useState("");
  const [audience, setAudience] = useState("");
  const [summary, setSummary] = useState("En Admira diseñamos experiencias que combinan estrategia, creatividad y una ejecución impecable. Esta propuesta reúne todos los recursos necesarios para dar forma a una activación relevante, segura y alineada con la marca.");
  const [aiBrief, setAiBrief] = useState("");
  const [aiInstruction, setAiInstruction] = useState("");
  const [experience, setExperience] = useState("");
  const [aiStatus, setAiStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [closing, setClosing] = useState("Una propuesta integral para transformar la idea en una experiencia relevante y bien ejecutada.");
  const [includes, setIncludes] = useState(defaultIncludes);
  const [items, setItems] = useState(defaultItems);
  const [notes, setNotes] = useState("La propuesta contempla una fase previa de coordinación y validación antes de la ejecución.\nLos importes se mantendrán vigentes durante 30 días.");
  const [vat, setVat] = useState(21);
  const [showContingency, setShowContingency] = useState(true);
  const [contingency, setContingency] = useState(8);
  const [contingencyTarget, setContingencyTarget] = useState("auto");
  const [primary, setPrimary] = useState(admiraGreen);
  const [secondary, setSecondary] = useState("#18324A");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("/admira-logo.png");
  const [logoName, setLogoName] = useState("Logo Admira (predeterminado)");
  const [excelName, setExcelName] = useState("");
  const [excelStatus, setExcelStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [brandStatus, setBrandStatus] = useState("");

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.amount || 0), 0), [items]);
  const contingencyAmount = subtotal * (contingency / 100);
  const base = subtotal + contingencyAmount;
  const total = base * (1 + vat / 100);
  const clientLabel = client.trim() || "Nombre del cliente";
  const projectLabel = project.trim() || "Título del proyecto";
  const locationLabel = location.trim() || "Ubicación por definir";
  const datesLabel = dates.trim() || "Fechas por definir";
  const formatLabel = format.trim() || "Formato por definir";
  const audienceLabel = audience.trim() || "Público por definir";
  const contingencyLabel = contingency <= 0 ? "sin contingencia" : showContingency ? "contingencia visible" : "contingencia integrada";
  const hiddenTargetId = useMemo(() => {
    if (contingencyTarget !== "auto") return Number(contingencyTarget);
    return [...items].sort((a, b) => b.amount - a.amount)[0]?.id;
  }, [items, contingencyTarget]);

  const visibleItems = items.map((item) => ({
    ...item,
    amount: !showContingency && item.id === hiddenTargetId ? item.amount + contingencyAmount : item.amount,
  }));

  const onLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogo(URL.createObjectURL(file));
    setLogoName(file.name);
  };

  const importBudget = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setExcelName(file.name);
    setExcelStatus(null);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellFormula: true, cellText: true });
      const sheets = workbook.SheetNames.map((name) => ({
        name,
        rows: XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, defval: "", raw: false, blankrows: false }),
      })).sort((a, b) => b.rows.filter((row) => row.some((cell) => String(cell).trim())).length - a.rows.filter((row) => row.some((cell) => String(cell).trim())).length);
      const selected = sheets[0];
      if (!selected?.rows.length) throw new Error("empty");

      const amountHeaderPattern = /^(importe|importe total|precio total|coste total|total partida|pvp)$/i;
      const categoryHeaderPattern = /[áa]rea|categor[ií]a|secci[oó]n|grupo|familia|cap[ií]tulo|partida|concepto|servicio|descripci[oó]n|detalle/i;
      const strictHeaderIndex = selected.rows.slice(0, 40).findIndex((row) =>
        row.some((cell) => amountHeaderPattern.test(rowText(cell))) && row.some((cell) => categoryHeaderPattern.test(rowText(cell)))
      );
      const headerIndex = strictHeaderIndex >= 0 ? strictHeaderIndex : selected.rows.slice(0, 40).findIndex((row) => row.some((cell) => amountHeaderPattern.test(rowText(cell))));
      const header = headerIndex >= 0 ? selected.rows[headerIndex] : [];
      const amountColumn = header.findIndex((cell) => amountHeaderPattern.test(rowText(cell)));
      const areaColumn = header.findIndex((cell) => /[áa]rea|categor[ií]a|secci[oó]n|grupo|familia|cap[ií]tulo|partida|concepto|servicio|descripci[oó]n|detalle/i.test(rowText(cell)));
      const descriptionColumn = header.findIndex((cell) => /descripci[oó]n|detalle|alcance/i.test(rowText(cell)));
      const dataRows = selected.rows.slice(headerIndex >= 0 ? headerIndex + 1 : 0);
      const parsed: Item[] = [];
      let detectedContingencyPercent: number | null = null;
      let detectedContingencyAmount: number | null = null;
      let detectedVat: number | null = null;
      let detectedBaseAmount: number | null = null;
      let detectedGrandTotal: number | null = null;

      dataRows.forEach((row, index) => {
        const textCells = row.map(rowText);
        const combined = textCells.filter(Boolean).join(" ");
        if (!combined) return;
        const preferredAmount = amountColumn >= 0 ? spreadsheetNumber(row[amountColumn]) : null;
        const amount = amountColumn >= 0 ? preferredAmount : ([...row].reverse().map(spreadsheetNumber).find((value) => value !== null) ?? null);
        const area = areaColumn >= 0 ? textCells[areaColumn] : (textCells.find((cell) => cell && !/^-?[\d.,\s€$£]+$/.test(cell)) || "");
        const description = (descriptionColumn >= 0 ? textCells[descriptionColumn] : "") || textCells.find((cell) => cell && cell !== area && !/^-?[\d.,\s€$£]+$/.test(cell)) || "";
        const explicitPercent = spreadsheetPercent(combined);
        if (/contingencia|imprevistos?|reserva de riesgo/i.test(combined)) {
          if (explicitPercent !== null) detectedContingencyPercent = explicitPercent;
          if (preferredAmount !== null) detectedContingencyAmount = preferredAmount;
          return;
        }
        if (/\biva\b|impuesto sobre el valor añadido/i.test(combined)) {
          if (explicitPercent !== null) detectedVat = explicitPercent;
          return;
        }
        if (/base imponible/i.test(combined) && amount !== null) {
          detectedBaseAmount = amount;
          return;
        }
        if (/total (propuesta|presupuesto|general|final)|importe total/i.test(combined) && amount !== null) {
          detectedGrandTotal = amount;
          return;
        }
        const isSummary = /^(subtotal|total|base imponible|iva|impuesto|contingencia|beneficio|margen|descuento|ajuste)(\b|\s)/i.test(area);
        if (amount !== null && area && !isSummary) {
          parsed.push({ id: Date.now() + index, area, description, amount });
        } else if (amount === null && combined && parsed.length && !/total|base imponible|iva/i.test(combined)) {
          const previous = parsed[parsed.length - 1];
          if (combined !== previous.area && combined.length < 240) previous.description = [previous.description, combined].filter(Boolean).join(" · ");
        }
      });

      if (!parsed.length) throw new Error("no-items");
      let importedSubtotal = parsed.reduce((sum, item) => sum + item.amount, 0);
      const detectedContingency = detectedContingencyPercent ?? (detectedContingencyAmount !== null && importedSubtotal !== 0 ? (detectedContingencyAmount / importedSubtotal) * 100 : 0);
      const targetSubtotal = detectedBaseAmount !== null
        ? (detectedContingencyAmount !== null ? detectedBaseAmount - detectedContingencyAmount : detectedBaseAmount / (1 + Math.max(0, detectedContingency) / 100))
        : null;
      const reconciliation = targetSubtotal !== null ? targetSubtotal - importedSubtotal : 0;
      if (Math.abs(reconciliation) > 0.02) {
        parsed.push({ id: Date.now() + dataRows.length + 1, area: "Otros conceptos y ajustes", description: "Conciliación automática con la base imponible indicada en el Excel", amount: Number(reconciliation.toFixed(2)) });
        importedSubtotal += reconciliation;
      }
      if (detectedVat === null && detectedBaseAmount && detectedGrandTotal && detectedGrandTotal > detectedBaseAmount) {
        detectedVat = Number((((detectedGrandTotal / detectedBaseAmount) - 1) * 100).toFixed(2));
      }
      setItems(parsed);
      setContingency(Number(Math.max(0, detectedContingency).toFixed(4)));
      setShowContingency(true);
      if (detectedVat !== null) setVat(detectedVat);
      const detectedDetails = [
        detectedContingency > 0 ? `contingencia ${Number(detectedContingency.toFixed(2))} %` : "sin contingencia",
        detectedVat !== null ? `IVA ${detectedVat} %` : null,
        Math.abs(reconciliation) > 0.02 ? "total conciliado con el Excel" : "total verificado",
      ].filter(Boolean).join(" · ");
      setExcelStatus({ kind: "success", message: `${parsed.length} partidas importadas desde “${selected.name}” · ${detectedDetails}. Los precios y totales ya se han recalculado.` });
    } catch {
      setExcelStatus({ kind: "error", message: "No encontramos filas con concepto e importe. Revisa que el Excel tenga una columna de partidas y otra de importes, o añádelas manualmente." });
    }
    event.target.value = "";
  };

  const extractBrand = async () => {
    if (!website) return;
    setBrandStatus("Analizando la marca…");
    try {
      const response = await fetch("/api/brand", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: website }) });
      const data = await response.json();
      if (data.colors?.[0]) setPrimary(data.colors[0]);
      if (data.colors?.[1]) setSecondary(data.colors[1]);
      setBrandStatus(data.colors?.length ? "Paleta detectada. Puedes ajustarla." : "No hemos detectado colores; elige los que prefieras.");
    } catch {
      setBrandStatus("No hemos podido leer esa web; puedes elegir los colores manualmente.");
    }
  };

  const updateItem = (id: number, field: keyof Item, value: string | number) => setItems(items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const updateInclude = (id: number, field: keyof Include, value: string) => setIncludes(includes.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const addItem = () => setItems([...items, { id: Date.now(), area: "Nueva área", description: "Descripción del servicio", amount: 0 }]);
  const addInclude = () => setIncludes([...includes, { id: Date.now(), title: "Nuevo bloque", description: "Explica qué incluye esta parte de la propuesta." }]);
  const applyWithAI = async () => {
    if (aiBrief.trim().length < 20 || aiLoading) return;
    setAiLoading(true);
    setAiStatus(null);
    try {
      const response = await fetch("/api/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: aiBrief,
          instruction: aiInstruction,
          context: { client, project, location, dates, format, audience },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo generar la propuesta.");
      setExperience(data.description);
      setIncludes(data.includes.map((item: Omit<Include, "id">, index: number) => ({ ...item, id: Date.now() + index })));
      if (data.closing) setClosing(data.closing);
      setAiStatus({ kind: "success", message: "La descripción y los bloques incluidos se han actualizado. Puedes editarlos antes de crear el presupuesto." });
    } catch (error) {
      setAiStatus({ kind: "error", message: error instanceof Error ? error.message : "No se pudo generar la propuesta. Inténtalo de nuevo." });
    } finally {
      setAiLoading(false);
    }
  };

  if (preview) {
    return (
      <main className="preview-shell" style={{ "--brand": primary, "--ink": secondary } as React.CSSProperties}>
        <div className="preview-toolbar no-print">
          <button className="button ghost" onClick={() => setPreview(false)}>← Volver a editar</button>
          <div><strong>Vista previa</strong><span> · 3 páginas</span></div>
          <button className="button primary" onClick={() => window.print()}>Descargar PDF</button>
        </div>
        <section className="proposal-page cover-page">
          <header className="proposal-header"><img src={logo} alt="Logo" /><span>PROPUESTA PARA {clientLabel.toUpperCase()}</span></header>
          <div className="cover-title"><p>PROPUESTA CREATIVA Y ECONÓMICA</p><h1>{projectLabel}</h1><h2>{clientLabel}</h2></div>
          <p className="lead">{subtitle}</p>
          <div className="fact-card two"><div><label>CLIENTE</label><strong>{clientLabel}</strong></div><div><label>UBICACIÓN</label><strong>{locationLabel}</strong></div></div>
          <div className="summary-card"><label>RESUMEN EJECUTIVO</label><p>{summary}</p></div>
          <div className="facts"><div><label>CALENDARIO</label><strong>{datesLabel}</strong></div><div><label>FORMATO</label><strong>{formatLabel}</strong></div><div><label>AUDIENCIA</label><strong>{audienceLabel}</strong></div></div>
          <div className="scope"><label>ALCANCE PRINCIPAL</label><p>{includes.map((item) => item.title).join(", ")}.</p><em>{closing}</em></div>
          <ProposalFooter project={projectLabel} page={1} />
        </section>

        <section className="proposal-page experience-page">
          <header className="section-kicker">LA EXPERIENCIA</header>
          <h2>Una propuesta pensada para hacerlo posible</h2>
          <p className="experience-copy">{experience}</p>
          <div className="facts three"><div><label>CALENDARIO</label><strong>{datesLabel}</strong></div><div><label>FORMATO</label><strong>{formatLabel}</strong></div><div><label>ENFOQUE</label><strong>A medida</strong></div></div>
          <h3>Qué incluye nuestra propuesta</h3>
          <div className="include-list">{includes.map((item) => <article key={item.id}><strong>{item.title}</strong><p>{item.description}</p></article>)}</div>
          <em className="closing-copy">{closing}</em>
          <ProposalFooter project={projectLabel} page={2} />
        </section>

        <section className="proposal-page investment-page">
          <header className="proposal-header"><img src={logo} alt="Logo" /><span>PROPUESTA PARA {clientLabel.toUpperCase()}</span></header>
          <p className="section-kicker">INVERSIÓN</p><h2>Presupuesto por áreas de servicio</h2>
          <div className="budget-table"><div className="budget-head"><span>ÁREA DE SERVICIO</span><span>IMPORTE</span></div>{visibleItems.map((item) => <div className="budget-row" key={item.id}><div><strong>{item.area}</strong><small>{item.description}</small></div><strong>{money(item.amount)}</strong></div>)}</div>
          <div className="totals">
            <div><span>Subtotal</span><strong>{money(showContingency ? subtotal : base)}</strong></div>
            {showContingency && contingency > 0 && <div><span>Contingencia ({contingency} %)</span><strong>{money(contingencyAmount)}</strong></div>}
            <div><span>Base imponible</span><strong>{money(base)}</strong></div>
            <div><span>IVA ({vat} %)</span><strong>{money(base * vat / 100)}</strong></div>
            <div className="grand-total"><span>TOTAL PROPUESTA</span><strong>{money(total)}</strong></div>
          </div>
          <h3>Consideraciones</h3><ul className="notes">{notes.split("\n").filter(Boolean).map((note) => <li key={note}>{note}</li>)}</ul>
          <p className="final-line">Una propuesta pensada para convertir una idea en un resultado memorable.</p>
          <ProposalFooter project={projectLabel} page={3} />
        </section>
      </main>
    );
  }

  const steps = ["Proyecto", "Marca", "Propuesta", "Inversión", "Revisión"];
  return (
    <main className="app-shell" style={{ "--brand": primary, "--ink": secondary } as React.CSSProperties}>
      <aside className="sidebar">
        <div className="brand"><img src="/admira-logo.png" alt="Admira" /><span>Presupuestos</span></div>
        <div className="progress-copy"><span>PASO {step + 1} DE 5</span><strong>{steps[step]}</strong></div>
        <nav>{steps.map((name, index) => <button key={name} className={index === step ? "active" : index < step ? "done" : ""} onClick={() => setStep(index)}><i>{index < step ? "✓" : index + 1}</i><span>{name}</span></button>)}</nav>
        <div className="sidebar-card"><span>Tu presupuesto</span><strong>{money(total)}</strong><small>IVA incluido</small></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div><span className="eyebrow">NUEVA PROPUESTA</span><h1>{steps[step]}</h1></div><button className="button ghost" onClick={() => setPreview(true)}>Vista previa <span>↗</span></button></header>
        <div className="form-card">
          {step === 0 && <>
            <Intro title="Empecemos por lo esencial" text="Estos datos darán forma a la portada y al contexto general de la propuesta." />
            <div className="form-grid two"><Field label="Empresa o cliente"><input placeholder="Ej. Nombre de la empresa" value={client} onChange={(e) => setClient(e.target.value)} /></Field><Field label="Nombre del proyecto"><input placeholder="Ej. Lanzamiento de producto" value={project} onChange={(e) => setProject(e.target.value)} /></Field></div>
            <Field label="Frase de apertura" hint="Una línea breve y atractiva para la portada"><textarea rows={2} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></Field>
            <div className="form-grid two"><Field label="Ubicación"><input placeholder="Ej. Madrid" value={location} onChange={(e) => setLocation(e.target.value)} /></Field><Field label="Fechas o calendario"><input placeholder="Ej. 15-17 de octubre" value={dates} onChange={(e) => setDates(e.target.value)} /></Field><Field label="Formato"><input placeholder="Ej. Evento presencial" value={format} onChange={(e) => setFormat(e.target.value)} /></Field><Field label="Público / audiencia"><input placeholder="Ej. Clientes y colaboradores" value={audience} onChange={(e) => setAudience(e.target.value)} /></Field></div>
            <Field label="Quiénes somos y resumen ejecutivo" hint="Aparecerá en la primera página"><textarea rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} /></Field>
          </>}

          {step === 1 && <>
            <Intro title="Haz que la propuesta se sienta suya" text="Partimos de la identidad de Admira y puedes incorporar la marca del cliente." />
            <div className="upload-zone"><div className="logo-preview"><img src={logo} alt="Logo seleccionado" /></div><div><strong>Logo de la empresa</strong><p>{logoName}</p><label className="button secondary">Cambiar logo<input hidden type="file" accept="image/*" onChange={onLogo} /></label></div></div>
            <Field label="Web de la empresa" hint="Intentaremos detectar automáticamente sus colores principales"><div className="input-action"><input type="url" placeholder="https://empresa.com" value={website} onChange={(e) => setWebsite(e.target.value)} /><button className="button secondary" onClick={extractBrand}>Extraer colores</button></div>{brandStatus && <small className="status">{brandStatus}</small>}</Field>
            <div className="palette-card"><div><span>COLOR PRINCIPAL</span><label className="color-field"><input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} /><input value={primary} onChange={(e) => setPrimary(e.target.value)} /></label></div><div><span>COLOR SECUNDARIO / TÍTULOS</span><label className="color-field"><input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} /><input value={secondary} onChange={(e) => setSecondary(e.target.value)} /></label></div><div className="palette-preview"><i style={{ background: primary }} /><i style={{ background: secondary }} /><i /></div></div>
          </>}

          {step === 2 && <>
            <Intro title="Cuenta exactamente qué vamos a hacer" text="Esta información construirá la segunda página de la propuesta." />
            <div className="ai-composer">
              <div className="ai-heading"><span>✦</span><div><strong>Redactar con IA</strong><p>Cuéntale todo como lo explicarías a otra persona. La IA lo convertirá en una propuesta profesional.</p></div></div>
              <Field label="¿Qué vamos a hacer?" hint="Incluye objetivos, dinámica, espacios, equipo, fases y cualquier detalle que no deba faltar">
                <textarea rows={7} maxLength={6000} placeholder="Ej. Vamos a preparar una activación para presentar el nuevo producto. Habrá una zona de demostración, personal de apoyo y una dinámica para que los asistentes puedan probarlo…" value={aiBrief} onChange={(e) => setAiBrief(e.target.value)} />
              </Field>
              <Field label="Orden adicional para la IA" hint="Opcional: indica el tono, la extensión o qué quieres destacar">
                <input maxLength={500} placeholder="Ej. Hazlo elegante, cercano y muy conciso" value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} />
              </Field>
              <div className="writing-tools"><span>La IA no debe inventar servicios, cifras, fechas ni compromisos que no hayas mencionado.</span><button type="button" className="improve-button" disabled={aiBrief.trim().length < 20 || aiLoading} onClick={applyWithAI}>{aiLoading ? "Generando…" : "✦ Aplicar con IA"}</button></div>
              {aiStatus && <div className={`ai-result ${aiStatus.kind}`}><strong>{aiStatus.kind === "success" ? "✓ Propuesta actualizada" : "No se pudo aplicar"}</strong><p>{aiStatus.message}</p></div>}
            </div>
            <Field label="Descripción final de la experiencia" hint="La IA la redactará aquí. Después puedes cambiar cualquier palabra">
              <textarea rows={7} placeholder="La descripción profesional aparecerá aquí…" value={experience} onChange={(e) => setExperience(e.target.value)} />
            </Field>
            <div className="section-title"><div><strong>Qué incluye nuestra propuesta</strong><span>Añade los bloques necesarios</span></div><button className="text-button" onClick={addInclude}>+ Añadir bloque</button></div>
            <div className="editable-list">{includes.map((item, index) => <article key={item.id}><span className="drag">{String(index + 1).padStart(2, "0")}</span><div><input value={item.title} onChange={(e) => updateInclude(item.id, "title", e.target.value)} /><textarea rows={2} value={item.description} onChange={(e) => updateInclude(item.id, "description", e.target.value)} /></div><button aria-label="Eliminar bloque" onClick={() => setIncludes(includes.filter((row) => row.id !== item.id))}>×</button></article>)}</div>
            <Field label="Frase de cierre"><textarea rows={2} value={closing} onChange={(e) => setClosing(e.target.value)} /></Field>
          </>}

          {step === 3 && <>
            <Intro title="Construye la inversión" text="Importa un Excel o introduce las partidas manualmente. El total se recalcula al instante." />
            <label className="excel-zone"><span className="file-icon">XLS</span><div><strong>Adjuntar presupuesto en Excel</strong><p>{excelName || "Detectaremos automáticamente la hoja y las columnas con partidas e importes"}</p></div><span className="button secondary">{excelName ? "Cambiar archivo" : "Seleccionar archivo"}</span><input hidden type="file" accept=".xlsx,.xls,.csv" onChange={importBudget} /></label>
            {excelStatus && <div className={`import-result ${excelStatus.kind}`}><span>{excelStatus.kind === "success" ? "✓" : "!"}</span><div><strong>{excelStatus.kind === "success" ? "Presupuesto actualizado" : "No se pudo importar"}</strong><p>{excelStatus.message}</p></div>{excelStatus.kind === "success" && <strong>{money(subtotal)}</strong>}</div>}
            <div className="section-title"><div><strong>Partidas del presupuesto</strong><span>{items.length} áreas · {money(subtotal)}</span></div><button className="text-button" onClick={addItem}>+ Añadir partida</button></div>
            <div className="budget-editor"><div className="editor-head"><span>ÁREA / DESCRIPCIÓN</span><span>IMPORTE</span><span /></div>{items.map((item) => <div className="editor-row" key={item.id}><div><input value={item.area} onChange={(e) => updateItem(item.id, "area", e.target.value)} /><input className="description" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} /></div><label><input type="number" value={item.amount} onChange={(e) => updateItem(item.id, "amount", Number(e.target.value))} /><span>€</span></label><button onClick={() => setItems(items.filter((row) => row.id !== item.id))}>×</button></div>)}</div>
            <div className="contingency-card"><div className="toggle-line"><div><strong>Mostrar contingencia en la propuesta</strong><span>Si se oculta, se integrará en otra partida sin alterar el total.</span></div><button className={`toggle ${showContingency ? "on" : ""}`} aria-pressed={showContingency} onClick={() => setShowContingency(!showContingency)}><i /></button></div><div className="form-grid two compact"><Field label="Porcentaje de contingencia"><label className="suffix"><input type="number" min="0" value={contingency} onChange={(e) => setContingency(Number(e.target.value))} /><span>%</span></label></Field>{!showContingency && <Field label="Integrar la contingencia en"><select value={contingencyTarget} onChange={(e) => setContingencyTarget(e.target.value)}><option value="auto">Área de mayor importe (automático)</option>{items.map((item) => <option key={item.id} value={item.id}>{item.area}</option>)}</select></Field>}</div>{!showContingency && <p className="privacy-note">La partida elegida aumentará {money(contingencyAmount)}. La tabla no mostrará una línea de contingencia.</p>}</div>
            <div className="form-grid two"><Field label="IVA"><label className="suffix"><input type="number" value={vat} onChange={(e) => setVat(Number(e.target.value))} /><span>%</span></label></Field><div className="total-card"><span>TOTAL PROPUESTA</span><strong>{money(total)}</strong><small>Base imponible {money(base)}</small></div></div>
          </>}

          {step === 4 && <>
            <Intro title="Todo listo para presentar" text="Revisa el contenido final y genera una propuesta de tres páginas lista para compartir." />
            <div className="review-hero"><div className="review-brand"><img src={logo} alt="Logo" /></div><div><span>PROPUESTA PARA {clientLabel.toUpperCase()}</span><h2>{projectLabel}</h2><p>{subtitle}</p></div></div>
            <div className="review-grid"><article><span>01</span><div><strong>Portada y resumen</strong><p>{clientLabel} · {locationLabel} · {datesLabel}</p></div><button onClick={() => setStep(0)}>Editar</button></article><article><span>02</span><div><strong>Experiencia y alcance</strong><p>{includes.length} bloques incluidos</p></div><button onClick={() => setStep(2)}>Editar</button></article><article><span>03</span><div><strong>Inversión</strong><p>{items.length} partidas · {contingencyLabel}</p></div><button onClick={() => setStep(3)}>Editar</button></article></div>
            <Field label="Consideraciones finales" hint="Una consideración por línea"><textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
            <div className="ready-card"><div><span className="ready-icon">✓</span><div><strong>Propuesta preparada</strong><p>El documento mantendrá los colores, el logo y el total que acabas de revisar.</p></div></div><button className="button primary large" onClick={() => setPreview(true)}>Crear presupuesto →</button></div>
          </>}
        </div>
        <footer className="form-actions"><button className="button ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>← Atrás</button>{step < 4 && <button className="button primary" onClick={() => setStep(step + 1)}>Continuar →</button>}</footer>
      </section>
    </main>
  );
}

function Intro({ title, text }: { title: string; text: string }) { return <div className="intro"><h2>{title}</h2><p>{text}</p></div>; }
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{hint && <small>{hint}</small>}{children}</label>; }
function ProposalFooter({ project, page }: { project: string; page: number }) { return <footer className="proposal-footer"><span>{project} · Admira</span><span>Página {page}</span></footer>; }
