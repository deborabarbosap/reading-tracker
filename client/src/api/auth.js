import { post } from "./http.js";

export function login(username, password) {
  return post("/api/login", { username, password });
}
