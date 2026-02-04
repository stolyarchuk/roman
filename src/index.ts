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
  return countryCode === RU_COUNTRY_CODE ? "/ru/index.html" : "/en/index.html";
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      const countryCode = GetCountryCode(request);
      const targetPath = GetTargetPath(countryCode);
      const targetUrl = new URL(targetPath, url);
      targetUrl.search = url.search;
      return Response.redirect(targetUrl.toString(), 302);
    }

    const lastSegment = url.pathname.split("/").pop() ?? "";
    const isFileRequest = lastSegment.includes(".");
    if (!isFileRequest && url.pathname !== "/") {
      const indexPath = url.pathname.endsWith("/")
        ? `${url.pathname}index.html`
        : `${url.pathname}/index.html`;
      const indexUrl = new URL(indexPath, url);
      indexUrl.search = url.search;
      return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
    }

    return env.ASSETS.fetch(request);
  },
};
