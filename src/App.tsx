import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { contentByLocale, LocaleKey } from "./content";
import { normalizeLocalePath } from "./locale";
import { JobBullet, JobData, JobItem, SocialData, SocialLink } from "./types";

const DEFAULT_SAME_AS = [
  "https://github.com/stolyarchuk",
  "https://stolyarchuk.t.me",
  "https://linkedin.com/in/romanstolyarchuk",
  "https://gitlab.com/stolyarchuk",
];

const upsertMeta = (
  attr: "name" | "property",
  key: string,
  content: string,
): void => {
  const selector = `meta[${attr}="${key}"]`;
  let element = document.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const upsertLink = (rel: string, href: string, hreflang?: string): void => {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let element = document.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    if (hreflang) {
      element.setAttribute("hreflang", hreflang);
    }
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
};

const upsertJsonLd = (id: string, data: object): void => {
  let element = document.getElementById(id) as HTMLScriptElement | null;
  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.id = id;
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
};

const updateMeta = (locale: LocaleKey, sameAs?: string[]): void => {
  const content = contentByLocale[locale];
  const meta = content.meta;
  const baseUrl = "https://roman.stolyarch.uk";
  const filteredSameAs = (sameAs ?? DEFAULT_SAME_AS).filter((url) =>
    url.startsWith("http"),
  );

  document.title = meta.title;
  document.documentElement.lang = content.htmlLang;

  upsertMeta("name", "description", meta.description);
  upsertMeta("name", "keywords", meta.keywords);
  upsertMeta("name", "robots", "index,follow");
  upsertMeta("property", "og:title", meta.title);
  upsertMeta("property", "og:description", meta.description);
  upsertMeta("property", "og:url", meta.ogUrl);
  upsertMeta("property", "og:image", meta.ogImage);
  upsertMeta("property", "og:type", "website");
  upsertMeta("name", "twitter:title", meta.title);
  upsertMeta("name", "twitter:description", meta.twitterDescription);
  upsertMeta("name", "twitter:image", meta.ogImage);
  upsertMeta("name", "twitter:card", "summary_large_image");

  upsertLink("canonical", meta.canonical);
  upsertLink("alternate", `${baseUrl}/en/`, "en");
  upsertLink("alternate", `${baseUrl}/ru/`, "ru");
  upsertLink("alternate", `${baseUrl}/en/`, "x-default");

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: content.name,
    url: meta.canonical,
    image: meta.ogImage,
    jobTitle: content.role,
    sameAs: filteredSameAs,
  };

  const profileSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: meta.title,
    url: meta.canonical,
    about: {
      "@type": "Person",
      name: content.name,
    },
  };

  upsertJsonLd("schema-person", personSchema);
  upsertJsonLd("schema-profile", profileSchema);
};

const renderBullet = (bullet: JobBullet, index: number): JSX.Element => {
  if (typeof bullet === "string") {
    return <li key={`bullet-${index}`}>{bullet}</li>;
  }

  return (
    <li key={`bullet-${index}`}>
      {bullet.text}
      {bullet.links.map((link, linkIndex) => (
        <span key={`${link.href}-${linkIndex}`}>
          {linkIndex === 0 ? " " : ", "}
          <a href={link.href} target="_blank" rel="noopener">
            {link.label}
          </a>
        </span>
      ))}
    </li>
  );
};

type InitialData = {
  locale: LocaleKey;
  jobs?: JobItem[] | null;
  social?: SocialLink[] | null;
};

type AppProps = {
  locale: LocaleKey;
  initialData?: InitialData;
};

const App = ({ locale, initialData }: AppProps): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasInitialJobs =
    initialData?.locale === locale && Array.isArray(initialData?.jobs);
  const [jobs, setJobs] = useState<JobItem[]>(
    hasInitialJobs ? (initialData?.jobs as JobItem[]) : [],
  );
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    initialData?.social ?? [],
  );
  const [jobsStatus, setJobsStatus] = useState<"loading" | "ready" | "error">(
    hasInitialJobs ? "ready" : "loading",
  );

  useEffect(() => {
    if (location.pathname === `/${locale}`) {
      navigate(
        {
          pathname: normalizeLocalePath(locale),
          search: location.search,
          hash: location.hash,
        },
        { replace: true },
      );
    }
  }, [locale, location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    const sameAs = socialLinks.map((link) => link.href);
    updateMeta(locale, sameAs);
  }, [locale, socialLinks]);

  useEffect(() => {
    // If we already have jobs from SSR, skip fetching
    if (hasInitialJobs) {
      return;
    }

    setJobsStatus("loading");

    fetch(`/data/${locale}.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load job data");
        }
        return response.json() as Promise<JobData>;
      })
      .then((data) => {
        setJobs(data.jobs);
        setJobsStatus("ready");
      })
      .catch(() => {
        setJobs([]);
        setJobsStatus("error");
      });
  }, [locale, hasInitialJobs]);

  useEffect(() => {
    // If we already have social links from SSR, skip fetching
    if (initialData?.social) {
      return;
    }

    fetch("/data/social.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load social data");
        }
        return response.json() as Promise<SocialData>;
      })
      .then((data) => {
        setSocialLinks(data.links);
      })
      .catch(() => {
        setSocialLinks([]);
      });
  }, [initialData]);

  const content = useMemo(() => contentByLocale[locale], [locale]);

  const onLocaleChange = (nextLocale: LocaleKey): void => {
    navigate({
      pathname: normalizeLocalePath(nextLocale),
      search: location.search,
      hash: location.hash,
    });
  };

  const renderSocialLinks = (): JSX.Element => (
    <div className="icon-list">
      {socialLinks.map((link) => {
        const title = locale === "ru" ? link.titleRu : link.titleEn;
        return (
          <a
            className="icon-link"
            href={link.href}
            title={title}
            target="_blank"
            rel="noopener"
            key={link.key}
          >
            <i className={link.icon}></i>
          </a>
        );
      })}
    </div>
  );

  return (
    <div className="container">
      <div className="profile-banner">
        <img
          src="/assets/photo.png"
          alt={
            locale === "ru"
              ? "Фото Романа Столярчука"
              : "Roman Stolyarchuk photo"
          }
          className="profile-photo-banner"
        />
        <div className="profile-banner-info">
          <div className="profile-name">{content.name}</div>
          <div className="profile-desc">{content.role}</div>
          {renderSocialLinks()}
          <div className="lang-switcher" aria-label="Language switcher">
            <a
              href="/en/"
              className={`lang${locale === "en" ? " active" : ""}`}
              data-lang="en"
              aria-current={locale === "en" ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                onLocaleChange("en");
              }}
            >
              EN
            </a>
            <a
              href="/ru/"
              className={`lang${locale === "ru" ? " active" : ""}`}
              data-lang="ru"
              aria-current={locale === "ru" ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                onLocaleChange("ru");
              }}
            >
              RU
            </a>
          </div>
        </div>
      </div>
      <header className="desktop-header">
        <div className="profile-block">
          <div className="profile-top">
            <div className="profile-name">{content.name}</div>
            <div className="lang-switcher" aria-label="Language switcher">
              <a
                href="/en/"
                className={`lang${locale === "en" ? " active" : ""}`}
                data-lang="en"
                aria-current={locale === "en" ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onLocaleChange("en");
                }}
              >
                EN
              </a>
              <a
                href="/ru/"
                className={`lang${locale === "ru" ? " active" : ""}`}
                data-lang="ru"
                aria-current={locale === "ru" ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onLocaleChange("ru");
                }}
              >
                RU
              </a>
            </div>
          </div>
          <div className="profile-desc">{content.role}</div>
          {renderSocialLinks()}
        </div>
        <img
          src="/assets/photo.png"
          alt={
            locale === "ru"
              ? "Фото Романа Столярчука"
              : "Roman Stolyarchuk photo"
          }
          className="profile-photo"
        />
      </header>

      <main>
        <section className="section intro">
          <div className="specializations">
            {content.specializations.map((item) => (
              <span className="specialization" key={item}>
                {item}
              </span>
            ))}
          </div>
        </section>
        <section className="section work-section">
          <h2>{content.headings.work}</h2>
          {jobsStatus === "error" ? (
            <div className="work-detail">
              {locale === "ru"
                ? "Не удалось загрузить опыт работы."
                : "Failed to load work experience."}
            </div>
          ) : (
            jobs.map((job, jobIndex) => (
              <div className="work-item" key={`${job.title}-${jobIndex}`}>
                <div className="job-title">{job.title}</div>
                <div className="job-meta">
                  <span>{job.sector}</span>
                  <span className="location-tag">{job.location}</span>
                </div>
                <div className="job-meta job-meta-dates">
                  <span>{job.dates}</span>
                </div>
                <div className="work-detail">
                  {job.sections.map((section, sectionIndex) => (
                    <div key={`${job.title}-section-${sectionIndex}`}>
                      {section.heading ? <div>{section.heading}</div> : null}
                      <ul>
                        {section.bullets.map((bullet, bulletIndex) =>
                          renderBullet(bullet, bulletIndex),
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        <section className="section">
          <h2>{content.headings.education}</h2>
          <ul className="edu-list">
            {content.education.map((item) => (
              <li
                className="edu-item"
                style={{ paddingBottom: "4px" }}
                key={item.year}
              >
                {item.year}: <strong>{item.school}</strong>
                <br />
                <span className="job-meta-dates">{item.field}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="section">
          <h2>{content.headings.languages}</h2>
          <div className="personal-info">
            {content.languages.map((language, index) => (
              <div key={`${language}-${index}`}>{language}</div>
            ))}
          </div>
        </section>
        <section className="section">
          <h2>{content.headings.skills}</h2>
          <div className="skills-list">
            {content.skills.map((skill) => (
              <span className="skill" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </section>
      </main>
      <div className="footer">
        <span>{content.footer.text}</span>
        <a href={content.footer.linkHref} target="_blank" rel="noopener">
          {content.footer.linkLabel}
        </a>
      </div>
    </div>
  );
};

export default App;
