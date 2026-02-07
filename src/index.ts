export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

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

import { handleRequest } from "./entry-server";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Keep the redirect for the root path for fast geo-redirects
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const countryCode = GetCountryCode(request);
      const targetPath = GetTargetPath(countryCode);
      const targetUrl = new URL(targetPath, url);
      targetUrl.search = url.search;
      return Response.redirect(targetUrl.toString(), 302);
    }

    const lastSegment = url.pathname.split("/").pop() ?? "";
    const isFileRequest = lastSegment.includes(".");
    if (isFileRequest) {
      return env.ASSETS.fetch(request);
    }

    // Delegate non-file requests to the SSR handler
    try {
      return await handleRequest(request, env);
    } catch (err) {
      // Fallback: serve index.html via assets binding to preserve SPA behavior
      const indexUrl = new URL("/index.html", url);
      indexUrl.search = url.search;
      return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
    }
  },
};
