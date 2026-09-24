"use client";
import { useEffect, useState } from "react";
export default function CopyBio({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 4000);
    return () => clearTimeout(timer);
  }, [status]);
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus("copied"); }
    catch { setStatus("error"); }
  }
  return <div><button className="text-link" type="button" onClick={copy}>{status === "copied" ? "Copied" : label}</button><span role="status" className={status === "error" ? "small-note" : "sr-only"}>{status === "copied" ? " Bio copied to clipboard." : status === "error" ? " Select and copy the bio text below." : ""}</span></div>;
}
