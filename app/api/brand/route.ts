const colorPattern = /#[0-9a-fA-F]{6}\b/g;

function normalizeUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Protocolo no permitido");
  return url;
}

export async function POST(request: Request) {
  try {
    const { url: rawUrl } = await request.json();
    const url = normalizeUrl(String(rawUrl || ""));
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 BrandPaletteBot/1.0" }, redirect: "follow", signal: AbortSignal.timeout(7000) });
    const html = await response.text();
    const colors = [...new Set((html.match(colorPattern) || []).map((color) => color.toUpperCase()))]
      .filter((color) => !["#FFFFFF", "#000000", "#F5F5F5", "#333333"].includes(color))
      .slice(0, 6);
    return Response.json({ colors });
  } catch {
    return Response.json({ colors: [] });
  }
}
