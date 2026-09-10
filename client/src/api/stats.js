import { get } from "./http.js";

export function obterEstatisticas() {
  return get("/api/stats");
}
