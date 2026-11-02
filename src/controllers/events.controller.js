import { getEventsCollection } from "../db/mongo.js";
import { parseObjectId, serializeEvent } from "../models/event.js";
import { validateEventInput } from "../utils/validate-event.js";

function sortEvents(a, b) {
  return a.date.localeCompare(b.date);
}

function sendValidationError(res, errors) {
  return res.status(400).json({
    message: "Please correct the highlighted fields.",
    errors,
  });
}

async function findEvent(id) {
  const objectId = parseObjectId(id);

  if (!objectId) return { objectId: null, event: null };

  const event = await getEventsCollection().findOne({ _id: objectId });

  return { objectId, event };
}

export async function listEvents(req, res) {
  const events = await getEventsCollection().find({}).toArray();

  events.sort(sortEvents);

  return res.json(events.map((event) => serializeEvent(event, req.user?.id)));
}

export async function getEvent(req, res) {
  const { event } = await findEvent(req.params.id);

  if (!event) {
    return res.status(404).json({ message: "Event not found." });
  }

  return res.json(serializeEvent(event, req.user?.id));
}

export async function listMyEvents(req, res) {
  const events = await getEventsCollection()
    .find({ organizerId: req.user.id })
    .toArray();

  events.sort(sortEvents);

  return res.json(events.map((event) => serializeEvent(event, req.user.id)));
}

export async function listJoinedEvents(req, res) {
  const events = await getEventsCollection()
    .find({ "joinedUsers.userId": req.user.id })
    .toArray();

  events.sort(sortEvents);

  return res.json(events.map((event) => serializeEvent(event, req.user.id)));
}

export async function createEvent(req, res) {
  const { valid, errors, value } = validateEventInput(req.body);

  if (!valid) return sendValidationError(res, errors);

  if (!req.user.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = new Date().toISOString();
  const document = {
    ...value,
    host: req.user.name || req.user.email.split("@")[0],
    organizerId: req.user.id,
    organizerEmail: req.user.email,
    joinedUsers: [],
    joinedCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getEventsCollection().insertOne(document);
  document._id = result.insertedId;

  return res.status(201).json(serializeEvent(document, req.user.id));
}

export async function updateEvent(req, res) {
  const { event } = await findEvent(req.params.id);

  if (!event) {
    return res.status(404).json({ message: "Event not found." });
  }

  if (event.organizerId !== req.user.id) {
    return res.status(403).json({
      message: "Only the organizer who created this event can edit it.",
    });
  }

  const { valid, errors, value } = validateEventInput(req.body, {
    partial: true,
  });

  if (!valid) return sendValidationError(res, errors);

  if (Object.keys(value).length === 0) {
    return res.status(400).json({ message: "No valid fields were provided." });
  }

  const updated = await getEventsCollection().findOneAndUpdate(
    { _id: event._id },
    { $set: { ...value, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );

  return res.json(serializeEvent(updated, req.user.id));
}

export async function deleteEvent(req, res) {
  const { event } = await findEvent(req.params.id);

  if (!event) {
    return res.status(404).json({ message: "Event not found." });
  }

  if (event.organizerId !== req.user.id) {
    return res.status(403).json({
      message: "Only the organizer who created this event can delete it.",
    });
  }

  await getEventsCollection().deleteOne({ _id: event._id });

  return res.json({ deleted: true, id: event._id.toString() });
}

export async function joinEvent(req, res) {
  const { objectId, event } = await findEvent(req.params.id);

  if (!objectId || !event) {
    return res.status(404).json({ message: "Event not found." });
  }

  const alreadyJoined = (event.joinedUsers || []).some(
    (member) => member.userId === req.user.id
  );

  if (alreadyJoined) {
    return res.json(serializeEvent(event, req.user.id));
  }

  const joinedCount = Math.max(
    (event.joinedUsers || []).length,
    Number(event.joinedCount) || 0
  );

  if (event.capacity && joinedCount >= event.capacity) {
    return res.status(409).json({
      message: "This event has reached capacity.",
    });
  }

  const joinedAt = new Date().toISOString();

  await getEventsCollection().updateOne(
    { _id: objectId, "joinedUsers.userId": { $ne: req.user.id } },
    {
      $push: {
        joinedUsers: {
          userId: req.user.id,
          name: req.user.name || req.user.email.split("@")[0],
          email: req.user.email,
          joinedAt,
        },
      },
      $inc: { joinedCount: 1 },
      $set: { updatedAt: joinedAt },
    }
  );

  const updated = await getEventsCollection().findOne({ _id: objectId });

  return res.json(serializeEvent(updated, req.user.id));
}

export async function leaveEvent(req, res) {
  const { objectId, event } = await findEvent(req.params.id);

  if (!objectId || !event) {
    return res.status(404).json({ message: "Event not found." });
  }

  const joined = (event.joinedUsers || []).some(
    (member) => member.userId === req.user.id
  );

  if (!joined) {
    return res.json(serializeEvent(event, req.user.id));
  }

  const updatedAt = new Date().toISOString();

  await getEventsCollection().updateOne(
    { _id: objectId, "joinedUsers.userId": req.user.id },
    [
      {
        $set: {
          joinedUsers: {
            $filter: {
              input: { $ifNull: ["$joinedUsers", []] },
              as: "member",
              cond: { $ne: ["$$member.userId", req.user.id] },
            },
          },
          updatedAt,
        },
      },
      {
        $set: {
          joinedCount: {
            $max: [
              0,
              {
                $subtract: [{ $ifNull: ["$joinedCount", 0] }, 1],
              },
            ],
          },
        },
      },
    ]
  );

  const updated = await getEventsCollection().findOne({ _id: objectId });

  return res.json(serializeEvent(updated, req.user.id));
}
