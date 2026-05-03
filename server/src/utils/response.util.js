export const sendSuccess = (
  res,
  { statusCode = 200, message, data } = {}
) => {
  res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    ...(typeof data !== "undefined" ? { data } : {}),
  });
};