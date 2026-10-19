import QRCode from "qrcode";

// PNG of a ticket / badge QR, for emails (mail clients block inline SVG and
// data: images). The code is unguessable and carries no personal data.
export async function GET(_req: Request, ctx: RouteContext<"/qr/[code]">) {
  const { code: raw } = await ctx.params;
  const code = raw.replace(/\.png$/i, "");
  if (!/^(ESN|STF)-[A-Z0-9]{8}$/.test(code)) return new Response("Not found", { status: 404 });
  const png = await QRCode.toBuffer(code, { type: "png", width: 440, margin: 1, errorCorrectionLevel: "M", color: { dark: "#07122e", light: "#ffffff" } });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
