import { connectToMongoDB, closeMongoDB, getDb, ensureIndexes } from "../db/mongo.js";

const winterImage =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1.3-FeSOGHGjRQDAym7ahSnVVzlUgUDpZ1.png";
const blanketImage =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1.2-OwsxZ1nnN1mmIxVe7zUErKeQiS1lKj.png";
const cleanupImage =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1.1-pJGVQSdJU5zoWd94IT4POn6yUqV6tO.png";

function addDaysISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export const seedEvents = [
  {
    seedKey: "demo-winter-clothes",
    title: "Winter Clothes Distribution",
    type: "Winter Relief",
    date: addDaysISO(5),
    time: "9:00 AM – 1:00 PM",
    location: "Mirpur 10, Dhaka",
    host: "Mirpur Youth Volunteers",
    image: winterImage,
    description:
      "Collecting and distributing warm clothes, jackets, sweaters, and shawls to underprivileged families, rickshaw pullers, and children facing the cold.",
    joinedCount: 42,
    capacity: 60,
    guidelines: [
      "Arrive by 8:45 AM so the sorting teams can brief you.",
      "Wear warm, comfortable clothing you can move in.",
      "Bring one reusable bag for packing relief kits.",
      "Keep the distribution line calm — families are waiting in the cold.",
    ],
    createdAt: addDaysISO(-9),
  },
  {
    seedKey: "demo-blanket-night",
    title: "Blanket Night for Neighbors",
    type: "Donation",
    date: addDaysISO(9),
    time: "8:00 PM – 11:00 PM",
    location: "Mohammadpur, Dhaka",
    host: "Mohammadpur Care Circle",
    image: blanketImage,
    description:
      "A night-time blanket distribution drive for pavement dwellers, orphans, and senior citizens across the Mohammadpur belt.",
    joinedCount: 68,
    capacity: 80,
    guidelines: [
      "Meet at the Care Circle office by 7:45 PM.",
      "Carry a torch or use your phone light — the lanes are dim.",
      "Pair up; nobody walks a lane alone at night.",
    ],
    createdAt: addDaysISO(-7),
  },
  {
    seedKey: "demo-lake-cleanup",
    title: "Dhanmondi Lake Clean-Up Campaign",
    type: "Cleanup",
    date: addDaysISO(13),
    time: "7:00 AM – 10:30 AM",
    location: "Dhanmondi Lake, Dhaka",
    host: "Green Dhaka Youth",
    image: cleanupImage,
    description:
      "Join local volunteers with gloves, bags, and tools to clear plastic waste from the walkways and the lakeside.",
    joinedCount: 31,
    capacity: 50,
    guidelines: [
      "Wear closed shoes and clothes you do not mind staining.",
      "Gloves and bags are provided — bring a water bottle.",
      "Sort recyclables into the marked sacks as you go.",
    ],
    createdAt: addDaysISO(-5),
  },
  {
    seedKey: "demo-warm-meals",
    title: "Warm Meals, Kind Hearts",
    type: "Food Drive",
    date: addDaysISO(18),
    time: "12:00 PM – 3:00 PM",
    location: "Farmgate, Dhaka",
    host: "Open Table Bangladesh",
    image:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=900&q=80",
    description:
      "Share nourishing hot meals with people experiencing food insecurity this winter, served with dignity and a warm conversation.",
    joinedCount: 54,
    capacity: 70,
    guidelines: [
      "Food handling gloves are mandatory — collect them at the desk.",
      "Serve one plate per person, then offer a refill.",
      "Ask before photographing anyone.",
    ],
    createdAt: addDaysISO(-4),
  },
  {
    seedKey: "demo-winter-seedlings",
    title: "Winter Seedling Project",
    type: "Plantation",
    date: addDaysISO(24),
    time: "8:30 AM – 12:00 PM",
    location: "Uttara Sector 7, Dhaka",
    host: "Green Roots Collective",
    image:
      "https://images.unsplash.com/photo-1534710961216-75c88202f43e?auto=format&fit=crop&w=900&q=80",
    description:
      "Plant native saplings along the sector walkways and learn a simple watering routine to keep them alive through the dry weeks.",
    joinedCount: 26,
    capacity: 40,
    guidelines: [
      "Bring a trowel if you have one; spares are limited.",
      "Wear gloves — the soil is cold and sharp in places.",
      "Each volunteer plants at least two saplings before leaving.",
    ],
    createdAt: addDaysISO(-3),
  },
  {
    seedKey: "demo-health-camp",
    title: "Community Health Camp",
    type: "Health Camp",
    date: addDaysISO(30),
    time: "9:00 AM – 4:00 PM",
    location: "Mirpur 1, Dhaka",
    host: "City Health Alliance",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80",
    description:
      "A free day of basic checkups, winter respiratory screening, and medicine support for families who cannot reach a clinic easily.",
    joinedCount: 39,
    capacity: 120,
    guidelines: [
      "Volunteers without a medical background will guide the queue.",
      "Bring a valid ID if you are registering patients.",
      "Keep patient details confidential — no photos of records.",
    ],
    createdAt: addDaysISO(-2),
  },
  {
    seedKey: "demo-book-drive",
    title: "Children's Book & Bag Drive",
    type: "Education",
    date: addDaysISO(36),
    time: "10:00 AM – 2:00 PM",
    location: "Dhanmondi, Dhaka",
    host: "Storybox Foundation",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80",
    description:
      "Collecting storybooks, notebooks, and school bags for children in the neighborhood who are starting the new term without supplies.",
    joinedCount: 22,
    capacity: 50,
    guidelines: [
      "Bring one gently used book if you can — every book finds a reader.",
      "Help pack bags by age group at the sorting table.",
      "No photographs of children without a guardian's consent.",
    ],
    createdAt: addDaysISO(-1),
  },
  {
    seedKey: "demo-rooftop-garden",
    title: "Rooftop Garden Workshop",
    type: "Plantation",
    date: addDaysISO(41),
    time: "4:00 PM – 6:30 PM",
    location: "Lalmatia, Dhaka",
    host: "Green Roots Collective",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80",
    description:
      "A hands-on afternoon building winter-friendly planter boxes and learning which greens thrive on a Dhaka rooftop.",
    joinedCount: 14,
    capacity: 30,
    guidelines: [
      "Wear clothes that can handle soil and compost.",
      "Bring a small container to take a seedling home.",
      "Workshop is on a rooftop — closed shoes only.",
    ],
    createdAt: addDaysISO(-1),
  },
  {
    seedKey: "demo-story-evening",
    title: "Blanket & Story Evening",
    type: "Donation",
    date: addDaysISO(47),
    time: "6:00 PM – 9:00 PM",
    location: "Old Dhaka",
    host: "Dhaka Care Circle",
    image:
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=900&q=80",
    description:
      "An evening of shared stories and blanket handovers, closing with tea for everyone who spent the season showing up.",
    joinedCount: 33,
    capacity: 60,
    guidelines: [
      "Bring a folded blanket if you have a spare one.",
      "The courtyard is cold after 8 PM — dress in layers.",
      "Help stack chairs and clear cups before leaving.",
    ],
    createdAt: addDaysISO(-1),
  },
];

async function run() {
  await connectToMongoDB();

  const db = getDb();
  await ensureIndexes(db);

  const ownerEmail = process.env.SEED_OWNER_EMAIL?.trim();
  const users = db.collection("user");
  const owner = ownerEmail
    ? await users.findOne({ email: ownerEmail })
    : await users.findOne({});

  if (!owner) {
    throw new Error(
      "No user found to own the seeded events. Sign up in the app, or set SEED_OWNER_EMAIL."
    );
  }

  const events = db.collection("events");
  let created = 0;

  for (const { seedKey, joinedCount, createdAt, ...event } of seedEvents) {
    const result = await events.updateOne(
      { seedKey },
      {
        $set: {
          ...event,
          seedKey,
          organizerId: String(owner._id),
          organizerEmail: owner.email,
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          joinedUsers: [],
          joinedCount,
          createdAt,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) created += 1;
  }

  console.log(
    `Seed complete: ${created} new event(s), ${seedEvents.length} total seeded records. Owner: ${owner.email}`
  );
}

run()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeMongoDB();
  });
