import { ObjectId } from "mongodb";

export function parseObjectId(value) {
  if (typeof value !== "string" || !ObjectId.isValid(value)) return null;

  const id = new ObjectId(value);

  if (id.toHexString() !== value.toLowerCase()) return null;

  return id;
}

function toISOString(value) {
  if (!value) return undefined;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }

  if (typeof value === "string") return value;

  return undefined;
}


export function serializeEvent(doc, userId) {
  const joinedUsers = Array.isArray(doc.joinedUsers) ? doc.joinedUsers : [];
  const joinedEntry = userId
    ? joinedUsers.find((entry) => entry.userId === userId)
    : null;
  const storedCount = Number.isFinite(doc.joinedCount)
    ? Number(doc.joinedCount)
    : 0;

  return {
    _id: doc._id.toString(),
    id: doc._id.toString(),

    title: doc.title,
    type: doc.type,
    date: doc.date,
    time: doc.time || undefined,
    location: doc.location,
    host: doc.host,
    image: doc.image,
    description: doc.description,

    organizerId: doc.organizerId,
    organizerEmail: doc.organizerEmail,
    joinedCount: Math.max(joinedUsers.length, storedCount),
    capacity: doc.capacity ?? undefined,
    guidelines: Array.isArray(doc.guidelines) ? doc.guidelines : [],
    createdAt: toISOString(doc.createdAt),
    updatedAt: toISOString(doc.updatedAt),

    joinedAt: joinedEntry?.joinedAt,
    isOwner: Boolean(userId && doc.organizerId === userId),
  };
}
