"use client";

import type { Passage, PassageRequest, PassageResponse, VerificationResult } from "./types";

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

export interface StreamMeta {
  interestId: string;
  interestLabel: string;
  grade: number;
  band: string;
}

export interface StreamHandlers {
  onMeta?: (meta: StreamMeta) => void;
  onToken?: (text: string) => void;
  onComplete: (passage: Passage, note?: string) => void;
  onVerified?: (verification: VerificationResult) => void;
  onError?: (message: string) => void;
}

/**
 * Consume the SSE stream from /api/passage/stream, dispatching events to handlers.
 * Resolves when the stream closes. Throws on transport failure (caller can fall back).
 */
export async function streamPassage(req: PassageRequest, handlers: StreamHandlers): Promise<void> {
  const res = await fetch("/api/passage/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok || !res.body) throw new Error(`Stream request failed (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) >= 0) {
      const chunk = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      let event = "message";
      let data = "";
      for (const line of chunk.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;

      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(data);
      } catch {
        continue;
      }

      switch (event) {
        case "meta":
          handlers.onMeta?.(payload as unknown as StreamMeta);
          break;
        case "token":
          handlers.onToken?.((payload.text as string) ?? "");
          break;
        case "complete":
          handlers.onComplete(payload.passage as Passage, payload.note as string | undefined);
          break;
        case "verified":
          handlers.onVerified?.(payload.verification as VerificationResult);
          break;
        case "error":
          handlers.onError?.((payload.message as string) ?? "Generation failed.");
          break;
      }
    }
  }
}
