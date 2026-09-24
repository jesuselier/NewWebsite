"use client";
import { useState } from "react";
import { LINKS } from "@/lib/site";
export default function EmailTile() {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(LINKS.email);
      setMessage("Email copied.");
    } catch {
      setMessage(
        "Copy unavailable. Select the address above or use the email link.",
      );
    }
  }
  return (
    <div className="email-card">
      <span className="eyebrow">For business & collaborations</span>
      <a className="email-address" href={`mailto:${LINKS.email}`}>
        {LINKS.email}
        <span aria-hidden="true">↗</span>
      </a>
      <div className="email-actions">
        <button className="copy-button" type="button" onClick={copy}>
          Copy email
        </button>
        <span className="copy-status" role="status">
          {message}
        </span>
      </div>
    </div>
  );
}
