import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");
const STAGES = ["premier-contact", "echange", "proposition", "negociation", "signe", "perdu"];

/** Contenu du premier bloc `selector { … }` de globals.css. */
function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`Bloc introuvable : ${selector}`);
  return css.slice(start, css.indexOf("}", start));
}

function variable(source: string, name: string): string {
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(source);
  if (!match) throw new Error(`Variable introuvable : --${name}`);
  return match[1].trim();
}

/** Luminance relative WCAG d'une couleur `oklch(L C H)` (conversion OKLab → sRGB linéaire). */
function luminance(color: string): number {
  const [L, C, H] = /oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/.exec(color)!.slice(1).map(Number);
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const r = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const bl = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

function contrast(first: string, second: string): number {
  const [hi, lo] = [luminance(first), luminance(second)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("tokens d'étape du thème", () => {
  it.each(STAGES)("exposent « %s » à Tailwind (bg-stage-… et text-stage-…-foreground)", (stage) => {
    const theme = block("@theme inline");
    expect(variable(theme, `color-stage-${stage}`)).toBe(`var(--stage-${stage})`);
    expect(variable(theme, `color-stage-${stage}-foreground`)).toBe(
      `var(--stage-${stage}-foreground)`,
    );
  });

  it.each(
    STAGES.flatMap((stage) => [
      [":root", stage],
      [".dark", stage],
    ]),
  )("ont un contraste d'au moins 4,5:1 (%s, %s)", (selector, stage) => {
    const theme = block(selector);
    const ratio = contrast(
      variable(theme, `stage-${stage}`),
      variable(theme, `stage-${stage}-foreground`),
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
