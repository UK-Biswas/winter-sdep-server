export const EVENT_TYPES = [
  "Winter Relief",
  "Donation",
  "Cleanup",
  "Plantation",
  "Food Drive",
  "Health Camp",
  "Education",
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isISODate(value) {
  if (!DATE_PATTERN.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function validateGuidelines(value, errors, output, partial) {
  if (value === undefined) return;

  if (!Array.isArray(value)) {
    errors.guidelines = "Guidelines must be a list of short notes.";
    return;
  }

  if (value.length > 20) {
    errors.guidelines = "Add at most 20 guidelines.";
    return;
  }

  const cleaned = value
    .map((item) => text(item))
    .filter(Boolean)
    .slice(0, 20);

  if (cleaned.some((item) => item.length > 500)) {
    errors.guidelines = "Each guideline must be 500 characters or fewer.";
    return;
  }

  output.guidelines = cleaned;
}


export function validateEventInput(body, { partial = false } = {}) {
  const payload = body && typeof body === "object" ? body : {};
  const errors = {};
  const output = {};

  if (!partial || payload.title !== undefined) {
    const title = text(payload.title);
    if (title.length < 5 || title.length > 120) {
      errors.title = "Title must be between 5 and 120 characters.";
    } else {
      output.title = title;
    }
  }

  if (!partial || payload.type !== undefined) {
    const type = text(payload.type);
    if (!EVENT_TYPES.includes(type)) {
      errors.type = `Type must be one of: ${EVENT_TYPES.join(", ")}.`;
    } else {
      output.type = type;
    }
  }

  if (!partial || payload.date !== undefined) {
    const date = text(payload.date);
    if (!isISODate(date)) {
      errors.date = "Date must use the YYYY-MM-DD format.";
    } else if (!partial && date < todayISO()) {
      errors.date = "Date must be today or later.";
    } else {
      output.date = date;
    }
  }

  if (!partial || payload.location !== undefined) {
    const location = text(payload.location);
    if (location.length < 3 || location.length > 160) {
      errors.location = "Location must be between 3 and 160 characters.";
    } else {
      output.location = location;
    }
  }

  if (!partial || payload.image !== undefined) {
    const image = text(payload.image);
    if (image.length > 2048 || !isHttpUrl(image)) {
      errors.image = "Image must be a valid http(s) URL.";
    } else {
      output.image = image;
    }
  }

  if (!partial || payload.description !== undefined) {
    const description = text(payload.description);
    if (description.length < 20 || description.length > 5000) {
      errors.description = "Description must be between 20 and 5000 characters.";
    } else {
      output.description = description;
    }
  }

  if (payload.time !== undefined) {
    const time = text(payload.time);
    if (time.length > 80) {
      errors.time = "Time must be 80 characters or fewer.";
    } else {
      output.time = time;
    }
  }

  if (payload.capacity !== undefined && payload.capacity !== null && payload.capacity !== "") {
    const capacity = Number(payload.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000) {
      errors.capacity = "Capacity must be a whole number between 1 and 100000.";
    } else {
      output.capacity = capacity;
    }
  }

  validateGuidelines(payload.guidelines, errors, output, partial);

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: output,
  };
}
