type RateEntry = { count: number; resetAt: number };

const rateLimit = new Map<string, RateEntry>();

function getOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string") return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown[] }).content) ? (item as { content: unknown[] }).content : [];
    for (const part of content) {
      if (part && typeof part === "object" && (part as { type?: string }).type === "output_text" && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
    }
  }
  return "";
}

export async function POST(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  const current = rateLimit.get(ip);
  if (current && current.resetAt > now && current.count >= 6) {
    return Response.json({ error: "Has hecho varias solicitudes seguidas. Espera un minuto y vuelve a intentarlo." }, { status: 429 });
  }
  rateLimit.set(ip, current && current.resetAt > now ? { ...current, count: current.count + 1 } : { count: 1, resetAt: now + 60_000 });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return Response.json({ error: "La función de IA todavía no está configurada." }, { status: 503 });

    const body = await request.json() as {
      brief?: unknown;
      instruction?: unknown;
      context?: Record<string, unknown>;
    };
    const brief = String(body.brief || "").trim().slice(0, 6000);
    const instruction = String(body.instruction || "").trim().slice(0, 500);
    if (brief.length < 20) return Response.json({ error: "Cuéntanos un poco más sobre lo que vamos a hacer." }, { status: 400 });

    const context = body.context || {};
    const projectContext = {
      cliente: String(context.client || "").slice(0, 150),
      proyecto: String(context.project || "").slice(0, 150),
      ubicación: String(context.location || "").slice(0, 150),
      fechas: String(context.dates || "").slice(0, 150),
      formato: String(context.format || "").slice(0, 150),
      audiencia: String(context.audience || "").slice(0, 150),
    };

    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        reasoning: { effort: "low" },
        store: false,
        max_output_tokens: 1600,
        instructions: "Eres redactora senior de Admira, una agencia de experiencias y producción. Escribe en español de España con un tono profesional, claro, atractivo y seguro. Convierte notas informales en una propuesta comercial bien redactada. Conserva todos los hechos aportados, pero nunca inventes servicios, cifras, fechas, ubicaciones, cantidades, resultados garantizados ni compromisos. Si falta un dato, omítelo. No menciones que eres una IA. Evita frases vacías, repeticiones y anglicismos innecesarios.",
        input: `CONTEXTO DEL PROYECTO:\n${JSON.stringify(projectContext)}\n\nNOTAS DE LA PERSONA:\n${brief}\n\nORDEN ADICIONAL:\n${instruction || "Ninguna. Prioriza claridad, concreción y valor para el cliente."}\n\nGenera: (1) una descripción de uno o dos párrafos; (2) entre 3 y 6 bloques concretos de lo que incluye la propuesta, deducidos únicamente de las notas; y (3) una frase de cierre breve.`,
        text: {
          format: {
            type: "json_schema",
            name: "admira_proposal",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["description", "includes", "closing"],
              properties: {
                description: { type: "string" },
                includes: {
                  type: "array",
                  minItems: 3,
                  maxItems: 6,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["title", "description"],
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                    },
                  },
                },
                closing: { type: "string" },
              },
            },
          },
        },
      }),
    });

    const responseData = await openAIResponse.json() as Record<string, unknown>;
    if (!openAIResponse.ok) {
      const apiError = responseData.error && typeof responseData.error === "object" ? responseData.error as { message?: string; code?: string } : {};
      console.error("OpenAI proposal generation failed", openAIResponse.status, apiError.code || apiError.message || "unknown");
      if (apiError.code === "credit_balance_exhausted" || apiError.code === "insufficient_quota") {
        return Response.json({ error: "La cuenta de OpenAI no tiene saldo disponible. Añade crédito en la plataforma de OpenAI para usar esta función." }, { status: 503 });
      }
      return Response.json({ error: "La IA no ha podido generar el texto ahora mismo. Inténtalo de nuevo en unos segundos." }, { status: 502 });
    }

    const outputText = getOutputText(responseData);
    if (!outputText) throw new Error("empty_output");
    const proposal = JSON.parse(outputText) as { description?: unknown; includes?: unknown; closing?: unknown };
    if (typeof proposal.description !== "string" || !Array.isArray(proposal.includes) || typeof proposal.closing !== "string") throw new Error("invalid_output");

    return Response.json(proposal);
  } catch (error) {
    console.error("Proposal generation error", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "No se ha podido generar la propuesta. Revisa la información e inténtalo de nuevo." }, { status: 500 });
  }
}
