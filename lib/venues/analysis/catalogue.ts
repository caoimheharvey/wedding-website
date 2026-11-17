import type { ScenarioLevel, CostBasis } from "./types";

// Single source of truth for the cost lines and the services checklist: the
// forms, the scenario engine and the MCP tools all read this.

export type CostGroupId =
  | "venue_ceremony"
  | "food_drinks"
  | "entertainment_production"
  | "styling_decoration"
  | "planning_operations"
  | "other";

export const COST_GROUPS: { id: CostGroupId; label: string }[] = [
  { id: "venue_ceremony", label: "Venue and ceremony" },
  { id: "food_drinks", label: "Food and drinks" },
  { id: "entertainment_production", label: "Entertainment and production" },
  { id: "styling_decoration", label: "Styling and decoration" },
  { id: "planning_operations", label: "Planning and operations" },
  { id: "other", label: "Other costs" },
];

/** Where a line lands in the scenario breakdown. */
export type Bucket =
  | "venue"
  | "food"
  | "supplier_meals"
  | "entertainment"
  | "production"
  | "decoration"
  | "coordination"
  | "staffing"
  | "other";

export const BUCKET_LABELS: Record<Bucket, string> = {
  venue: "Venue and ceremony fees",
  food: "Food and drinks",
  supplier_meals: "Supplier meals",
  entertainment: "Entertainment",
  production: "Production",
  decoration: "Decoration",
  coordination: "Coordination",
  staffing: "Mandatory staffing and service fees",
  other: "Other",
};

export interface CostItemDef {
  key: string;
  label: string;
  group: CostGroupId;
  bucket: Bucket;
  basis: CostBasis;
  /** First scenario this line is expected in when it's optional (A < B < C). */
  level: ScenarioLevel | "never";
  /** The service whose status decides whether this line is already covered. */
  serviceKey?: string;
  /** Counted even with no row at all (the base hire). */
  core?: boolean;
}

const item = (
  key: string,
  label: string,
  group: CostGroupId,
  bucket: Bucket,
  basis: CostBasis,
  level: CostItemDef["level"],
  serviceKey?: string,
  core?: boolean,
): CostItemDef => ({ key, label, group, bucket, basis, level, serviceKey, core });

export const COST_CATALOGUE: CostItemDef[] = [
  // Venue and ceremony
  item("venue_hire", "Venue hire", "venue_ceremony", "venue", "fixed", "minimum", undefined, true),
  item("exclusivity_fee", "Exclusivity fee", "venue_ceremony", "venue", "fixed", "minimum"),
  item("ceremony_fee", "Ceremony fee", "venue_ceremony", "venue", "fixed", "realistic"),
  item("furniture_setup", "Furniture and ceremony setup", "venue_ceremony", "venue", "fixed", "realistic", "ceremony_furniture"),
  item("extra_space_fees", "Additional space or layout fees", "venue_ceremony", "venue", "fixed", "complete"),
  // Food and drinks
  item("adult_menu", "Adult menu price", "food_drinks", "food", "per_adult", "minimum", "catering"),
  item("children_menu", "Children's menu price", "food_drinks", "food", "per_child", "realistic"),
  item("welcome_drinks", "Welcome drinks", "food_drinks", "food", "per_adult", "realistic", "welcome_drinks"),
  item("dinner_drinks", "Dinner drinks", "food_drinks", "food", "per_adult", "realistic", "drinks_package"),
  item("wine_package", "Wine package", "food_drinks", "food", "per_adult", "complete"),
  item("dessert_buffet", "Dessert buffet", "food_drinks", "food", "per_adult", "complete", "dessert_buffet"),
  item("wedding_cake", "Wedding cake", "food_drinks", "food", "fixed", "realistic", "wedding_cake"),
  item("open_bar", "Open bar", "food_drinks", "food", "per_adult", "complete", "open_bar"),
  item("additional_bar_hours", "Additional bar hours", "food_drinks", "food", "per_hour", "complete"),
  item("supplier_meals", "Supplier meals", "food_drinks", "supplier_meals", "per_supplier", "realistic", "supplier_meals"),
  // Entertainment and production
  item("dj", "DJ", "entertainment_production", "entertainment", "fixed", "realistic", "dj"),
  item("dj_equipment", "DJ equipment", "entertainment_production", "production", "fixed", "realistic", "dj_equipment"),
  item("sound_system", "Sound system", "entertainment_production", "production", "fixed", "realistic", "sound_system"),
  item("dance_lighting", "Dance lighting", "entertainment_production", "production", "fixed", "complete", "dance_lighting"),
  item("dance_floor", "Dance floor", "entertainment_production", "production", "fixed", "realistic", "dance_floor"),
  item("live_entertainment", "Live entertainment", "entertainment_production", "entertainment", "fixed", "complete"),
  item("av_equipment", "AV equipment", "entertainment_production", "production", "fixed", "complete"),
  // Styling and decoration
  item("flowers", "Flowers", "styling_decoration", "decoration", "fixed", "complete", "florist"),
  item("table_centrepieces", "Table centrepieces", "styling_decoration", "decoration", "fixed", "complete", "table_centrepieces"),
  item("table_decorations", "Table decorations", "styling_decoration", "decoration", "fixed", "complete", "table_decorations"),
  item("ceremony_decoration", "Ceremony decoration", "styling_decoration", "decoration", "fixed", "realistic"),
  item("stationery_menus", "Stationery and menus", "styling_decoration", "decoration", "fixed", "complete", "printed_menus"),
  item("furniture_linen_rentals", "Furniture and linen rentals", "styling_decoration", "decoration", "fixed", "realistic", "furniture"),
  // Planning and operations
  item("wedding_coordinator", "Wedding coordinator", "planning_operations", "coordination", "fixed", "realistic", "wedding_coordinator"),
  item("supplier_coordination", "External supplier coordination", "planning_operations", "coordination", "fixed", "realistic", "external_supplier_coordination"),
  item("setup_breakdown", "Setup and breakdown", "planning_operations", "staffing", "fixed", "realistic", "setup"),
  item("security", "Security", "planning_operations", "staffing", "fixed", "realistic", "security"),
  item("cleaning", "Cleaning", "planning_operations", "staffing", "fixed", "realistic", "cleaning"),
  item("additional_staffing", "Additional staffing", "planning_operations", "staffing", "fixed", "realistic", "staff"),
  // Other costs
  item("accommodation", "Accommodation", "other", "other", "fixed", "never", "accommodation"),
  item("transport", "Transport", "other", "other", "fixed", "complete"),
  item("fireworks", "Fireworks", "other", "other", "fixed", "never"),
  item("photography", "Photography", "other", "other", "fixed", "never", "photographer"),
  item("videography", "Videography", "other", "other", "fixed", "never", "videographer"),
  item("other_services", "Other optional services", "other", "other", "fixed", "complete"),
];

export const COST_ITEM_BY_KEY = new Map(COST_CATALOGUE.map((def) => [def.key, def]));

export type ServiceGroupId =
  | "food_drinks"
  | "entertainment_production"
  | "styling"
  | "ceremony"
  | "coordination"
  | "operations"
  | "guests";

export const SERVICE_GROUPS: { id: ServiceGroupId; label: string }[] = [
  { id: "food_drinks", label: "Food and drinks" },
  { id: "entertainment_production", label: "Entertainment and production" },
  { id: "styling", label: "Styling and decoration" },
  { id: "ceremony", label: "Ceremony" },
  { id: "coordination", label: "Coordination and suppliers" },
  { id: "operations", label: "Operations" },
  { id: "guests", label: "Guests and logistics" },
];

export interface ServiceDef {
  key: string;
  label: string;
  group: ServiceGroupId;
  /** The cost line an "additional" service is priced on, unless the entry names another. */
  defaultCostKey?: string;
}

const svc = (key: string, label: string, group: ServiceGroupId, defaultCostKey?: string): ServiceDef => ({
  key,
  label,
  group,
  defaultCostKey,
});

export const SERVICE_CATALOGUE: ServiceDef[] = [
  svc("catering", "Catering", "food_drinks", "adult_menu"),
  svc("drinks_package", "Drinks package", "food_drinks", "dinner_drinks"),
  svc("welcome_drinks", "Welcome drinks", "food_drinks", "welcome_drinks"),
  svc("wedding_cake", "Wedding cake", "food_drinks", "wedding_cake"),
  svc("dessert_buffet", "Dessert buffet", "food_drinks", "dessert_buffet"),
  svc("open_bar", "Open bar", "food_drinks", "open_bar"),
  svc("supplier_meals", "Supplier meals", "food_drinks", "supplier_meals"),
  svc("dj", "DJ", "entertainment_production", "dj"),
  svc("dj_equipment", "DJ equipment", "entertainment_production", "dj_equipment"),
  svc("sound_system", "Sound system", "entertainment_production", "sound_system"),
  svc("dance_lighting", "Dance lighting", "entertainment_production", "dance_lighting"),
  svc("dance_floor", "Dance floor", "entertainment_production", "dance_floor"),
  svc("florist", "Florist", "styling", "flowers"),
  svc("floral_arrangements", "Floral arrangements", "styling", "flowers"),
  svc("table_centrepieces", "Table centrepieces", "styling", "table_centrepieces"),
  svc("table_decorations", "Table decorations", "styling", "table_decorations"),
  svc("printed_menus", "Printed menus", "styling", "stationery_menus"),
  svc("seating_plan", "Seating plan", "styling"),
  svc("ceremony_furniture", "Ceremony furniture", "ceremony", "furniture_setup"),
  svc("ceremony_sound", "Ceremony sound equipment", "ceremony", "sound_system"),
  svc("photographer", "Photographer", "coordination", "photography"),
  svc("videographer", "Videographer", "coordination", "videography"),
  svc("wedding_coordinator", "Wedding coordinator", "coordination", "wedding_coordinator"),
  svc("external_supplier_coordination", "External supplier coordination", "coordination", "supplier_coordination"),
  svc("setup", "Setup", "operations", "setup_breakdown"),
  svc("breakdown", "Breakdown", "operations", "setup_breakdown"),
  svc("furniture", "Furniture", "operations", "furniture_linen_rentals"),
  svc("tableware", "Tableware", "operations", "furniture_linen_rentals"),
  svc("linen", "Linen", "operations", "furniture_linen_rentals"),
  svc("staff", "Staff", "operations", "additional_staffing"),
  svc("security", "Security", "operations", "security"),
  svc("cleaning", "Cleaning", "operations", "cleaning"),
  svc("accommodation", "Accommodation", "guests", "accommodation"),
  svc("wedding_night_room", "Couple's wedding-night room", "guests"),
  svc("rain_backup", "Rain backup space", "guests"),
];

export const SERVICE_BY_KEY = new Map(SERVICE_CATALOGUE.map((def) => [def.key, def]));

// Service groups the three rankings read.
export const FOOD_SERVICE_KEYS = ["catering", "drinks_package", "welcome_drinks", "wedding_cake", "dessert_buffet", "open_bar"];
export const OPERATIONS_SERVICE_KEYS = [
  "wedding_coordinator",
  "external_supplier_coordination",
  "setup",
  "breakdown",
  "furniture",
  "tableware",
  "linen",
  "staff",
  "supplier_meals",
  "security",
  "cleaning",
  "seating_plan",
  "printed_menus",
];
export const ACCOMMODATION_SERVICE_KEYS = ["accommodation", "wedding_night_room"];

/** Subjective criteria. Only ever filled in by us, never defaulted. */
export const RATING_CRITERIA: { key: string; label: string; hint: string }[] = [
  { key: "atmosphere", label: "Mediterranean atmosphere", hint: "Does it feel genuinely Mediterranean?" },
  { key: "setting", label: "Outdoor ceremony and setting", hint: "How beautiful is the ceremony space and surroundings?" },
  { key: "party_space", label: "Evening party space", hint: "Room and mood for dancing late." },
  { key: "food_quality", label: "Food and drinks quality", hint: "From tastings, reviews or menus." },
  { key: "capacity_feel", label: "Feels right for 80 adults", hint: "Full, not empty or cramped." },
  { key: "guest_experience", label: "Guest experience", hint: "Comfort, arrival, flow of the day." },
  { key: "accommodation", label: "Accommodation options", hint: "How meaningful are the stay options?" },
  { key: "logistics", label: "Guest logistics", hint: "Airports, transfers, distance." },
  { key: "coordination_quality", label: "Coordination quality", hint: "How capable the planning support seems." },
  { key: "english_support", label: "English-speaking support", hint: "Planning and day-of staff." },
  { key: "flexibility", label: "Flexibility", hint: "Suppliers, timings, changes." },
];
