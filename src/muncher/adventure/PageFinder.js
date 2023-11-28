import utils from "../../lib/utils.js";

export class PageFinder {

  generateContentLinks() {
    for (const page of this.journal.pages.filter((p) => p.type === "text")) {
      const dom = utils.htmlToDocumentFragment(page.text.content);
      const chunkElements = dom.querySelectorAll("[data-content-chunk-id]");
      const chunkIds = new Set();
      chunkElements.forEach((chunk) => {
        chunkIds.add(chunk.dataset["contentChunkId"]);
      });
      this.contentChunkIds[page._id] = chunkIds;

      const idElements = dom.querySelectorAll("[id]");
      const elementIds = new Set();
      idElements.forEach((chunk) => {
        elementIds.add(chunk.id);
      });
      this.elementIds[page._id] = elementIds;
    }
  }

  constructor(journal) {
    this.journal = journal;
    this.contentChunkIds = {};
    this.elementIds = {};
    this.generateContentLinks();
  }


  // returns page Id if content chunk id known in contents
  getPageIdForContentChunkId(chunkId) {
    for (const [key, value] of Object.entries(this.contentChunkIds)) {
      if (value.has(chunkId)) return key;
    }
    return undefined;
  }

  // returns page Id if element id known in contents
  getPageIdForElementId(elementId) {
    for (const [key, value] of Object.entries(this.elementIds)) {
      if (value.has(elementId)) return key;
      // if (value.has(elementId.replace(/^0+/, ""))) return key;
    }
    return undefined;
  }

}
