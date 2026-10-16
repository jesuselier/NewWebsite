import styles from "./swarm.module.css";

// The brand's only decorative pattern: a honeycomb field of pointy-top hex outlines
// fading toward the edges, with the official mark sitting on one lattice point so its
// gold core is the single lit cell and its grey ring is that cell's six neighbours.
// Geometry is taken from swarm-mark.svg: cell circumradius R = 0.1333 x mark size and
// centre-to-centre pitch = 1.95 x R (39 / 20 in the mark's own units).

const VIEW = 640; // viewBox size
const MARK = 256; // mark image size in viewBox units
const R = (MARK * 20) / 150; // cell circumradius (the mark's hexes are r=20 in a 150-unit box)
const PITCH = (R * 39) / 20;
const ROW = PITCH * (Math.sqrt(3) / 2);
const r = R * 0.97; // field cells sit just inside the mark's cells
const C = VIEW / 2;

function hexPath(cx: number, cy: number) {
  const pts = [-90, -30, 30, 90, 150, 210].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  });
  return `M${pts.join("L")}Z`;
}

// One tile of the lattice: a cell at each corner plus one in the middle row.
const TILE_W = PITCH;
const TILE_H = ROW * 2;
const tile = [
  hexPath(0, 0),
  hexPath(TILE_W, 0),
  hexPath(TILE_W / 2, ROW),
  hexPath(0, TILE_H),
  hexPath(TILE_W, TILE_H),
].join("");

export default function HiveField() {
  return (
    <div className={styles.hive} aria-hidden="true">
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className={styles.hiveField} focusable="false">
        <defs>
          <pattern
            id="swarm-hive"
            width={TILE_W}
            height={TILE_H}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${C} ${C})`}
          >
            <path d={tile} fill="none" stroke="#1C1C21" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
          </pattern>
          {/* Fade toward the edges and keep the field out from under the mark. */}
          <radialGradient id="swarm-hive-fade">
            <stop offset="0.18" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="swarm-hive-mask">
            <rect width={VIEW} height={VIEW} fill="url(#swarm-hive-fade)" />
            <circle cx={C} cy={C} r={PITCH * 1.55} fill="#000" />
          </mask>
        </defs>
        <rect width={VIEW} height={VIEW} fill="url(#swarm-hive)" mask="url(#swarm-hive-mask)" />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG used as is */}
      <img
        src="/brand/swarm/logo/swarm-mark.svg"
        alt=""
        className={styles.hiveMark}
        style={{ width: `${(MARK / VIEW) * 100}%` }}
      />
    </div>
  );
}
