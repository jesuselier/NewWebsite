export const dynamic = "force-static";

function absolutePath(value: string) {
  return value.startsWith("/") || /^https?:\/\//.test(value)
    ? value
    : `/${value}`;
}

export function GET() {
  // Use the same deployment-provided endpoints as @vercel/analytics/next.
  const config = JSON.parse(
    process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG ||
      process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG ||
      "{}",
  ).analytics || {};
  const options = {
    src: absolutePath(config.scriptSrc || "/_vercel/insights/script.js"),
    viewEndpoint: absolutePath(config.viewEndpoint || "/_vercel/insights/view"),
    eventEndpoint: absolutePath(config.eventEndpoint || "/_vercel/insights/event"),
  };

  return new Response(
    `(() => {
      const options = ${JSON.stringify(options)};
      const script = document.createElement("script");
      script.src = options.src;
      script.dataset.viewEndpoint = options.viewEndpoint;
      script.dataset.eventEndpoint = options.eventEndpoint;
      script.defer = true;
      document.head.appendChild(script);
    })();`,
    {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    },
  );
}
