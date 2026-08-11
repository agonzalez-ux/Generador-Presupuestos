"use client";

import { ChangeEvent, useMemo, useState } from "react";

type Item = { id: number; area: string; description: string; amount: number };
type Include = { id: number; title: string; description: string };

const admiraGreen = "#689F3A";
const defaultItems: Item[] = [
  { id: 1, area: "Producción y coordinación", description: "Planificación, gestión y seguimiento integral", amount: 4200 },
  { id: 2, area: "Equipo técnico especializado", description: "Preparación, operación y soporte", amount: 7800 },
  { id: 3, area: "Logística y transporte", description: "Desplazamientos, material y montaje", amount: 1950 },
];
const defaultIncludes: Include[] = [
  { id: 1, title: "Concepto y puesta en escena", description: "Definición creativa, adaptación visual y preparación de la experiencia." },
  { id: 2, title: "Equipo especializado", description: "Coordinación, pruebas, puesta en marcha y acompañamiento operativo." },
  { id: 3, title: "Operación y soporte", description: "Recursos técnicos y medidas necesarias para una ejecución segura y fluida." },
  { id: 4, title: "Logística y cobertura", description: "Traslados, materiales, producción y coberturas asociadas al servicio." },
];

const money = (value: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value || 0);

export default function Home() {
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState(false);
  const [client, setClient] = useState("PortAventura");
  const [project, setProject] = useState("Experiencia que deja huella");
  const [subtitle, setSubtitle] = useState("Una propuesta diseñada para convertir una idea en un momento memorable.");
  const [location, setLocation] = useState("Barcelona");
  const [dates, setDates] = useState("Próximamente");
  const [format, setFormat] = useState("Experiencia presencial");
  const [audience, setAudience] = useState("Invitados y asistentes");
  const [summary, setSummary] = useState("En Admira diseñamos experiencias que combinan estrategia, creatividad y una ejecución impecable. Esta propuesta reúne todos los recursos necesarios para dar forma a una activación relevante, segura y alineada con la marca.");
  const [experience, setExperience] = useState("Proponemos una experiencia integral construida alrededor de los objetivos del proyecto. Nos ocuparemos del concepto, la planificación, la producción y la operación para que cada punto de contacto resulte coherente, cuidado y memorable.");
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
  const [brandStatus, setBrandStatus] = useState("");

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.amount || 0), 0), [items]);
  const contingencyAmount = subtotal * (contingency / 100);
  const base = subtotal + contingencyAmount;
  const total = base * (1 + vat / 100);
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
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, defval: "" });
      const parsed = rows.flatMap((row, index) => {
        const amount = [...row].reverse().find((cell) => typeof cell === "number") as number | undefined;
        const area = String(row.find((cell) => typeof cell === "string" && cell.trim()) || "").trim();
        if (!area || typeof amount !== "number" || /total|iva|base imponible/i.test(area)) return [];
        const description = String(row.slice(1, -1).find((cell) => typeof cell === "string" && cell.trim()) || "");
        return [{ id: Date.now() + index, area, description, amount }];
      });
      if (parsed.length) setItems(parsed);
    } catch {
      setExcelName(`${file.name} · no se pudieron detectar partidas; puedes añadirlas manualmente`);
    }
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

  if (preview) {
    return (
      <main className="preview-shell" style={{ "--brand": primary, "--ink": secondary } as React.CSSProperties}>
        <div className="preview-toolbar no-print">
          <button className="button ghost" onClick={() => setPreview(false)}>← Volver a editar</button>
          <div><strong>Vista previa</strong><span> · 3 páginas</span></div>
          <button className="button primary" onClick={() => window.print()}>Descargar PDF</button>
        </div>
        <section className="proposal-page cover-page">
          <header className="proposal-header"><img src={logo} alt="Logo" /><span>PROPUESTA PARA {client.toUpperCase()}</span></header>
          <div className="cover-title"><p>PROPUESTA CREATIVA Y ECONÓMICA</p><h1>{project}</h1><h2>{client}</h2></div>
          <p className="lead">{subtitle}</p>
          <div className="fact-card two"><div><label>CLIENTE</label><strong>{client}</strong></div><div><label>UBICACIÓN</label><strong>{location}</strong></div></div>
          <div className="summary-card"><label>RESUMEN EJECUTIVO</label><p>{summary}</p></div>
          <div className="facts"><div><label>CALENDARIO</label><strong>{dates}</strong></div><div><label>FORMATO</label><strong>{format}</strong></div><div><label>AUDIENCIA</label><strong>{audience}</strong></div></div>
          <div className="scope"><label>ALCANCE PRINCIPAL</label><p>{includes.map((item) => item.title).join(", ")}.</p><em>{closing}</em></div>
          <ProposalFooter project={project} page={1} />
        </section>

        <section className="proposal-page experience-page">
          <header className="section-kicker">LA EXPERIENCIA</header>
          <h2>Una propuesta pensada para hacerlo posible</h2>
          <p className="experience-copy">{experience}</p>
          <div className="facts three"><div><label>CALENDARIO</label><strong>{dates}</strong></div><div><label>FORMATO</label><strong>{format}</strong></div><div><label>ENFOQUE</label><strong>A medida</strong></div></div>
          <h3>Qué incluye nuestra propuesta</h3>
          <div className="include-list">{includes.map((item) => <article key={item.id}><strong>{item.title}</strong><p>{item.description}</p></article>)}</div>
          <em className="closing-copy">{closing}</em>
          <ProposalFooter project={project} page={2} />
        </section>

        <section className="proposal-page investment-page">
          <header className="proposal-header"><img src={logo} alt="Logo" /><span>PROPUESTA PARA {client.toUpperCase()}</span></header>
          <p className="section-kicker">INVERSIÓN</p><h2>Presupuesto por áreas de servicio</h2>
          <div className="budget-table"><div className="budget-head"><span>ÁREA DE SERVICIO</span><span>IMPORTE</span></div>{visibleItems.map((item) => <div className="budget-row" key={item.id}><div><strong>{item.area}</strong><small>{item.description}</small></div><strong>{money(item.amount)}</strong></div>)}</div>
          <div className="totals">
            <div><span>Subtotal</span><strong>{money(showContingency ? subtotal : base)}</strong></div>
            {showContingency && <div><span>Contingencia ({contingency} %)</span><strong>{money(contingencyAmount)}</strong></div>}
            <div><span>Base imponible</span><strong>{money(base)}</strong></div>
            <div><span>IVA ({vat} %)</span><strong>{money(base * vat / 100)}</strong></div>
            <div className="grand-total"><span>TOTAL PROPUESTA</span><strong>{money(total)}</strong></div>
          </div>
          <h3>Consideraciones</h3><ul className="notes">{notes.split("\n").filter(Boolean).map((note) => <li key={note}>{note}</li>)}</ul>
          <p className="final-line">Una propuesta pensada para convertir una idea en un resultado memorable.</p>
          <ProposalFooter project={project} page={3} />
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
            <div className="form-grid two"><Field label="Empresa o cliente"><input value={client} onChange={(e) => setClient(e.target.value)} /></Field><Field label="Nombre del proyecto"><input value={project} onChange={(e) => setProject(e.target.value)} /></Field></div>
            <Field label="Frase de apertura" hint="Una línea breve y atractiva para la portada"><textarea rows={2} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></Field>
            <div className="form-grid two"><Field label="Ubicación"><input value={location} onChange={(e) => setLocation(e.target.value)} /></Field><Field label="Fechas o calendario"><input value={dates} onChange={(e) => setDates(e.target.value)} /></Field><Field label="Formato"><input value={format} onChange={(e) => setFormat(e.target.value)} /></Field><Field label="Público / audiencia"><input value={audience} onChange={(e) => setAudience(e.target.value)} /></Field></div>
            <Field label="Quiénes somos y resumen ejecutivo" hint="Aparecerá en la primera página"><textarea rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} /></Field>
          </>}

          {step === 1 && <>
            <Intro title="Haz que la propuesta se sienta suya" text="Partimos de la identidad de Admira y puedes incorporar la marca del cliente." />
            <div className="upload-zone"><div className="logo-preview"><img src={logo} alt="Logo seleccionado" /></div><div><strong>Logo de la empresa</strong><p>{logoName}</p><label className="button secondary">Cambiar logo<input hidden type="file" accept="image/*" onChange={onLogo} /></label></div></div>
            <Field label="Web de la empresa" hint="Intentaremos detectar automáticamente sus colores principales"><div className="input-action"><input type="url" placeholder="https://empresa.com" value={website} onChange={(e) => setWebsite(e.target.value)} /><button className="button secondary" onClick={extractBrand}>Extraer colores</button></div>{brandStatus && <small className="status">{brandStatus}</small>}</Field>
            <div className="palette-card"><div><span>COLOR PRINCIPAL</span><label className="color-field"><input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} /><input value={primary} onChange={(e) => setPrimary(e.target.value)} /></label></div><div><span>COLOR DE TEXTO</span><label className="color-field"><input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} /><input value={secondary} onChange={(e) => setSecondary(e.target.value)} /></label></div><div className="palette-preview"><i style={{ background: primary }} /><i style={{ background: secondary }} /><i /></div></div>
          </>}

          {step === 2 && <>
            <Intro title="Cuenta exactamente qué vamos a hacer" text="Esta información construirá la segunda página de la propuesta." />
            <Field label="Descripción de la experiencia" hint="Explica la idea, el enfoque y el resultado esperado"><textarea rows={6} value={experience} onChange={(e) => setExperience(e.target.value)} /></Field>
            <div className="section-title"><div><strong>Qué incluye nuestra propuesta</strong><span>Añade los bloques necesarios</span></div><button className="text-button" onClick={addInclude}>+ Añadir bloque</button></div>
            <div className="editable-list">{includes.map((item, index) => <article key={item.id}><span className="drag">{String(index + 1).padStart(2, "0")}</span><div><input value={item.title} onChange={(e) => updateInclude(item.id, "title", e.target.value)} /><textarea rows={2} value={item.description} onChange={(e) => updateInclude(item.id, "description", e.target.value)} /></div><button aria-label="Eliminar bloque" onClick={() => setIncludes(includes.filter((row) => row.id !== item.id))}>×</button></article>)}</div>
            <Field label="Frase de cierre"><textarea rows={2} value={closing} onChange={(e) => setClosing(e.target.value)} /></Field>
          </>}

          {step === 3 && <>
            <Intro title="Construye la inversión" text="Importa un Excel o introduce las partidas manualmente. El total se recalcula al instante." />
            <label className="excel-zone"><span className="file-icon">XLS</span><div><strong>Adjuntar presupuesto en Excel</strong><p>{excelName || "Se leerán las áreas, descripciones e importes de la primera hoja"}</p></div><span className="button secondary">Seleccionar archivo</span><input hidden type="file" accept=".xlsx,.xls,.csv" onChange={importBudget} /></label>
            <div className="section-title"><div><strong>Partidas del presupuesto</strong><span>{items.length} áreas · {money(subtotal)}</span></div><button className="text-button" onClick={addItem}>+ Añadir partida</button></div>
            <div className="budget-editor"><div className="editor-head"><span>ÁREA / DESCRIPCIÓN</span><span>IMPORTE</span><span /></div>{items.map((item) => <div className="editor-row" key={item.id}><div><input value={item.area} onChange={(e) => updateItem(item.id, "area", e.target.value)} /><input className="description" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} /></div><label><input type="number" value={item.amount} onChange={(e) => updateItem(item.id, "amount", Number(e.target.value))} /><span>€</span></label><button onClick={() => setItems(items.filter((row) => row.id !== item.id))}>×</button></div>)}</div>
            <div className="contingency-card"><div className="toggle-line"><div><strong>Mostrar contingencia en la propuesta</strong><span>Si se oculta, se integrará en otra partida sin alterar el total.</span></div><button className={`toggle ${showContingency ? "on" : ""}`} aria-pressed={showContingency} onClick={() => setShowContingency(!showContingency)}><i /></button></div><div className="form-grid two compact"><Field label="Porcentaje de contingencia"><label className="suffix"><input type="number" min="0" value={contingency} onChange={(e) => setContingency(Number(e.target.value))} /><span>%</span></label></Field>{!showContingency && <Field label="Integrar la contingencia en"><select value={contingencyTarget} onChange={(e) => setContingencyTarget(e.target.value)}><option value="auto">Área de mayor importe (automático)</option>{items.map((item) => <option key={item.id} value={item.id}>{item.area}</option>)}</select></Field>}</div>{!showContingency && <p className="privacy-note">La partida elegida aumentará {money(contingencyAmount)}. La tabla no mostrará una línea de contingencia.</p>}</div>
            <div className="form-grid two"><Field label="IVA"><label className="suffix"><input type="number" value={vat} onChange={(e) => setVat(Number(e.target.value))} /><span>%</span></label></Field><div className="total-card"><span>TOTAL PROPUESTA</span><strong>{money(total)}</strong><small>Base imponible {money(base)}</small></div></div>
          </>}

          {step === 4 && <>
            <Intro title="Todo listo para presentar" text="Revisa el contenido final y genera una propuesta de tres páginas lista para compartir." />
            <div className="review-hero"><div className="review-brand"><img src={logo} alt="Logo" /></div><div><span>PROPUESTA PARA {client.toUpperCase()}</span><h2>{project}</h2><p>{subtitle}</p></div></div>
            <div className="review-grid"><article><span>01</span><div><strong>Portada y resumen</strong><p>{client} · {location} · {dates}</p></div><button onClick={() => setStep(0)}>Editar</button></article><article><span>02</span><div><strong>Experiencia y alcance</strong><p>{includes.length} bloques incluidos</p></div><button onClick={() => setStep(2)}>Editar</button></article><article><span>03</span><div><strong>Inversión</strong><p>{items.length} partidas · {showContingency ? "contingencia visible" : "contingencia integrada"}</p></div><button onClick={() => setStep(3)}>Editar</button></article></div>
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
