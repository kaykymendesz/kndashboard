import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #8e2de2 0%, #4a00e0 55%, #1e40af 100%)",
          borderRadius: 36,
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -2, fontFamily: "system-ui" }}>
          KN
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 4,
            marginTop: 4,
            opacity: 0.9,
          }}
        >
          DASHBOARD
        </div>
      </div>
    ),
    { ...size }
  );
}
