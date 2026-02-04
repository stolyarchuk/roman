export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

const RU_COUNTRY_CODE = "RU";

const GetCountryCode = (request: Request): string | null => {
  const headerValue = request.headers.get("cf-ipcountry");
  return headerValue?.toUpperCase() ?? null;
};

const GetTargetPath = (countryCode: string | null): string => {
  return countryCode === RU_COUNTRY_CODE ? "/index-ru.html" : "/index-en.html";
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      const targetPath = GetTargetPath(GetCountryCode(request));
      const targetUrl = new URL(targetPath, url);
      targetUrl.search = url.search;
      return Response.redirect(targetUrl.toString(), 302);
    }

    return env.ASSETS.fetch(request);
  },
};
