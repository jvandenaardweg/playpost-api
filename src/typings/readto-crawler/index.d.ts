declare namespace ReadtoCrawler {

  export interface Response {
    title: string | null;
    byline: string | null;
    dir: string | null;
    content: string | null;
    textContent: string | null;
    length: number | null;
    excerpt: string | null;
    siteName: string | null;
    cleanText: string | null;
    ssml: string | null;
    metadata: Metadata
    hostName: string | null;
    html: string | null;
    readingTimeInSeconds: number | null;
    description: string | null;
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
