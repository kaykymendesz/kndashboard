import { readFileSync } from "fs";
import { join } from "path";

let cached: string | null = null;

/** Logo oficial K&N em data URL — para ícones PWA gerados em runtime. */
export function getKnLogoDataUrl() {
  if (cached) return cached;
  const buf = readFileSync(join(process.cwd(), "public/kn-logo.png"));
  cached = `data:image/png;base64,${buf.toString("base64")}`;
  return cached;
}

export const KN_LOGO_PATH = "/kn-logo.png";
