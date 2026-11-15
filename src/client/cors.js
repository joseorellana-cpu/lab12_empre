// PART 2 - the CORS policy of the API.
// In the real project this is django-cors-headers: CORS_ALLOWED_ORIGINS in settings.py. Here it is the object that
// the simulated network (and the headless client's fake server) consult before answering a browser.
//
// Team decision (written in the deliverable): only the origin where `npm run dev` serves this app.
// Exact scheme + host + port, no trailing slash, no wildcard. Another port of localhost is another origin.
export const corsPolicy = {
  allowedOrigins: ["http://localhost:5173"],
  allowCredentials: false,
};
