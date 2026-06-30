import { ImageResponse } from "next/og";
import { getKnLogoDataUrl } from "@/lib/brand/kn-logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const logo = getKnLogoDataUrl();
  const logoSize = 140;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <img src={logo} width={logoSize} height={logoSize} alt="" style={{ objectFit: "contain" }} />
      </div>
    ),
    { ...size }
  );
}
