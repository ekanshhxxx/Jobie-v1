/* eslint-disable */
// @ts-nocheck
const BASE_URL = "http://localhost:4000/api";

async function request(path: string, method = "GET", body?: any, token?: string) {

  const headers: any = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export const api = {
  get: (path: string, token?: string) => request(path, "GET", undefined, token),
  post: (path: string, body?: any, token?: string) => request(path, "POST", body, token),
  put: (path: string, body?: any, token?: string) => request(path, "PUT", body, token),
  delete: (path: string, token?: string) => request(path, "DELETE", undefined, token),
};

