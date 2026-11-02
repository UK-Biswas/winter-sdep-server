export function notFound(req, res) {
  return res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must be valid JSON." });
  }

  console.error(error);

  return res.status(500).json({
    message: "Something went wrong while processing the request.",
  });
}
