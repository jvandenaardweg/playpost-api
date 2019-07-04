declare namespace PostplayCrawler {

  export type Response = {
    crawler: 'fetcher' | 'browser';
    title: string | null;
    url: string;
    urlParts: UrlParseResult;
    canonicalUrl: string | null;
    language: string | null;
    description: string | null;
    excerpt: string | null;
    imageUrl: string | null;
    readingTimeInSeconds: number | null;
    possibleListeningTimeInSeconds: number | null;
    length: number | null;
    siteName: string | null;
    hostName: string | null;
    metadata: MetadataResult;
    articleHTML: string | null;
    articleText: string | null;
    ssml: string | null;
    completeHTML: string | null;
    readability: ReadabilityResult;
  };

  export type UrlParseResult = {
    slashes: boolean;
    protocol: string;
    hash: string;
    query: string;
    pathname: string;
    auth: string;
    host: string;
    port: string;
    hostname: string;
    password: string;
    username: string;
    origin: string;
    href: string;
  }

  export type ReadabilityResult = {
    title: string | null;
    byline: string | null;
    dir: string | null;
    content: string | null;
    textContent: string | null;
    length: number | null;
    excerpt: string | null;
    siteName: string | null;
  }

  export type MetadataResult = {
    author: string | null;
    description: string | null;
    image: string | null;
    publisher: string | null;
    title: string | null;
    url: string | null;
    date: string | null;
  };
}
