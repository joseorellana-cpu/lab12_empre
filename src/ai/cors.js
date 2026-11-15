// Fix 1: no wildcard. Only the project's origin, exact scheme + host + port.
export const corsPolicy = {
  allowedOrigins: ["http://localhost:5173"],
  allowCredentials: false,
};
