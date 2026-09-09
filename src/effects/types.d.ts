export {};

global {
  // numbered title/content chunks pulled out of ol/p HTML lists
  // (used for monster ray/option style features)
  interface IExtractedHtmlItem {
    number: number;
    title: string;
    content: string;
    full: string;
  }
}
