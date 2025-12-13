
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/&/g, '-and-')         // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// Advanced version with unicode support
export function slugifyWithUnicode(text: string): string {
  return text
    .toString()
    .normalize('NFKD')              // Normalize Unicode
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// Version with custom separator
export function slugifyCustom(text: string, separator: string = '-'): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, separator)
    .replace(/[^\w\-]+/g, '')
    .replace(new RegExp(`\\${separator}+`, 'g'), separator)
    .replace(new RegExp(`^${separator}+`), '')
    .replace(new RegExp(`${separator}+$`), '');
}