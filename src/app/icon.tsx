import { ImageResponse } from "next/og";
import { getKnLogoDataUrl } from "@/lib/brand/kn-logo";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const logo = getKnLogoDataUrl();
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
        <img src={logo} width={28} height={28} alt="" style={{ objectFit: "contain" }} />
      </div>
    ),
    { ...size }
  );
}
