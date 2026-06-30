import { ImageResponse } from "next/og";

export const runtime = "edge";

function iconMarkup(size: number) {
  const fontSize = Math.round(size * 0.28);
  const subSize = Math.round(size * 0.07);
  const radius = Math.round(size * 0.2);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #8e2de2 0%, #4a00e0 55%, #1e40af 100%)",
        borderRadius: radius,
        color: "#fff",
      }}
    >
      <div style={{ fontSize, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>
        KN
      </div>
      {size >= 180 && (
        <div style={{ fontSize: subSize, fontWeight: 600, letterSpacing: 3, marginTop: 4, opacity: 0.92 }}>
          DASHBOARD
        </div>
      )}
    </div>
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await context.params;
  const size = Math.min(512, Math.max(32, parseInt(sizeParam, 10) || 192));

  return new ImageResponse(iconMarkup(size), {
    width: size,
    height: size,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
