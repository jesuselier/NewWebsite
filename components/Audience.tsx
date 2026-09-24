import { AUDIENCE } from "@/lib/site";
export default function Audience() {
  return (
    <div className="audience">
      <div className="audience-numbers">
        <a
          href={AUDIENCE.youtube.source}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="40 thousand subscribers on JM Crypto, open YouTube"
        >
          <strong>{AUDIENCE.youtube.display}</strong>
          <span>JM Crypto subscribers</span>
        </a>
        <a
          href={AUDIENCE.x.source}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="322,731 followers on X, open profile"
        >
          <strong>{AUDIENCE.x.display}</strong>
          <span>Followers on X</span>
        </a>
      </div>
      <p className="audience-date">
        Public counts checked{" "}
        <time dateTime={AUDIENCE.checkedAt}>{AUDIENCE.checkedLabel}</time>.
      </p>
    </div>
  );
}
