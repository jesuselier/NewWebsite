export const dynamic = "force-static";

export function GET() {
  // Use the same deployment-provided endpoints as @vercel/analytics/next.
  const config = JSON.parse(
    process.env.NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG ||
      process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG ||
      "{}",
  ).analytics || {};
  const options = {
    src: config.scriptSrc || "/_vercel/insights/script.js",
    viewEndpoint: config.viewEndpoint || "/_vercel/insights/view",
    eventEndpoint: config.eventEndpoint || "/_vercel/insights/event",
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
