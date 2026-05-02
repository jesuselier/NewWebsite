import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionHead from "@/components/SectionHead";
import CTAButton from "@/components/CTAButton";
import Reveal from "@/components/Reveal";

const MEDIA_KIT_URL =
  "https://drive.google.com/drive/folders/1de7ZvffYIKPNZH1LDwBUsi4ii9O7yxrK";

const stats = [
  { value: "385K+", label: "combined reach" },
  { value: "310K", label: "X followers" },
  { value: "75K+", label: "YouTube subscribers" },
  { value: "2021", label: "full-time crypto coverage" },
];

const formats = [
  "Dedicated YouTube integrations",
  "Podcast interviews",
  "X campaign support",
  "Partner landing-page traffic",
  "Founder and product education",
  "Conference and media appearances",
];

export const metadata = {
  title: "Press Kit - Jesus Martinez",
  description:
    "Audience stats, creator bio, sponsorship fit, and media assets for Jesus Martinez and JM Crypto.",
};

export default function PressKitPage() {
  return (
    <div className="container-page">
      <Navbar />
      <SectionHead num="05" title="Press kit" />

      <Reveal
        as="section"
        className="premium-panel"
        style={{
          padding: 44,
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 42,
        }}
      >
        <div>
          <span className="font-mono text-gold uppercase" style={{ fontSize: 10, letterSpacing: "0.14em" }}>
            Martinez Access
          </span>
          <h1
            className="font-serif text-ink"
            style={{ fontSize: "clamp(42px, 6vw, 82px)", lineHeight: 1, margin: "14px 0 0", fontWeight: 400 }}
          >
            Jesus Martinez
          </h1>
          <p className="font-serif text-ink-dim" style={{ fontSize: 22, lineHeight: 1.45, margin: "22px 0 0", fontStyle: "italic" }}>
            Creator, host, and analyst covering crypto markets, macro, and the AI layer
            reshaping money.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "end", justifyContent: "flex-end" }}>
          <CTAButton href={MEDIA_KIT_URL} external>Open media kit</CTAButton>
        </div>
      </Reveal>

      <Reveal
        as="section"
        className="row-4"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", marginTop: 42 }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="premium-hover" style={{ padding: 28, border: "0.5px solid var(--rule)", margin: "-0.5px" }}>
            <strong className="font-serif text-gold" style={{ display: "block", fontSize: 34, fontWeight: 400 }}>
              {stat.value}
            </strong>
            <span className="font-mono text-ink-mute uppercase" style={{ display: "block", marginTop: 8, fontSize: 10, letterSpacing: "0.14em" }}>
              {stat.label}
            </span>
          </div>
        ))}
      </Reveal>

      <Reveal as="section" className="rule-top" style={{ marginTop: 56, paddingTop: 38 }}>
        <h2 className="font-serif text-ink" style={{ fontSize: 30, fontWeight: 400, margin: 0 }}>
          Sponsorship formats
        </h2>
        <div className="row-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 24 }}>
          {formats.map((format) => (
            <div key={format} className="premium-hover" style={{ padding: 22, border: "0.5px solid var(--rule)" }}>
              <span className="font-serif text-ink-dim" style={{ fontSize: 18, fontStyle: "italic" }}>{format}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <Footer />
    </div>
  );
}
