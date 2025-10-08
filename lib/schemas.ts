import { z } from "zod";

// Congress Schemas
export const CongressSchema = z.object({
  id: z.string().openapi({ example: "01H8ZXR5KBQZ..." }),
  congress_number: z.number().openapi({ example: 20 }),
  congress_website_key: z.number().optional(),
  name: z.string().openapi({ example: "20th Congress of the Philippines" }),
  ordinal: z.string().openapi({ example: "20th" }),
  start_date: z.string().optional().openapi({ example: "2022-06-30" }),
  end_date: z.string().optional().openapi({ example: "2025-06-30" }),
  start_year: z.number().optional().openapi({ example: 2022 }),
  end_year: z.number().optional().openapi({ example: 2025 }),
  year_range: z.string().optional().openapi({ example: "2022-2025" }),
  total_senators: z.number().optional(),
  total_representatives: z.number().optional(),
  total_committees: z.number().optional(),
});

// Congress Membership Schema
export const CongressMembershipSchema = z.object({
  congress_id: z.string(),
  congress_number: z.number(),
  congress_ordinal: z.string(),
  congress_name: z.string().optional(),
  position: z.enum(["senator", "representative"]),
  type: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  year_range: z.string().optional(),
});

// Person Schemas
export const PersonSchema = z.object({
  id: z.string().openapi({ example: "01H8ZXR5KBQZ..." }),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  middle_name: z.string().optional(),
  name_prefix: z.string().optional(),
  name_suffix: z.string().optional(),
  full_name: z.string().optional(),
  professional_designations: z.array(z.string()).optional(),
  senate_website_keys: z.array(z.string()).optional(),
  congress_website_primary_keys: z.array(z.number()).optional(),
  congress_website_author_keys: z.array(z.string()).optional(),
  aliases: z.array(z.string()).optional(),
  congresses: z.array(CongressMembershipSchema).optional(),
  congresses_served: z.array(CongressMembershipSchema).optional(),
  position: z.string().optional(),
});

// Committee Schema
export const CommitteeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().optional(),
  senate_website_keys: z.array(z.string()).optional(),
  congress_id: z.string().optional(),
  congress_number: z.number().optional(),
  congress_ordinal: z.string().optional(),
});

// Group/Chamber Schema
export const GroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().openapi({ example: "chamber" }),
  subtype: z.enum(["senate", "house"]).optional(),
  congress: z.number().optional(),
});

// Bill/Document Schema
export const BillSchema = z.object({
  id: z.string().openapi({ example: "01H8ZXR5KB..." }),
  type: z.string().openapi({ example: "bill" }),
  subtype: z.string().openapi({ example: "HB" }),
  name: z.string().optional().openapi({ example: "HBN-00001" }),
  bill_number: z.number().optional().openapi({ example: 1 }),
  congress: z.number().optional().openapi({ example: 20 }),
  title: z.string().optional(),
  long_title: z.string().optional(),
  congress_website_title: z.string().optional(),
  congress_website_abstract: z.string().optional(),
  date_filed: z.string().optional().openapi({ example: "2022-07-01" }),
  scope: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  authors_raw: z.string().optional(),
  senate_website_permalink: z.string().optional(),
  download_url_sources: z.array(z.string()).optional(),
  authors: z.array(PersonSchema).optional(),
  congress_details: CongressSchema.optional(),
});

// Pagination Schema
export const PaginationSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  has_more: z.boolean(),
  next_cursor: z.string().optional(),
});

// API Response Schemas
export const ApiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    pagination: PaginationSchema.optional(),
  });

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

// Paginated Response Helper
export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: PaginationSchema,
  });

// Export types for TypeScript
export type Congress = z.infer<typeof CongressSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type Committee = z.infer<typeof CommitteeSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type Bill = z.infer<typeof BillSchema>;
export type CongressMembership = z.infer<typeof CongressMembershipSchema>;
