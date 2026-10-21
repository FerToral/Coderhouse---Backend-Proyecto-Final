export const ERROR_CATALOG = Object.freeze({
  400: { code: "INVALID_INPUT", message: "Invalid request" },
  401: { code: "AUTHENTICATION_REQUIRED", message: "Login required" },
  403: { code: "FORBIDDEN", message: "Access forbidden" },
  404: { code: "NOT_FOUND", message: "Resource not found" },
  409: { code: "CONFLICT", message: "Resource conflict" },
  413: { code: "PAYLOAD_TOO_LARGE", message: "Payload too large" },
  500: { code: "INTERNAL_ERROR", message: "Internal server error" },
  503: { code: "SERVICE_UNAVAILABLE", message: "Service unavailable" },
});
export function describeError(error) {
  const raw =
    error.code === 11000
      ? 409
      : ["CastError", "ValidationError"].includes(error.name)
        ? 400
        : Number(error.status) || 500;
  const status = Number.isInteger(raw) && raw >= 400 && raw <= 599 ? raw : 500;
  const entry = ERROR_CATALOG[status] || ERROR_CATALOG[500];
  return {
    status,
    code: entry.code,
    message: status >= 500 ? entry.message : error.message || entry.message,
  };
}
