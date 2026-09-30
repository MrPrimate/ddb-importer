/**
 * Item reprints whose names carry a book suffix only reach the base item's enricher through an
 * explicit name hint. Synthetic definitions and paraphrased text: no licensed item text.
 */
import * as ItemEnrichers from "../../../src/parser/enrichers/item/_module";
import DDBItemEnricher from "../../../src/parser/enrichers/DDBItemEnricher";

function resolve(name: string): string | null {
  const enricher = new DDBItemEnricher({ activityGenerator: null as any }) as any;
  enricher.name = name;
  enricher.is2014 = false;
  enricher.isCustomAction = false;
  enricher.ddbParser = { ddbDefinition: { isHomebrew: false } };
  enricher._getNameHint();
  return enricher._loadEnricherData()?.constructor?.name ?? null;
}

describe("book-suffixed item reprints reach the base enricher", () => {
  it.each([
    ["Tarnished Idol of Good Fortunes", "TarnishedIdolOfGoodFortunes"],
    ["Tarnished Idol of Good Fortunes (DMLS)", "TarnishedIdolOfGoodFortunes"],
    ["Revolver", "Revolver"],
    ["Revolver (TGC)", "Revolver"],
    ["Assassin’s Blood", "AssassinsBlood"],
    ["Assassin's Blood (Ingested)", "AssassinsBlood"],
    ["Burnt Othur Fumes (Inhaled)", "BurntOthurFumes"],
    ["Potion of Dragon’s Breath", "PotionOfDragonsBreath"],
    ["Potion of Dragon’s Breath (Rare)", "PotionOfDragonsBreath"],
    ["Potion of Dragon's Breath (Very Rare)", "PotionOfDragonsBreath"],
  ])("%s -> %s", (name, expected) => {
    expect(resolve(name)).toBe(expected);
  });

  it("leaves other revolvers alone", () => {
    expect(resolve("Revolver of Warning")).not.toBe("Revolver");
    expect(resolve("Revolver, +1")).not.toBe("Revolver");
  });
});

describe("The Gunslinger Class revolver magazine", () => {
  it("takes the six-shot magazine and both reload activities from source 197", () => {
    const enricher = Object.assign(Object.create(ItemEnrichers.Revolver.prototype), {
      capacity: 6,
      ddbParser: {
        ddbDefinition: {
          sources: [{ sourceId: 197, sourceType: 1 }],
          description: "",
          properties: [{ name: "Reload", description: "Reload" }],
        },
        ddbItem: { chargesUsed: 0 },
        data: { system: { uses: { spent: 0 } } },
      },
    });
    expect(enricher.supported).toBe(true);
    expect(enricher.override).toMatchObject({ uses: { max: "6" } });
    expect(enricher.additionalActivities.map((a: any) => a.init?.name)).toEqual([
      "Reload (Action)",
      "Reload (Bonus Action)",
    ]);
  });
});

describe("Potion of Dragon's Breath printings", () => {
  function potion(rarity: string, description: string): any {
    return Object.assign(Object.create(ItemEnrichers.PotionOfDragonsBreath.prototype), {
      ddbParser: { ddbDefinition: { rarity, description, properties: [] } },
    });
  }

  it.each([
    ["Uncommon", 2, "13"],
    ["Rare", 3, "15"],
    ["Very Rare", 4, "16"],
  ])("scales the Breath Weapon printing by rarity (%s)", (rarity, number, dc) => {
    const enricher = potion(rarity, "<p>An exhalation with the same effects as the Dragonborn's Breath Weapon trait.</p>");
    const activity = enricher.activity;
    expect(activity.name).toBe("Exhale (Cone)");
    expect(activity.data.save.dc.formula).toBe(dc);
    expect(activity.data.damage.parts[0]).toMatchObject({ number, denomination: 10 });
    expect(activity.data.duration).toBeUndefined();
    expect(enricher.additionalActivities).toEqual([
      expect.objectContaining({ duplicate: true, overrides: expect.objectContaining({ name: "Exhale (Line)" }) }),
    ]);
  });

  it("gives the Varies parent the Uncommon row and says so", () => {
    const activity = potion("Varies", "<p>Dragonborn's Breath Weapon trait.</p>").activity;
    expect(activity.data.save.dc.formula).toBe("13");
    expect(activity.activationCondition).toContain("Uncommon shown");
  });

  it("keeps the Dragon's Breath spell printing at 3d6, DC 13, one minute", () => {
    const enricher = potion("Uncommon", "<p>You gain the effect of the Dragon's Breath spell for 1 minute.</p>");
    expect(enricher.activity).toMatchObject({ name: "Exhale Breath", activationType: "bonus" });
    expect(enricher.activity.data.damage.parts[0]).toMatchObject({ number: 3, denomination: 6 });
    expect(enricher.additionalActivities).toEqual([]);
  });
});
