import Readability from 'readability';
import { JSDOM } from 'jsdom';

export const htmlToText = (html: string) => {
    const document = new JSDOM(html);
    const article = new Readability(document.window.document).parse();
    return article
}
