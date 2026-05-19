export const error = (res, statusCode, message) => {
  if (typeof res.json === "function") {
    res.json({ error: message }, statusCode);
    return;
  }

  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: message }));
};

export const notFound = (res) => {
  error(res, 404, "Not Found");
};

export const internalError = (res) => {
  error(res, 500, "Internal Server Error");
};
