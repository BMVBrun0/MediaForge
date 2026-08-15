import type { SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> { size?: number | string }

type PathDef = string | string[];

function makeIcon(path: PathDef) {
  return function Icon({ size = 24, strokeWidth = 1.8, ...props }: IconProps) {
    const paths = Array.isArray(path) ? path : [path];
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
        {paths.map((d, index) => <path d={d} key={`${d}-${index}`} />)}
      </svg>
    );
  };
}

export const Sparkles = makeIcon(["M12 3l1.1 3.2L16 7.5l-2.9 1.3L12 12l-1.1-3.2L8 7.5l2.9-1.3L12 3Z", "M18 13l.8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13Z", "M6 13l.7 1.8L8.5 15.5l-1.8.7L6 18l-.7-1.8-1.8-.7 1.8-.7L6 13Z"]);
export const Clock3 = makeIcon(["M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z", "M12 7v5l3 2"]);
export const Menu = makeIcon(["M4 7h16", "M4 12h16", "M4 17h16"]);
export const X = makeIcon(["M6 6l12 12", "M18 6 6 18"]);
export const Box = makeIcon(["M4 8l8-4 8 4-8 4-8-4Z", "M4 8v8l8 4 8-4V8", "M12 12v8"]);
export const Shield = makeIcon(["M12 3l7 3v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6l7-3Z"]);
export const ServerCog = makeIcon(["M5 4h14v6H5z", "M5 14h8", "M7 7h.01", "M7 17h.01", "M18 14v2", "M18 20v1", "M15.5 15.5l1.4 1.4", "M19.1 19.1l1.4 1.4", "M15 18h2", "M19 18h2"]);
export const FileUp = makeIcon(["M7 3h7l4 4v14H7z", "M14 3v5h5", "M12 17v-6", "M9.5 13.5 12 11l2.5 2.5"]);
export const Download = makeIcon(["M12 4v10", "M8 10l4 4 4-4", "M5 19h14"]);
export const Gauge = makeIcon(["M4 17a8 8 0 1 1 16 0", "M12 17l4-5", "M7 17h10"]);
export const Image = makeIcon(["M4 5h16v14H4z", "M7 15l3-3 3 3 2-2 2 2", "M8 9h.01"]);
export const RefreshCw = makeIcon(["M20 6v5h-5", "M4 18v-5h5", "M18 9a7 7 0 0 0-12-2l-2 4", "M6 15a7 7 0 0 0 12 2l2-4"]);
export const Pipette = makeIcon(["M19 3l2 2-9 9-3 1 1-3 9-9Z", "M5 19l4-4", "M4 20h5"]);
export const ScanLine = makeIcon(["M4 8V5h3", "M17 5h3v3", "M20 16v3h-3", "M7 19H4v-3", "M7 12h10"]);
export const ShieldCheck = makeIcon(["M12 3l7 3v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6l7-3Z", "M9 12l2 2 4-4"]);
export const MapPin = makeIcon(["M12 21s6-5.4 6-11a6 6 0 0 0-12 0c0 5.6 6 11 6 11Z", "M12 10h.01"]);
export const Trash2 = makeIcon(["M4 7h16", "M9 7V4h6v3", "M7 7l1 13h8l1-13", "M10 11v5", "M14 11v5"]);
export const Copy = makeIcon(["M9 9h11v11H9z", "M4 15V4h11"]);
export const Palette = makeIcon(["M12 4a8 8 0 1 0 0 16h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h4a4 4 0 0 0 0-8h-4Z", "M8 9h.01", "M11 7h.01", "M7 13h.01"]);
export const ScanSearch = makeIcon(["M4 8V5h3", "M17 5h3v3", "M4 16v3h3", "M15 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "M17 17l3 3"]);
export const Columns2 = makeIcon(["M4 5h7v14H4z", "M13 5h7v14h-7z"]);
export const PackageOpen = makeIcon(["M4 8l8-4 8 4-8 4-8-4Z", "M4 8v8l8 4 8-4V8", "M8 6l8 4", "M12 12v8"]);
export const Clapperboard = makeIcon(["M4 9h16v11H4z", "M4 9l2-5h14l-2 5", "M8 4 6 9", "M13 4l-2 5", "M18 4l-2 5"]);
export const LoaderCircle = makeIcon(["M12 3a9 9 0 0 1 9 9", "M12 21a9 9 0 0 1-9-9"]);
export const LockKeyhole = makeIcon(["M6 10h12v10H6z", "M8 10V7a4 4 0 0 1 8 0v3", "M12 14v2"]);
export const UnlockKeyhole = makeIcon(["M6 10h12v10H6z", "M8 10V7a4 4 0 0 1 7-2", "M12 14v2"]);
export const Fingerprint = makeIcon(["M8 10a4 4 0 0 1 8 0c0 5-1 8-2 10", "M6 12c0 4-.5 6-1 7", "M10 12c0 4-.5 7-1 9", "M14 12c0 3-.4 5-1 7", "M12 3a9 9 0 0 0-7 3"]);
export const CheckCircle2 = makeIcon(["M12 3a9 9 0 1 0 9 9", "M8 12l2.5 2.5L16 9"]);
export const XCircle = makeIcon(["M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z", "M9 9l6 6", "M15 9l-6 6"]);
export const Check = makeIcon(["M5 12l4 4 10-10"]);
export const KeyRound = makeIcon(["M8 14a5 5 0 1 1 3-9 5 5 0 0 1-3 9Z", "M12 10h9", "M18 10v3", "M15 10v2"]);
export const Eye = makeIcon(["M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"]);
export const Blend = makeIcon(["M8 4a4 4 0 0 0 0 8h4V8a4 4 0 0 0-4-4Z", "M16 12a4 4 0 1 1-4 4v-4h4Z"]);
export const WandSparkles = makeIcon(["M5 19 19 5", "M4 8l.7 1.8L6.5 10.5l-1.8.7L4 13l-.7-1.8-1.8-.7 1.8-.7L4 8Z", "M16 15l.8 2.2L19 18l-2.2.8L16 21l-.8-2.2L13 18l2.2-.8L16 15Z"]);
export const Search = makeIcon(["M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z", "M16 16l5 5"]);

export const CircleHelp = makeIcon(["M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z", "M9.8 9a2.35 2.35 0 0 1 4.55.8c0 1.7-2.35 2-2.35 3.7", "M12 17h.01"]);

export const Home = makeIcon(["M3 11.5 12 4l9 7.5", "M5.5 10v10h13V10", "M9 20v-6h6v6"]);
