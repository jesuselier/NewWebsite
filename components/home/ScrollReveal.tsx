"use client";

import { useEffect } from "react";

/**
 * Progressive, one-time reveal for homepage elements marked with data-reveal.
 *
 * Content is fully visible in the server HTML. Motion is only switched on
 * after hydration, never for visitors who prefer reduced motion, and never for
 * anything already on screen, so nothing flashes or stays hidden without JS.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const fold = window.innerHeight * 0.9;
    for (const element of elements) {
      if (element.getBoundingClientRect().top < fold) {
        element.dataset.revealed = "";
      }
    }
    root.dataset.motion = "on";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    for (const element of elements) {
      if (!("revealed" in element.dataset)) observer.observe(element);
    }
    return () => {
      observer.disconnect();
      delete root.dataset.motion;
    };
  }, []);
  return null;
}
