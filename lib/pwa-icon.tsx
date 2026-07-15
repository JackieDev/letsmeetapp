import { ImageResponse } from "next/og";

// Single source of truth for the app icon: a calendar + check glyph in the
// brand neon-green (#39ff14) on the near-black app background (#09090b).
// All content sits within the central safe zone so it also works as a
// maskable icon (platforms may crop up to ~10% on each edge).
export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#09090b"/>
  <g fill="none" stroke="#39ff14" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
    <rect x="120" y="150" width="272" height="242" rx="40"/>
    <path d="M120 214 h272"/>
    <path d="M188 302 l40 40 l96 -104" stroke-width="26"/>
  </g>
  <g fill="#39ff14">
    <rect x="182" y="120" width="22" height="60" rx="11"/>
    <rect x="308" y="120" width="22" height="60" rx="11"/>
  </g>
</svg>`;

function svgDataUri(): string {
  const base64 = Buffer.from(ICON_SVG).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

export function renderPwaIcon(size: number): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={size} height={size} src={svgDataUri()} alt="LetsMeet" />
      </div>
    ),
    { width: size, height: size },
  );
}
