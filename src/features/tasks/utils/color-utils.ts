/**
 * Interpolates between two hex colors.
 *
 * @param colorA The starting hex color (e.g., '#ff0000')
 * @param colorB The ending hex color (e.g., '#0000ff')
 * @param amount A value between 0 and 1 indicating the interpolation position
 * @returns The interpolated hex color
 */
export function interpolateColor(colorA: string, colorB: string, amount: number): string {
  // Ensure amount is between 0 and 1
  const clampedAmount = Math.max(0, Math.min(1, amount));

  // Parse hex colors to RGB components
  const ah = parseInt(colorA.replace(/#/g, ''), 16);
  const ar = ah >> 16;
  const ag = (ah >> 8) & 0xff;
  const ab = ah & 0xff;

  const bh = parseInt(colorB.replace(/#/g, ''), 16);
  const br = bh >> 16;
  const bg = (bh >> 8) & 0xff;
  const bb = bh & 0xff;

  // Calculate interpolated values
  const rr = ar + clampedAmount * (br - ar);
  const rg = ag + clampedAmount * (bg - ag);
  const rb = ab + clampedAmount * (bb - ab);

  // Ensure components are within [0, 255] and round them
  const r = Math.round(Math.max(0, Math.min(255, rr)));
  const g = Math.round(Math.max(0, Math.min(255, rg)));
  const b = Math.round(Math.max(0, Math.min(255, rb)));

  // Convert back to hex, ensuring 6 digits with padding if necessary
  const hexR = r.toString(16).padStart(2, '0');
  const hexG = g.toString(16).padStart(2, '0');
  const hexB = b.toString(16).padStart(2, '0');

  return `#${hexR}${hexG}${hexB}`;
}
