import { ImageResponse } from "next/og";
import { getKnLogoDataUrl } from "@/lib/brand/kn-logo-server";

export const runtime = "nodejs";

function iconMarkup(size: number, logoSrc: string) {
  const padding = Math.round(size * 0.1);
  const logoSize = size - padding * 2;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
      }}
    >
      <img
        src={logoSrc}
        width={logoSize}
        height={logoSize}
        alt=""
        style={{ objectFit: "contain" }}
      />
    </div>
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await context.params;
  const size = Math.min(512, Math.max(32, parseInt(sizeParam, 10) || 192));
  const logo = getKnLogoDataUrl();

  return new ImageResponse(iconMarkup(size, logo), {
    width: size,
    height: size,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
