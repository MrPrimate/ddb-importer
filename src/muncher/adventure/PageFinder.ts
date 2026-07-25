import { utils } from "../../lib/_module";

export class PageFinder {

  journal: JournalEntry.Implementation;

  contentChunkIds: Record<string, Set<string>>;

  elementIds: Record<string, Set<string>>;

  generateContentLinks() {
    for (const page of this.journal.pages.filter((p: JournalEntryPage.Implementation) => p.type === "text")) {
      const pageId = page._id;
      if (!pageId) continue;
      const dom = utils.htmlToDocumentFragment(page.text.content ?? "");
      const chunkElements = dom.querySelectorAll<HTMLElement>("[data-content-chunk-id]");
      const chunkIds = new Set<string>();
      chunkElements.forEach((chunk) => {
        const chunkId = chunk.dataset["contentChunkId"];
        if (chunkId !== undefined) chunkIds.add(chunkId);
      });
      this.contentChunkIds[pageId] = chunkIds;

      const idElements = dom.querySelectorAll("[id]");
      const elementIds = new Set<string>();
      idElements.forEach((chunk) => {
        elementIds.add(chunk.id);
      });
      this.elementIds[pageId] = elementIds;
    }
  }

  constructor(journal: JournalEntry.Implementation) {
    this.journal = journal;
    this.contentChunkIds = {};
    this.elementIds = {};
    this.generateContentLinks();
  }


  // returns page Id if content chunk id known in contents
  getPageIdForContentChunkId(chunkId: string) {
    for (const [key, value] of Object.entries(this.contentChunkIds)) {
      if (value.has(chunkId)) return key;
    }
    return undefined;
  }

  // returns page Id if element id known in contents
  getPageIdForElementId(elementId: string) {
    for (const [key, value] of Object.entries(this.elementIds)) {
      if (value.has(elementId)) return key;
      // if (value.has(elementId.replace(/^0+/, ""))) return key;
    }
    return undefined;
  }

}
