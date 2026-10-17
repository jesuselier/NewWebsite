/* Production-only behaviour for the static Swarm page. scripts/build-swarm-site.mjs copies this file
   into public/swarm-site/ and loads it on every Swarm page; the design lab copy never loads it. */
(() => {
  // Off joinswarm.ai (Vercel previews, localhost) the clean /terms, /privacy and /refunds URLs and the
  // Swarm home at / do not exist, so point those links at the files and at /swarm instead.
  if (!/(^|\.)joinswarm\.ai$/.test(location.hostname)) {
    for (const a of document.querySelectorAll('a[href="/terms"], a[href="/privacy"], a[href="/refunds"]')) {
      a.href = `/swarm-site${a.getAttribute("href")}.html`;
    }
    for (const a of document.querySelectorAll('a[href="/"], a[href^="/#"]')) {
      a.href = `/swarm${a.getAttribute("href").slice(1)}`;
    }
  }

  // The launch video plays here in YouTube's privacy-enhanced player, loaded only after a click.
  // Without this script (or with a modifier key held) the links still open YouTube.
  const VIDEO = "n15W6X84IGg";
  const links = document.querySelectorAll(`a[href^="https://youtu.be/${VIDEO}"]`);
  if (!links.length || typeof HTMLDialogElement !== "function") return;

  let dialog, frame, opener;
  function build() {
    dialog = document.createElement("dialog");
    dialog.className = "yt";
    dialog.setAttribute("aria-label", "Why I built Swarm, the launch video");
    dialog.innerHTML =
      '<div class="yt-in"><button class="yt-x" type="button">Close video</button><div class="yt-frame"></div></div>';
    frame = dialog.querySelector(".yt-frame");
    dialog.querySelector(".yt-x").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      frame.replaceChildren(); // stops playback
      if (opener) opener.focus();
    });
    document.body.append(dialog);
  }

  function play(link) {
    if (!dialog) build();
    const start = parseInt(new URL(link.href).searchParams.get("t") || "0", 10) || 0;
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${VIDEO}?autoplay=1&rel=0&playsinline=1${start ? `&start=${start}` : ""}`;
    iframe.title = "Why I built Swarm, Jesus Martinez (YouTube video)";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    frame.replaceChildren(iframe);
    opener = link;
    dialog.showModal();
  }

  for (const a of links) {
    a.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      play(a);
    });
    // The lab copy tells screen readers these links open YouTube in a new tab; here they play on the page.
    const label = a.getAttribute("aria-label");
    if (label) a.setAttribute("aria-label", label.replace("opens YouTube in a new tab", "plays on this page"));
    for (const s of a.querySelectorAll(".sr-only")) {
      s.textContent = s.textContent.replace("opens YouTube in a new tab", "plays on this page");
    }
  }
  // A sibling note on the video card says the same thing.
  for (const s of document.querySelectorAll(".sr-only")) {
    s.textContent = s.textContent.replace("(opens YouTube in a new tab)", "(plays on this page)");
  }
})();
