/**
 * Schema validation for store configuration
 * 
 * Ensures all config from backend matches expected shape and constraints
 */

import { z } from "zod";

/**
 * Store config returned from `/api/config/{storeId}`
 * These are safe, non-sensitive values that control widget appearance only
 * System prompts, secrets, and sensitive data must remain on backend
 */
export const storeConfigSchema = z
  .object({
    // Branding
    name: z.string().min(1).max(50).optional(),
    logoUrl: z.string().url().optional(),

    // Colors - strict hex validation to prevent CSS injection
    primaryColor: z
      .string()
      .regex(/^#([0-9A-F]{3}|[0-9A-F]{6})$/i, "Invalid hex color")
      .optional(),
    secondaryColor: z
      .string()
      .regex(/^#([0-9A-F]{3}|[0-9A-F]{6})$/i, "Invalid hex color")
      .optional(),
    backgroundColor: z
      .string()
      .regex(/^#([0-9A-F]{3}|[0-9A-F]{6})$/i, "Invalid hex color")
      .optional(),
    textColor: z
      .string()
      .regex(/^#([0-9A-F]{3}|[0-9A-F]{6})$/i, "Invalid hex color")
      .optional(),

    // Font family - alphanumeric and basic punctuation only
    fontFamily: z
      .string()
      .max(100)
      .regex(/^[A-Za-z0-9 ,'\"-]*$/, "Invalid font family")
      .optional(),

    // UI Text
    welcomeMessage: z.string().max(500).optional(),
    inputPlaceholder: z.string().max(100).optional(),
    headerSubtitle: z.string().max(100).optional(),
    poweredByLabel: z.string().max(50).optional(),

    // Layout
    position: z.enum(["left", "right"]).optional(),
    openOnInit: z.boolean().optional(),
  })
  .strict(); // Reject unknown properties

export type StoreConfig = z.infer<typeof storeConfigSchema>;

/**
 * Chat API response schema
 * Validates the LLM response before rendering it
 */
export const chatResponseSchema = z
  .object({
    reply: z.string().optional(),
    message: z.string().optional(),
  })
  .strict();

export type ChatResponse = z.infer<typeof chatResponseSchema>;
