export type SitePageMediaItem = {
  id: string;
  label: string;
  src: string;
  alt: string;
};

export type SiteRouteDefinition = {
  path: string;
  name: string;
  isDynamic?: boolean;
  defaultTitle: string;
  defaultDescription: string;
  defaultMedia?: SitePageMediaItem[];
};

export type SitePageSeoRecord = {
  id: string;
  path: string;
  name: string;
  title: string | null;
  description: string | null;
  permalink: string | null;
  ogImage: string | null;
  media: SitePageMediaItem[];
  isDynamic: boolean;
  updatedAt: string;
};
