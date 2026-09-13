import type { User, Campaign, Business, CampaignImage, BusinessContact, BusinessImage } from "@prisma/client";

export type { User, Campaign, Business, CampaignImage, BusinessContact, BusinessImage };

export type CampaignWithRelations = Campaign & {
  user: Pick<User, "id" | "name" | "image">;
  images: CampaignImage[];
};

export type BusinessWithRelations = Business & {
  user: Pick<User, "id" | "name">;
  contacts: BusinessContact[];
  images: BusinessImage[];
};

export type UserWithBusiness = User & {
  business: Business | null;
};

export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const CAMPAIGN_CATEGORIES = [
  "Environment",
  "Education",
  "Health",
  "Animal Welfare",
  "Human Rights",
  "Community",
  "Arts & Culture",
  "Poverty",
  "Disaster Relief",
  "Other",
] as const;

export type CampaignCategory = (typeof CAMPAIGN_CATEGORIES)[number];

export const BUSINESS_CATEGORIES = [
  "Retail",
  "Food & Beverage",
  "Technology",
  "Healthcare",
  "Education",
  "Finance",
  "Real Estate",
  "Arts & Entertainment",
  "Hospitality",
  "Professional Services",
  "Construction",
  "Transport",
  "Other",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export const CONTACT_TYPES = [
  "phone",
  "email",
  "instagram",
  "facebook",
  "linkedin",
  "twitter",
  "youtube",
  "other",
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];
