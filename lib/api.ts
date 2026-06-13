"use client";

import type { PassageRequest, PassageResponse } from "./types";

export async function fetchPassage(req: PassageRequest): Promise<PassageResponse> {
  const res = await fetch("/api/passage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await res.json()) as PassageResponse;
}
