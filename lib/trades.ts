// ⚠️ SYNC-WITH-WEB — If you edit this file, also update
// speedi/src/lib/trades.ts in the web repo.
// Source of truth is web; this is a duplicate for offline availability in the native app.

export const TRADE_CATEGORIES: Record<string, string[]> = {
  "Plumbing & Heating": [
    "Plumber",
    "Gas Engineer",
    "Heating Engineer",
    "Boiler Installation",
    "Boiler Repair",
    "Boiler Service",
    "Central Heating",
    "Underfloor Heating",
    "Bathroom Fitting",
    "Wet Room Installation",
    "Leak Detection & Repair",
    "Drain Unblocking",
    "Water Softener Installation",
    "Hot Water Cylinders",
    "Gas Safety Checks",
    "Radiator Installation",
    "Pipe Fitting",
    "Emergency Callouts",
  ],
  "Electrical": [
    "Electrician",
    "Rewiring",
    "Consumer Unit Upgrade",
    "Socket & Switch Installation",
    "EV Charger Installation",
    "Lighting Design & Fitting",
    "Security Lighting",
    "Solar Panel Installation",
    "PAT Testing",
    "Fault Finding",
    "Smart Home Installation",
    "Fire Alarm Installation",
    "Emergency Electrician",
  ],
  "Building & Construction": [
    "General Builder",
    "Bricklayer",
    "Plasterer",
    "Dry Liner",
    "Renderer",
    "Groundworker",
    "Concrete Specialist",
    "Underpinning",
    "Structural Engineer",
    "Extensions",
    "Loft Conversions",
    "New Builds",
    "Structural Work",
    "Brick & Blockwork",
    "Concrete Work",
    "Garage Conversion",
    "Porch Building",
    "Demolition",
    "Groundwork",
  ],
  "Roofing & Exterior": [
    "Roofer",
    "Flat Roofer",
    "Fascias & Soffits",
    "Guttering",
    "Chimney Specialist",
    "Cladding",
    "Pointing & Repointing",
    "Roof Repair",
    "Roof Replacement",
    "Flat Roofing",
    "Chimney Repair",
    "Velux Windows",
    "Render",
  ],
  "Carpentry & Joinery": [
    "Carpenter",
    "Joiner",
    "Kitchen Fitter",
    "Bedroom Fitter",
    "Flooring Specialist",
    "Skirting & Architrave",
    "Staircase Specialist",
    "Door Hanging",
    "Window Fitting",
    "Kitchen Fitting",
    "Fitted Wardrobes",
    "Staircase",
    "Doors & Frames",
    "Flooring",
  ],
  "Decorating & Finishing": [
    "Painter & Decorator",
    "Wallpaper Specialist",
    "Tiler",
    "Coving & Cornice",
    "Polished Plaster",
    "Interior Painting",
    "Exterior Painting",
    "Wallpapering",
    "Plastering",
    "Tiling",
    "Floor Sanding",
  ],
  "Landscaping & Outdoors": [
    "Landscaper",
    "Gardener",
    "Tree Surgeon",
    "Driveway & Paving",
    "Fencing",
    "Decking",
    "Artificial Grass",
    "Irrigation Systems",
    "Garden Design",
    "Lawn Care",
    "Hedge Trimming",
    "Tree Surgery",
    "Patio & Paving",
  ],
  "Security & Access": [
    "CCTV Installation",
    "Alarm Systems",
    "Locksmith",
    "Access Control",
    "Door Entry Systems",
  ],
  "Home Services": [
    "Handyman",
    "Glazier",
    "Appliance Repair",
    "Furniture Assembly",
    "Flat Pack Builder",
    "TV Mounting",
    "IT & Network Installation",
    "Waste Removal",
    "Aerial & Satellite",
    "IT Support",
  ],
  "Cleaning": [
    "Domestic Cleaner",
    "Commercial Cleaner",
    "End of Tenancy Clean",
    "Window Cleaner",
    "Carpet & Upholstery Cleaning",
    "Pressure Washing",
    "Domestic Cleaning",
    "Office Cleaning",
    "Window Cleaning",
    "Oven Cleaning",
    "Gutter Cleaning",
  ],
  "Vehicle": [
    "Mobile Car Wash",
    "Mobile Mechanic",
    "Mobile Tyre Fitting",
  ],
  "Other": [
    "Asbestos Removal",
    "Damp Proofing",
    "Waterproofing",
    "Insulation",
    "Cavity Wall",
    "Loft Conversion",
    "Extension Specialist",
    "HVAC / Air Conditioning",
    "Heat Pump Installation",
    "Swimming Pool Engineer",
    "Lift & Stair Lift",
    "Disabled Adaptations",
    "Surveyor",
    "Pest Control",
  ],
};

export const ALL_TRADES = Object.values(TRADE_CATEGORIES).flat();
export const CATEGORY_NAMES = Object.keys(TRADE_CATEGORIES);

/** Given a trade name, return all trades in the same category */
export function getSameCategoryTrades(trade: string): string[] {
  for (const trades of Object.values(TRADE_CATEGORIES)) {
    if (trades.includes(trade)) return trades;
  }
  return [trade];
}

/** Given a trade name, return its category */
export function getCategory(trade: string): string | null {
  for (const [cat, trades] of Object.entries(TRADE_CATEGORIES)) {
    if (trades.includes(trade)) return cat;
  }
  return null;
}

/** Check if two trades are in the same category */
export function tradesRelated(a: string, b: string): boolean {
  const catA = getCategory(a);
  const catB = getCategory(b);
  return catA !== null && catA === catB;
}
