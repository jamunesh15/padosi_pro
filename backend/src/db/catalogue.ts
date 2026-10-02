import type { Db } from "./client";
import { taskCategories, tasks } from "./schema";

type CatalogueTask = { id: string; name: string; description: string };
type CatalogueCategory = { id: string; name: string; tasks: CatalogueTask[] };

// Categories and task names follow padosipro.com/services; descriptions are our own.
export const CATALOGUE: CatalogueCategory[] = [
  {
    id: "errands",
    name: "Errands & Daily Tasks",
    tasks: [
      { id: "bill-payments", name: "Bill payments", description: "Electricity, water, gas and society bills paid on time." },
      { id: "courier-pickup", name: "Courier pickup & drop", description: "Parcels collected from your door and dropped where they need to go." },
      { id: "grocery-restocking", name: "Grocery pickup & restocking", description: "Your regular list bought and put away at home." },
      { id: "queue-standing", name: "Queue standing", description: "Someone waits in line at banks, offices and temples for you." },
      { id: "document-printing", name: "Printing, scanning & notary", description: "Documents printed, scanned or notarised and brought back." },
      { id: "gift-shopping", name: "Gift shopping & returns", description: "Gifts picked, wrapped and delivered, returns handled." },
    ],
  },
  {
    id: "home",
    name: "Home Services",
    tasks: [
      { id: "ac-servicing", name: "AC servicing & installation", description: "Seasonal service, gas top-up or a new unit fitted." },
      { id: "plumbing", name: "Plumbing repairs", description: "Leaks, blockages and new fittings sorted by a vetted plumber." },
      { id: "electrical-work", name: "Electrical work", description: "Wiring, switches and appliance faults fixed safely." },
      { id: "deep-cleaning", name: "Deep cleaning", description: "Kitchen, bathrooms or the whole home cleaned top to bottom." },
      { id: "pest-control", name: "Pest control", description: "Treatment for cockroaches, termites and more, with follow-up." },
      { id: "furniture-assembly", name: "Furniture assembly", description: "Beds, wardrobes and shelves put together and fixed in place." },
    ],
  },
  {
    id: "health",
    name: "Health & Medical",
    tasks: [
      { id: "doctor-appointments", name: "Doctor appointments", description: "Appointments booked and reminders set for the family." },
      { id: "lab-test-booking", name: "Lab test booking", description: "Home sample collection or a lab visit arranged." },
      { id: "medicine-refills", name: "Medicine pickup & refills", description: "Prescriptions refilled and delivered before they run out." },
      { id: "medical-reports", name: "Medical report collection", description: "Reports collected from labs and hospitals and shared with you." },
      { id: "insurance-claims", name: "Insurance claim help", description: "Claim forms, documents and follow-ups with the insurer." },
    ],
  },
  {
    id: "senior",
    name: "Senior Care",
    tasks: [
      { id: "daily-check-ins", name: "Daily check-in visits", description: "A regular visit to your parents, with an update after each one." },
      { id: "medicine-reminders", name: "Medicine reminders", description: "Doses tracked and stock refilled on time." },
      { id: "hospital-accompaniment", name: "Hospital visit accompaniment", description: "Someone goes along to appointments and hospital visits." },
      { id: "home-safety-check", name: "Home safety check", description: "Grab bars, lighting and trip hazards checked and fixed." },
      { id: "senior-digital-help", name: "Digital help for seniors", description: "Phones, video calls and payment apps set up and explained." },
    ],
  },
  {
    id: "travel",
    name: "Travel & Tourism",
    tasks: [
      { id: "flight-booking", name: "Flight booking & changes", description: "Flights booked, rescheduled or cancelled for you." },
      { id: "train-booking", name: "Train tickets & Tatkal", description: "Train bookings, including Tatkal and waitlist tracking." },
      { id: "hotel-booking", name: "Hotel & homestay booking", description: "Stays shortlisted to your budget and booked." },
      { id: "airport-transfers", name: "Airport pickup & drop", description: "A cab or driver arranged for your flight times." },
      { id: "visa-documents", name: "Visa documents", description: "Forms filled and documents prepared for your visa." },
    ],
  },
  {
    id: "tech",
    name: "Digital & Tech Help",
    tasks: [
      { id: "wifi-setup", name: "Wi-Fi & router setup", description: "New connection, router placement and coverage fixes." },
      { id: "device-setup", name: "Phone & laptop setup", description: "New devices set up, data moved and apps installed." },
      { id: "cctv-smart-home", name: "CCTV & smart home", description: "Cameras, smart locks and home automation installed." },
      { id: "data-backup", name: "Data backup & recovery", description: "Photos and files backed up, lost data recovered where possible." },
      { id: "online-payments-setup", name: "Online payment setup", description: "UPI and net banking set up safely, with a walkthrough." },
    ],
  },
];

export async function seedCatalogue(db: Db) {
  const categoryRows = CATALOGUE.map((category, index) => ({ id: category.id, name: category.name, sortOrder: index }));
  const taskRows = CATALOGUE.flatMap((category) =>
    category.tasks.map((task, index) => ({ ...task, categoryId: category.id, sortOrder: index })),
  );

  await db.transaction(async (tx) => {
    for (const row of categoryRows) {
      await tx.insert(taskCategories).values(row).onConflictDoUpdate({ target: taskCategories.id, set: row });
    }
    for (const row of taskRows) {
      await tx.insert(tasks).values(row).onConflictDoUpdate({ target: tasks.id, set: row });
    }
  });

  return { categories: categoryRows.length, tasks: taskRows.length };
}
