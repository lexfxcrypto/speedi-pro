// ⚠️ SYNC-WITH-WEB — If you edit this file, also update
// speedi/src/lib/services.ts in the web repo.
// Source of truth is web; this is a duplicate for offline availability in the native app.

export const SERVICE_CATEGORIES_LIST = [
  {
    id: "concierge",
    name: "Concierge",
    emoji: "🎩",
    services: [
      "Deliveries & Collections",
      "Shopping & Errands",
      "Help for Elderly",
      "Vehicle Errands",
      "Property Tasks",
      "Last Minute & Gifts",
      "Pet Errands",
      "Admin & Queuing",
    ],
  },
  {
    id: "beauty",
    name: "Beauty",
    emoji: "💇",
    services: [
      "Mobile Haircut",
      "Blow Dry",
      "Hair Colouring",
      "Hair Extensions",
      "Nails",
      "Gel Nails",
      "Lash Extensions",
      "Brows",
      "Eyebrow Threading",
      "Makeup",
      "Spray Tan",
      "Waxing",
      "Facials",
      "Microblading",
      "Massage",
    ],
  },
  {
    id: "fitness",
    name: "Fitness",
    emoji: "💪",
    services: [
      "Personal Training",
      "Group Fitness",
      "Yoga",
      "Pilates",
      "Boxing",
      "Nutrition Coaching",
      "Sports Massage",
      "Physiotherapist",
      "Strength & Conditioning",
      "Rehabilitation",
      "Mindfulness Coaching",
    ],
  },
  {
    id: "tutoring",
    name: "Tutoring",
    emoji: "📚",
    services: [
      "Maths",
      "English",
      "Science",
      "Languages",
      "Music Lessons",
      "Driving Theory",
      "Art Teacher",
      "Dance Teacher",
      "GCSE Tutoring",
      "A-Level Tutoring",
      "Coding",
    ],
  },
  {
    id: "petcare",
    name: "Pet Care",
    emoji: "🐾",
    services: [
      "Dog Walking",
      "Pet Sitting",
      "Grooming",
      "Training",
      "Cat Sitting",
      "Pet Taxi",
    ],
  },
  {
    id: "cleaning",
    name: "Cleaning",
    emoji: "🧹",
    services: [
      "Domestic Cleaning",
      "End of Tenancy",
      "Office Cleaning",
      "Carpet Cleaning",
      "Oven Cleaning",
      "Pressure Washing",
      "Ironing Service",
      "Regular Cleaning",
      "Deep Clean",
      "Laundry",
      "Airbnb Turnover",
    ],
  },
  {
    id: "catering",
    name: "Catering",
    emoji: "🍽️",
    services: [
      "Private Chef",
      "Event Catering",
      "Meal Prep",
      "Cake Making",
      "Bartender",
      "BBQ Catering",
      "Wedding Catering",
    ],
  },
  {
    id: "musicevents",
    name: "Music & Events",
    emoji: "🎵",
    services: [
      "Guitar Lessons",
      "Piano Lessons",
      "Singing Lessons",
      "DJ",
      "Live Music",
      "Photographer",
      "Videographer",
      "Event Planner",
      "Event Planning",
      "Wedding Planning",
      "Balloon Decorator",
      "Face Painter",
    ],
  },
  {
    id: "mobileauto",
    name: "Vehicle Care",
    emoji: "🚗",
    services: [
      "Mobile Valeting",
      "Full Valet",
      "Car Wrapping",
      "Window Tinting",
      "Mobile Car Wash",
      "Windscreen Repair",
      "Headlight Restoration",
    ],
  },
  {
    id: "flatpack",
    name: "Flat Pack Assembly",
    emoji: "🔧",
    services: [
      "Flat Pack Assembly",
      "Furniture Assembly",
      "Shelving",
      "TV Mounting",
    ],
  },
  {
    id: "wasteremoval",
    name: "Waste Removal",
    emoji: "🗑️",
    services: ["Rubbish Removal", "Garden Waste", "House Clearance", "Skip Hire"],
  },
  {
    id: "windowcleaning",
    name: "Window Cleaning",
    emoji: "🪟",
    services: ["Window Cleaning", "Gutter Cleaning", "Conservatory Cleaning"],
  },
  {
    id: "photography",
    name: "Photography",
    emoji: "📷",
    services: [
      "Portrait Photography",
      "Event Photography",
      "Product Photography",
      "Drone Photography",
    ],
  },
  {
    id: "gardening",
    name: "Gardening",
    emoji: "🌿",
    services: [
      "Gardener",
      "Lawn Care",
      "Hedge Trimming",
      "Tree Surgery",
      "Garden Design",
      "Artificial Grass",
    ],
  },
  {
    id: "removals",
    name: "Removals",
    emoji: "📦",
    services: [
      "Man with a Van",
      "House Removals",
      "Office Removals",
      "Furniture Delivery",
    ],
  },
  {
    id: "itsupport",
    name: "IT Support",
    emoji: "💻",
    services: [
      "Computer Repair",
      "Phone Repair",
      "WiFi Setup",
      "Smart Home Setup",
      "Data Recovery",
    ],
  },
  {
    id: "therapy",
    name: "Therapy & Wellbeing",
    emoji: "🧘",
    services: [
      "Massage Therapist",
      "Reflexologist",
      "Acupuncturist",
      "Reiki Practitioner",
      "Aromatherapist",
    ],
  },
  {
    id: "sport",
    name: "Sport & Fitness",
    emoji: "⚽",
    services: [
      "Personal Trainer",
      "Tennis Coach",
      "Padel Coach",
      "Golf Coach",
      "Swimming Coach",
      "Football Coach",
      "Boxing Coach",
      "Yoga Instructor",
      "Pilates Instructor",
      "Sports Massage",
    ],
  },
  {
    id: "delivery",
    name: "Delivery & Courier",
    emoji: "🚚",
    services: [
      "Same Day Delivery",
      "Man with a Van",
      "Courier",
      "Furniture Delivery",
      "eBay & Marketplace Collection",
      "Airport Transfer",
      "Removal Service",
      "Parcel Collection",
      "Food Delivery",
      "Grocery Run",
    ],
  },
  {
    id: "other",
    name: "Other",
    emoji: "⭐",
    services: [],
  },
];

// Flat map for backward compatibility
export const SERVICE_CATEGORIES: Record<string, string[]> = Object.fromEntries(
  SERVICE_CATEGORIES_LIST.map((c) => [c.name, c.services])
);

export const ALL_SERVICES = SERVICE_CATEGORIES_LIST.flatMap((c) => c.services);
export const SERVICE_CATEGORY_NAMES = SERVICE_CATEGORIES_LIST.map((c) => c.name);

export function getSameCategoryServices(service: string): string[] {
  for (const cat of SERVICE_CATEGORIES_LIST) {
    if (cat.services.includes(service)) return cat.services;
  }
  return [service];
}
