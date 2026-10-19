// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { processRow } from "../../../src/muncher/adventure/native/ContentRowProcessor";

function content(body: string, assets: [string, string][] = []): string {
  const html = `<h1>Title</h1><p>Intro.</p>${body}`;
  return processRow(
    { id: 1, cobaltId: null, parentId: null, slug: "chapter", title: "Title", html } as any,
    { lookups: {} },
    { bookCode: "bk", assetMap: new Map(assets) },
  ).content;
}

describe("processRow dice replacement", () => {
  it("rolls dice in the text", () => {
    expect(content("<p>The trap deals 7 (2d6) fire damage.</p>")).toContain("[[/r 2d6");
  });

  it("leaves a double-hyphen asset filename alone", () => {
    const html = content(`<p>Handout.</p><img src="./bk/04-008.long--name-handout.jpg" alt="">`, [
      ["assets/04-008.long--name-handout.jpg", "stored/04-008.long--name-handout.jpg"],
    ]);
    expect(html).toContain(`src="stored/04-008.long--name-handout.jpg"`);
  });

  it("keeps an HTML comment closed, so its markup stays hidden", () => {
    const html = content(`<figure><!-- <img src="./bk/old.jpg" alt=""> --><figcaption>Map</figcaption></figure>`);
    expect(html).toContain(`<!-- <img src="./bk/old.jpg" alt=""> -->`);
  });
});
