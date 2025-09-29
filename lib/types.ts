// Common types for the API

export interface Congress {
  id: string;
  congress_number: number;
  congress_website_key?: number;
  name: string;
  ordinal: string;
  start_date?: string;
  end_date?: string;
  start_year?: number;
  end_year?: number;
  year_range?: string;
  // Extended properties
  total_senators?: number;
  total_representatives?: number;
  total_committees?: number;
}

export interface Person {
  id: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  name_prefix?: string;
  name_suffix?: string;
  full_name?: string;
  professional_designations?: string[];
  senate_website_keys?: string[];
  congress_website_primary_keys?: number[];
  congress_website_author_keys?: string[];
  aliases?: string[];
  // Extended properties
  congresses?: CongressMembership[];
  congresses_served?: CongressMembership[];
  position?: string; // When in context of a specific congress
}

export interface CongressMembership {
  congress_id: string;
  congress_number: number;
  congress_ordinal: string;
  congress_name?: string;
  position: "senator" | "representative";
  type?: string;
  start_date?: string;
  end_date?: string;
  year_range?: string;
}

export interface Committee {
  id: string;
  name: string;
  type?: string;
  senate_website_keys?: string[];
  // Extended properties
  congress_id?: string;
  congress_number?: number;
  congress_ordinal?: string;
}

export interface Bill {
  id: string;
  type: string;  // "bill"
  subtype: string;  // "HB" | "SB"
  name?: string;  // e.g., "SBN-02674" or "HBN-00001"
  bill_number?: number;  // e.g., 2674
  congress?: number;
  title?: string;
  long_title?: string;
  date_filed?: string;
  scope?: string;
  subjects?: string[];
  authors_raw?: string;
  senate_website_permalink?: string;
  download_url_sources?: string[];
  // Extended properties
  authors?: Person[];
  congress_details?: Congress;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
    next_cursor?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export type QueryParams = Record<string, unknown>;