import { ImageResponse } from "next/og";
export const alt =
  "Jesus Martinez. Crypto, with context. JM Crypto and The Attention Cycle.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0B1018",
        color: "#F4EEE2",
        padding: 72,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 24,
          letterSpacing: 4,
          color: "#00C8E0",
        }}
      >
        MARTINEZ ACCESS / JESUS MARTINEZ
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 104,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: -5,
        }}
      >
        <span>Crypto.</span>
        <span style={{ color: "#A5AFBC" }}>With context.</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #303945",
          paddingTop: 28,
          fontSize: 24,
        }}
      >
        <span>JM Crypto</span>
        <span style={{ color: "#C9A24B" }}>The Attention Cycle</span>
        <span>martinezaccess.com</span>
      </div>
    </div>,
    size,
  );
}
