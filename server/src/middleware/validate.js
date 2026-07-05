// Zod-validate the request body; parsed data lands on req.validated for the controller.
// ZodError is handled centrally by errorHandler.
export const validate = (schema) => (req, res, next) => {
  req.validated = schema.parse(req.body);
  next();
};
