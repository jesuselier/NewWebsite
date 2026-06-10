import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#080807",
          color: "#F7F1E6",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 12, height: 12, borderRadius: 999, background: "#D9A75B" }} />
          <div style={{ fontSize: 28, color: "#CCC2B1" }}>Martinez Access</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 104, lineHeight: 0.92 }}>Jesus</div>
          <div style={{ fontSize: 104, lineHeight: 0.92, color: "#D9A75B" }}>Martinez</div>
        </div>
        <div style={{ fontSize: 30, color: "#CCC2B1", maxWidth: 820 }}>
          Markets, macro, and the AI that now trades them.
        </div>
      </div>
    ),
    size,
  );
}
