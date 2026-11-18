export interface WidgetConfig {
  // Identity
  storeId: string;
  apiUrl: string;

  // Branding
  name?: string;           // Bot display name, e.g. "Aria"
  logoUrl?: string;        // Avatar image URL; falls back to initials
  primaryColor?: string;   // Main accent (header, bubbles, FAB)  – hex or CSS color
  secondaryColor?: string; // Input focus ring, subtle accents
  backgroundColor?: string; // Chat body background
  textColor?: string;      // User bubble text (auto-contrast if omitted)
  fontFamily?: string;     // e.g. "'Syne', sans-serif"

  // Copy
  welcomeMessage?: string;
  inputPlaceholder?: string;
  headerSubtitle?: string;
  poweredByLabel?: string;  // e.g. "YourBrand" – set to "" to hide

  // Layout
  position?: "left" | "right";

  // Default display
  openOnInit?: boolean;
}

export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}