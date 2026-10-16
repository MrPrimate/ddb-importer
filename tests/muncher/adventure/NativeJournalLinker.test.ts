// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { resolveInternalLinks } from "../../../src/muncher/adventure/native/NativeJournalLinker";

// One chapter split into section pages the way the native builder does: the chapter page carries
// the bare slug, each section page "<chapter>#<Section>".
function makeJournals(introHtml: string) {
  const page = (id: string, slug: string, content: string) => ({
    _id: id, type: "text", text: { content }, flags: { ddb: { slug } },
  });
  return [{
    _id: "journalChapter01",
    pages: [
      page("journalChapter01", "chapter", introHtml),
      page("pageSection00001", "chapter#Section", `<h3 id="Sub">Sub</h3><p id="Dup">dup</p>`),
      page("pageSection00002", "chapter#Other", `<h3 id="Deep">Deep</h3>`),
    ],
  }];
}

function link(introHtml: string): string {
  const journals = makeJournals(`${introHtml}<p id="Here">here</p><p id="Dup">dup</p>`);
  resolveInternalLinks(journals, [], "bk");
  return journals[0].pages[0].text.content;
}

describe("resolveInternalLinks section pages", () => {
  it("opens a section's own page for <chapter>#<Section>", () => {
    expect(link(`<a href="ddb://compendium/bk/chapter#Section">s</a>`))
      .toContain("@UUID[JournalEntry.journalChapter01.JournalEntryPage.pageSection00001]{s}");
  });

  it("opens the page holding a sub-heading anchor", () => {
    expect(link(`<a href="ddb://compendium/bk/chapter#Deep">d</a>`))
      .toContain("@UUID[JournalEntry.journalChapter01.JournalEntryPage.pageSection00002#Deep]{d}");
  });

  it("reads <chapter>#<Section>#<anchor> as an anchor on the section page", () => {
    // DDB's map location buttons: href="ddb://compendium/<book>/adventures#Sanctuary#S1ElevatorBank"
    expect(link(`<a href="ddb://compendium/bk/chapter#Section#Sub">s1</a>`))
      .toContain("@UUID[JournalEntry.journalChapter01.JournalEntryPage.pageSection00001#Sub]{s1}");
  });

  it("keeps the slug's own page when it holds a repeated anchor", () => {
    expect(link(`<a href="ddb://compendium/bk/chapter#Dup">x</a>`))
      .toContain("@UUID[JournalEntry.journalChapter01.JournalEntryPage.journalChapter01#Dup]{x}");
  });

  it("drops an anchor no page holds, and links a bare slug to the chapter page", () => {
    const html = link(`<a href="ddb://compendium/bk/chapter#Nowhere">n</a><a href="ddb://compendium/bk/chapter">c</a>`
      + `<a href="ddb://compendium/bk/chapter#Section#SectionTitle">t</a>`);
    expect(html).toContain("@UUID[JournalEntry.journalChapter01.JournalEntryPage.journalChapter01]{n}");
    expect(html).toContain("@UUID[JournalEntry.journalChapter01.JournalEntryPage.journalChapter01]{c}");
    expect(html).toContain("@UUID[JournalEntry.journalChapter01.JournalEntryPage.pageSection00001]{t}");
  });

  it("matches an anchor whatever its case, writing the id the page has", () => {
    expect(link(`<a href="ddb://compendium/bk/chapter#DEEP">d</a><a href="#here">h</a>`))
      .toContain("@UUID[JournalEntry.journalChapter01.JournalEntryPage.pageSection00002#Deep]{d}");
    expect(link(`<a href="#here">h</a>`))
      .toContain("@UUID[JournalEntry.journalChapter01.JournalEntryPage.journalChapter01#Here]{h}");
  });

  it("falls back from a missing <Name>StatBlock anchor to the heading", () => {
    expect(link(`<a href="ddb://compendium/bk/chapter#DeepStatBlock">d</a>`))
      .toContain("@UUID[JournalEntry.journalChapter01.JournalEntryPage.pageSection00002#Deep]{d}");
  });

  it("sends same-page anchors to the page that has them", () => {
    const html = link(`<a href="#Here">h</a><a href="#Sub">u</a><a href="#Section">t</a>`);
    expect(html).toContain("@UUID[JournalEntry.journalChapter01.JournalEntryPage.journalChapter01#Here]{h}");
    expect(html).toContain("@UUID[JournalEntry.journalChapter01.JournalEntryPage.pageSection00001#Sub]{u}");
    expect(html).toContain("@UUID[JournalEntry.journalChapter01.JournalEntryPage.pageSection00001]{t}");
  });
});
