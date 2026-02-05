export type JobLink = {
  label: string;
  href: string;
};

export type JobBullet =
  | string
  | {
      text: string;
      links: JobLink[];
    };

export type JobSection = {
  heading?: string;
  bullets: JobBullet[];
};

export type JobItem = {
  title: string;
  sector: string;
  location: string;
  dates: string;
  sections: JobSection[];
};

export type JobData = {
  jobs: JobItem[];
};

export type SocialLink = {
  key: string;
  href: string;
  icon: string;
  titleEn: string;
  titleRu: string;
};

export type SocialData = {
  links: SocialLink[];
};
