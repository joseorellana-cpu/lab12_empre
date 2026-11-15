// PART 1 - the API client module: the ONLY place that knows the API's address and how its errors look.
// No component writes a URL by hand; they all call these functions.
import axios from "axios";

// The base address in one place. A .env.local with VITE_API_URL wins; otherwise the course API (no trailing slash).
export const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/api";

// The one Axios instance: base URL, a timeout so a hung server does not leave the screen loading forever,
// and JSON as the expected answer.
export const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
  headers: { Accept: "application/json" },
});

/** GET /exams/ -> the array of exams. The signal lets the caller cancel the request. */
export function listExams({ signal } = {}) {
  return api.get("/exams/", { signal }).then((response) => response.data);
}

/** POST /exams/ with { title } -> the exam the server created. */
export function createExam(title) {
  return api.post("/exams/", { title }).then((response) => response.data);
}

/** DELETE /exams/<id>/ -> undefined. The API's paths end with a slash (as in DRF). */
export function deleteExam(id) {
  return api.delete(`/exams/${id}/`).then(() => undefined);
}

/** Turns anything the client can throw into ONE sentence in Spanish for the person. */
export function describeError(error) {
  const code = error?.code;
  const response = error?.response;

  if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
    return "La API tardó demasiado en responder. Inténtalo de nuevo en un momento.";
  }
  if (!response && code === "ERR_NETWORK") {
    return "No se pudo conectar con la API. Revisa que el servidor esté encendido y que este origen esté autorizado en CORS.";
  }
  if (response) {
    const { status, data } = response;
    if (status === 400 && data && typeof data === "object") {
      const fields = Object.entries(data).map(([field, messages]) => `${field}: ${[].concat(messages).join(" ")}`);
      return `Los datos no son válidos. ${fields.join(" ")}`;
    }
    if (status === 404) return "El recurso ya no existe en el servidor (quizá otra persona lo borró).";
    if (status >= 500) return `La API falló (error ${status}). Inténtalo de nuevo en unos minutos.`;
    return `La API rechazó la petición (estado ${status}).`;
  }
  return "Ocurrió un error inesperado al hablar con la API.";
}
