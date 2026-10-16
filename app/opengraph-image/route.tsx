import { ImageResponse } from "next/og";

// martinezaccess.com share image, served at /opengraph-image and referenced from the
// site metadata. It is a route handler rather than an opengraph-image file so it keeps
// this URL now that the site's pages live in the app/(site) route group, and so it is
// never attached to the Swarm pages, which use their own image.
// Alt text: "Jesus Martinez. Creator of JM Crypto. Crypto changed my life."
export const dynamic = "force-static";
const size = { width: 1200, height: 630 };
export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#11171D",
        color: "#D3DDE4",
        padding: 76,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>
        Jesus Martinez
        <span style={{ color: "#79BDC6", marginLeft: 25, fontWeight: 400 }}>
          Creator of JM Crypto
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 100,
          fontWeight: 700,
          lineHeight: 1.04,
          letterSpacing: -5,
        }}
      >
        <span>Crypto changed</span>
        <span>my life.</span>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 24,
          borderTop: "2px solid #3B6972",
          paddingTop: 28,
          justifyContent: "space-between",
        }}
      >
        <span>Research. Conversations. The journey.</span>
        <span>martinezaccess.com</span>
      </div>
    </div>,
    size,
  );
}
