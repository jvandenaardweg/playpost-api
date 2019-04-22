declare namespace PostplayCrawler {

  export interface Response {
    title: string | null;
    url: string;
    currentUrl: string;
    hostName: string | null;
    siteName: string | null;
    readingTimeInSeconds: number | null;
    language: string | null;
    metadata: Metadata;
    description: string | null;
    excerpt: string | null;
    length: number | null;
    cleanText: string | null;
    ssml: string | null;
    html: string | null;
    content: string | null;
    textContent: string | null;
  }

  export interface Metadata {
    author: string | null;
    description: string | null;
    image: string | null;
    publisher: string | null;
    title: string | null;
    url: string | null;
  }
}
