// Throw this from services/controllers for expected, client-facing failures.
// The error middleware turns it into a clean JSON response.
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
