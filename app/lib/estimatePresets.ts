export type EstimateBusinessType = "commercial" | "residential";

export interface EstimatePreset {
  businessType: EstimateBusinessType;
  clientNameLabel: string;
  servicesSectionTitle: string;
  defaultServices: string[];
  defaultTerms: string;
}

const COMMERCIAL_SERVICES = [
  "Hood from inside and outside",
  "All filters",
  "Access panels to duct work (accessible area only)",
  "Rooftop fan (If safe access)",
  "Fire wall behind equipment",
  "ASTTBC Sticker",
  "Fire Dept Report",
  "Before/After pictures",
  "Eco unit maintenance",
  "Filter replacement",
];

const RESIDENTIAL_SERVICES = [
  "Site protection using interior poly-sheeting and stovetop drop cloths",
  "Surface degreasing of hood interior and exterior using residential-safe chemicals",
  "In-place detail cleaning of accessible fan blades/blower wheels",
  "Hand-wiping of in-suite ductwork up to the fire damper",
  "Mobile, off-site soak-tank cleaning of existing aluminum mesh filters",
  "Before and after photo documentation per unit",
];

const COMMERCIAL_TERMS =
  "Payment is due upon completion of service. Prices subject to change if scope of work differs from initial assessment.";

const RESIDENTIAL_TERMS = [
  "1. Payment Terms: 25% mobilization deposit required upon approval. Remaining balance strictly Net 30 upon project completion.",
  "2. Filter Replacements: Standard cleaning of existing filters is included. If existing filters are degraded beyond cleaning, replacement aluminum mesh filters will be billed separately at $25.00 per unit, subject to technician assessment and strap approval.",
  "3. Access Policy: If a unit is inaccessible or entry is refused by the tenant during the scheduled block, the unit will be bypassed and documented. Return visits for skipped units are subject to an additional mobilization fee.",
  "4. Scope Limits: Scope of work is strictly limited to the in-suite range hood and local ducting up to the fire damper. Central building exhaust shafts are excluded.",
].join("\n\n");

const ESTIMATE_PRESETS: Record<EstimateBusinessType, EstimatePreset> = {
  commercial: {
    businessType: "commercial",
    clientNameLabel: "Business Name",
    servicesSectionTitle: "Scope of Work — Commercial Vent Cleaning:",
    defaultServices: COMMERCIAL_SERVICES,
    defaultTerms: COMMERCIAL_TERMS,
  },
  residential: {
    businessType: "residential",
    clientNameLabel: "Client Name",
    servicesSectionTitle: "Scope of Work — Residential Vent Cleaning:",
    defaultServices: RESIDENTIAL_SERVICES,
    defaultTerms: RESIDENTIAL_TERMS,
  },
};

export function getEstimatePreset(
  businessType: EstimateBusinessType = "commercial",
): EstimatePreset {
  return ESTIMATE_PRESETS[businessType] || ESTIMATE_PRESETS.commercial;
}
