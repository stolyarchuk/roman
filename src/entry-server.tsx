import React from "react";
import { renderToReadableStream } from "react-dom/server";
import { RouterApp } from "./router";
import { contentByLocale } from "./content";
import manifest from "./ssr-manifest.json";

export type Env = {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
};

const RU_COUNTRY_CODE = "RU";

const GetCountryCode = (request: Request): string | null => {
  const headerValue = request.headers.get("cf-ipcountry");
  if (headerValue) {
    return headerValue.toUpperCase();
  }

  const cfCountry = (request as Request & { cf?: { country?: string } }).cf
    ?.country;
  return cfCountry?.toUpperCase() ?? null;
};

const GetTargetPath = (countryCode: string | null): string => {
  return countryCode === RU_COUNTRY_CODE ? "/ru/" : "/en/";
};

const getClientEntry = (): string => {
  // Manifest produced by client build maps entries to hashed files.
  // Try the common `index.html` entry first, otherwise fallback to the first file.
  if ((manifest as any)["index.html"]?.file) {
    return "/" + (manifest as any)["index.html"].file;
  }

  const entries = Object.values(manifest as Record<string, any>);
  if (entries.length > 0 && entries[0].file) {
    return "/" + entries[0].file;
  }

  // Fallback - we expect `index.js` is served as `/assets/index.js` by the client build
  return "/assets/index.js";
};

export async function handleRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);

  // Keep the previous redirect for `/`
  if (url.pathname === "/" || url.pathname === "/index.html") {
    const countryCode = GetCountryCode(request);
    const targetPath = GetTargetPath(countryCode);
    const targetUrl = new URL(targetPath, url);
    targetUrl.search = url.search;
    return Response.redirect(targetUrl.toString(), 302);
  }

  // Specific handler to silence '/terminal_selection' 404s seen during local dev
  if (url.pathname === "/terminal_selection") {
    return new Response(JSON.stringify({}), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  }

  // If it's a file request, try assets binding first. If missing (dev), proxy to local Vite dev server.
  const lastSegment = url.pathname.split("/").pop() ?? "";
  const isFileRequest = lastSegment.includes(".");
  if (isFileRequest) {
    try {
      const assetResp = await env.ASSETS.fetch(request);
      if (assetResp && assetResp.ok) {
        return assetResp;
      }
    } catch (e) {
      // continue to dev proxy attempt
    }

    // Fallback for local dev: try Vite dev server (useful when running `npm run dev` + `wrangler dev`).
    try {
      const viteUrl = new URL(request.url);
      // Vite dev server typically runs on port 5173
      viteUrl.port = "5173";
      viteUrl.hostname = "127.0.0.1";
      const viteResp = await fetch(viteUrl.toString(), {
        method: request.method,
        headers: request.headers,
      });
      if (viteResp && viteResp.ok) {
        return viteResp;
      }
    } catch (e) {
      // ignore and fallthrough
    }

    // final fallback: return what assets binding returned or a not found response
    return new Response(null, { status: 404 });
  }

  // Determine locale for meta tags from the first path segment
  const match = url.pathname.match(/^\/(en|ru)(?:\/|$)/);
  const locale = (match ? match[1] : "en") as keyof typeof contentByLocale;
  const meta = contentByLocale[locale].meta;

  // Prefetch JSON data for initial render (from assets binding)
  let jobsData: any = null;
  let socialData: any = null;
  try {
    const jobsReq = new Request(`/data/${locale}.json`, request);
    const jobsResp = await env.ASSETS.fetch(jobsReq);
    if (jobsResp && jobsResp.ok) {
      const data = await jobsResp.json();
      jobsData = data.jobs || null;
    }
  } catch (e) {
    // ignore - leave jobsData as null
  }

  try {
    const socialReq = new Request(`/data/social.json`, request);
    const socialResp = await env.ASSETS.fetch(socialReq);
    if (socialResp && socialResp.ok) {
      const data = await socialResp.json();
      socialData = data.links || null;
    }
  } catch (e) {
    // ignore
  }

  // Build head and client script link using manifest mapping
  const cssFiles: string[] = [];
  try {
    const m = manifest as any;
    if (m["index.html"]?.css) {
      cssFiles.push(...m["index.html"].css.map((c: string) => "/" + c));
    }
  } catch (e) {
    // ignore
  }

  // Determine client script path with existence checks and fallbacks
  const manifestEntry = (manifest as any)["index.html"] || {
    file: "assets/index.js",
  };
  const candidates = [
    `/${manifestEntry.file}`,
    `/${manifestEntry.file.replace(/^assets\//, "")}`,
    `/dist/${manifestEntry.file}`,
    `/dist/${manifestEntry.file.replace(/^assets\//, "")}`,
  ];

  async function findAvailableAssetPath(): Promise<string> {
    for (const pathCandidate of candidates) {
      try {
        const resp = await env.ASSETS.fetch(
          new Request(pathCandidate, request),
        );
        if (resp && resp.ok) {
          return pathCandidate;
        }
      } catch (e) {
        // ignore and continue
      }
    }

    // last resort: try the raw file name
    const raw = `/${manifestEntry.file.split("/").pop()}`;
    try {
      const r = await env.ASSETS.fetch(new Request(raw, request));
      if (r && r.ok) return raw;
    } catch (e) {
      // ignore
    }

    // none found - return the original candidate (may 404)
    return `/${manifestEntry.file}`;
  }

  const clientScript = await findAvailableAssetPath();

  // Inject initial data into page as serialized JSON
  const initialData = {
    locale,
    jobs: jobsData,
    social: socialData,
  };
  const safeInitialData = JSON.stringify(initialData).replace(/</g, "\\u003c");

  const baseUrl = "https://roman.stolyarch.uk";
  const hreflangLinks = [
    `<link rel="canonical" href="${meta.canonical}"/>`,
    `<link rel="alternate" hreflang="en" href="${baseUrl}/en/"/>`,
    `<link rel="alternate" hreflang="ru" href="${baseUrl}/ru/"/>`,
    `<link rel="alternate" hreflang="x-default" href="${baseUrl}/en/"/>`,
  ].join("");

  const sameAs = Array.isArray(socialData)
    ? socialData
        .map((link: { href?: string }) => link.href)
        .filter((href: string | undefined): href is string =>
          Boolean(href && href.startsWith("http")),
        )
    : [];

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: contentByLocale[locale].name,
    url: meta.canonical,
    image: meta.ogImage,
    jobTitle: contentByLocale[locale].role,
    sameAs,
  };

  const profileSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: meta.title,
    url: meta.canonical,
    about: {
      "@type": "Person",
      name: contentByLocale[locale].name,
    },
  };

  const safePersonSchema = JSON.stringify(personSchema).replace(
    /</g,
    "\\u003c",
  );
  const safeProfileSchema = JSON.stringify(profileSchema).replace(
    /</g,
    "\\u003c",
  );

  const prefix = `<!doctype html><html lang="${contentByLocale[locale].htmlLang}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${meta.title}</title><meta name="description" content="${meta.description}" /><meta name="keywords" content="${meta.keywords}" /><meta name="robots" content="index,follow" /><meta property="og:title" content="${meta.title}" /><meta property="og:description" content="${meta.description}" /><meta property="og:type" content="website" /><meta property="og:url" content="${meta.ogUrl}" /><meta property="og:image" content="${meta.ogImage}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${meta.title}" /><meta name="twitter:description" content="${meta.twitterDescription}" /><meta name="twitter:image" content="${meta.ogImage}" />${hreflangLinks}<link rel="stylesheet" href="/assets/roman-stolyarchuk.css" /><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/iconoir-icons/iconoir@main/css/iconoir.css" /><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /><link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:400,700&display=swap" /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" />${cssFiles.map((href) => `<link rel="stylesheet" href="${href}"/>`).join("")}<script type="application/ld+json" id="schema-person">${safePersonSchema}</script><script type="application/ld+json" id="schema-profile">${safeProfileSchema}</script><script>window.__INITIAL_LOCALE__ = "${locale}"; window.__INITIAL_DATA__ = ${safeInitialData}</script></head><body><div id="root">`;

  const suffix = `</div><script type="module" src="${clientScript}"></script></body></html>`;

  // Render the app to a stream with a timeout abort
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  let stream: ReadableStream;
  try {
    stream = await renderToReadableStream(
      <RouterApp location={url.pathname} initialData={initialData} />,
      {
        signal: controller.signal,
      },
    );
  } catch (err) {
    clearTimeout(timeout);
    // On render failure, return a simple fallback HTML page
    return new Response(`${prefix}<div>Rendering error</div>${suffix}`, {
      headers: { "content-type": "text/html; charset=utf-8" },
      status: 500,
    });
  }

  clearTimeout(timeout);

  const encoder = new TextEncoder();
  const prefixUint8 = encoder.encode(prefix);
  const suffixUint8 = encoder.encode(suffix);

  // Compose a new ReadableStream that yields prefix -> react stream -> suffix
  const composed = new ReadableStream({
    async start(controller) {
      controller.enqueue(prefixUint8);
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value as Uint8Array);
        }
      } finally {
        controller.enqueue(suffixUint8);
        controller.close();
      }
    },
  });

  return new Response(composed, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
