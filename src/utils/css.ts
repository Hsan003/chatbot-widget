/**
 * CSS utilities for safe style injection
 * 
 * Prevents CSS injection attacks by validating and sanitizing values
 */

/**
 * Validate and sanitize hex color values
 * Only allows valid 3-digit or 6-digit hex colors
 * 
 * @param value - Color value from config
 * @param fallback - Default color if validation fails
 * @returns Valid hex color or fallback
 */
export function sanitizeHexColor(
  value: unknown,
  fallback: string = "#1a56db"
): string {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();

  // Accept 3-digit (#abc) or 6-digit (#abcdef) hex colors only
  if (/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(trimmed)) {
    return trimmed;
  }

  return fallback;
}

/**
 * Validate and sanitize font family values
 * Blocks CSS injection by restricting characters and length
 * 
 * @param value - Font family from config
 * @param fallback - Default font if validation fails
 * @returns Valid font family or fallback
 */
export function sanitizeFontFamily(
  value: unknown,
  fallback: string = "'Ubuntu', sans-serif"
): string {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();

  // Allow alphanumeric, spaces, commas, quotes, hyphens only
  // Reject anything that looks like CSS injection
  if (!/^[A-Za-z0-9 ,'\"-]*$/.test(trimmed)) {
    return fallback;
  }

  // Limit length to prevent bloat and potential issues
  if (trimmed.length > 100) {
    return fallback;
  }

  return trimmed;
}

/**
 * Convert hex color to RGB values for use in CSS rgb() function
 * 
 * @param hex - Hex color (e.g., "#1a56db")
 * @returns RGB values as string (e.g., "26, 86, 219")
 */
export function hexToRgb(hex: string): string {
  // Remove # and validate
  const h = hex.replace("#", "");

  // Handle 3-digit hex
  const full = h.length === 3 
    ? h.split("").map((c) => c + c).join("")
    : h;

  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);

  return `${r}, ${g}, ${b}`;
}
