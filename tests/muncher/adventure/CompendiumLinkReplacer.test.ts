// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { foundryCompendiumReplace, guessDDBUrl } from "../../../src/muncher/adventure/CompendiumLinkReplacer";

const link = (type: string, id: number, text: string) => `<p>The <a href="ddb://${type}/${id}">${text}</a> arrives.</p>`;

describe("CompendiumLinkReplacer vehicle links", () => {
  it("links an imported vehicle to the vehicle compendium", () => {
    const out = foundryCompendiumReplace(link("vehicles", 123, "Infernal War Machine"), {
      lookups: { vehicles: [{ id: "123", _id: "vehicle000000001", compendium: "world.ddb-vehicles", name: "Infernal War Machine" }] },
    });
    expect(out).toContain("@Compendium[world.ddb-vehicles.vehicle000000001]{Infernal War Machine}");
  });

  it("links a vehicle known only from DDB's list to its DDB page, never an undefined compendium", () => {
    const out = foundryCompendiumReplace(link("vehicles", 123, "Infernal War Machine"), {
      lookups: { vehicles: [{ id: "123", url: "/vehicles/123-infernal-war-machine", name: "Infernal War Machine" }] },
    });
    expect(out).not.toContain("undefined");
    expect(out).toContain(`href="https://www.dndbeyond.com/vehicles/123-infernal-war-machine"`);
  });

  it("falls back to the DDB id and full slug when the vehicle is unknown", () => {
    const out = foundryCompendiumReplace(link("vehicles", 123, "Infernal War Machine"), { lookups: { vehicles: [] } });
    expect(out).toContain(`href="https://www.dndbeyond.com/vehicles/123-infernal-war-machine"`);
  });
});

describe("guessDDBUrl", () => {
  it("keeps every word break and leads with the DDB id", () => {
    expect(guessDDBUrl("monsters", "ddb://monsters/16907", "Adult Red Dragon")).toBe("https://www.dndbeyond.com/monsters/16907-adult-red-dragon");
    expect(guessDDBUrl("magicitems", "ddb://magicitems/4585", "Bag of Holding")).toBe("https://www.dndbeyond.com/magic-items/4585-bag-of-holding");
  });

  it("drops punctuation and copes with a missing id", () => {
    expect(guessDDBUrl("spells", "ddb://spells/", "Tasha's Hideous Laughter")).toBe("https://www.dndbeyond.com/spells/tashas-hideous-laughter");
  });
});
