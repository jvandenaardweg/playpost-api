import unfluff from 'unfluff';

export const htmlToText = (html: string) => {
    return unfluff(html)
}
