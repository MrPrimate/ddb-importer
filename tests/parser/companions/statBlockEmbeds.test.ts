// @vitest-environment jsdom
import DDBCompanionFactory from "../../../src/parser/companions/DDBCompanionFactory";
import DDBCompanionMixin from "../../../src/parser/companions/DDBCompanionMixin";
import DDBCompanion2024 from "../../../src/parser/companions/DDBCompanion2024";

// Synthetic stat block wording: the forms (Ember, Frost, Gale) and values are invented, but the
// shapes follow DDB's multi-form stat blocks.

describe("DDBCompanionMixin.formText", () => {
  const formText = DDBCompanionMixin.formText;

  it("picks a form's hit points and keeps the shared scaling tail", () => {
    const hp = "25 (Ember only) or 15 (Frost or Gale only) + 4 for each spell level above 3";
    expect(formText(hp, "Ember")).toBe("25 + 4 for each spell level above 3");
    expect(formText(hp, "Frost")).toBe("15 + 4 for each spell level above 3");
    expect(formText(hp, "Gale")).toBe("15 + 4 for each spell level above 3");
  });

  it("drops another form's armor class bonus", () => {
    const ac = "12 + the spell’s level +3 (Ember only)";
    expect(formText(ac, "Ember")).toBe("12 + the spell’s level +3");
    expect(formText(ac, "Gale")).toBe("12 + the spell’s level");
  });

  it("keeps a speed's own qualifier and drops other forms' speeds", () => {
    const speed = "35 ft., Fly 20 ft. (hover; Gale only), Swim 25 ft.";
    expect(formText(speed, "Gale")).toBe("35 ft., Fly 20 ft. (hover), Swim 25 ft.");
    expect(formText(speed, "Ember")).toBe("35 ft., Swim 25 ft.");

    const legacy = "30 ft.; climb 30 ft. (Frost only); fly 50 ft. (Gale only)";
    expect(formText(legacy, "Frost")).toBe("30 ft.; climb 30 ft.");
    expect(formText(legacy, "Gale")).toBe("30 ft.; fly 50 ft.");
  });

  it("matches a multi-word form on its last word", () => {
    expect(formText("30 ft., fly 60 ft. (Sky only)", "Beast of the Sky")).toBe("30 ft., fly 60 ft.");
    expect(formText("30 ft., fly 60 ft. (Sky only)", "Beast of the Land")).toBe("30 ft.");
  });

  it("returns the whole text, whitespace tidied, without a form", () => {
    expect(formText("25 (Ember only) or  15 (Frost only)")).toBe("25 (Ember only) or 15 (Frost only)");
  });
});

describe("DDBCompanionMixin._addStatBlockOverrides", () => {
  const overridesFor = (text: IDDBStatBlockOverrideText, options: IDDBCompanionMixinOptions = {}) => {
    const companion = new DDBCompanion2024("<div></div>" as unknown as HTMLElement, options);
    companion._addStatBlockOverrides(text);
    return companion.statBlockOverride;
  };

  it("keeps the scaling text of a form, its printed speed, and leaves plain numbers to the actor", () => {
    const result = overridesFor({
      ac: "12 + the spell’s level +3 (Ember only)",
      hp: "25 (Ember only) or 15 (Frost only) + 4 for each spell level above 3",
      speed: "35 ft., Fly 20 ft. (hover; Frost only)",
      tag: "Small Construct, Unaligned",
    }, { subType: "Frost" });
    expect(result).toEqual({
      ac: "12 + the spell’s level",
      hp: "15 + 4 for each spell level above 3",
      speed: "35 ft., Fly 20 ft. (hover)",
    });

    expect(overridesFor({ ac: "14", hp: "33", speed: "30 ft." })).toEqual({ speed: "30 ft." });
  });

  it("gives a template the block's own text", () => {
    const result = overridesFor({
      hp: "25 (Ember only) or 15 (Frost only) + 4 for each spell level above 3",
      speed: "35 ft., Fly 20 ft. (hover; Frost only)",
      tag: "Medium Elemental or Fey (Your Choice), Neutral",
    }, { template: true });
    expect(result).toEqual({
      hp: "25 (Ember only) or 15 (Frost only) + 4 for each spell level above 3",
      speed: "35 ft., Fly 20 ft. (hover; Frost only)",
      tag: "Medium Elemental or Fey (Your Choice), Neutral",
    });
  });

  it("reads a 2024 challenge with a Proficiency Bonus that is the summoner's", () => {
    expect(overridesFor({ challenge: "None (XP 0; PB equals your Proficiency Bonus)" })).toEqual({
      cr: "None",
      xp: "XP 0",
      pb: "PB equals your Proficiency Bonus",
    });
    expect(overridesFor({ challenge: "2 (XP 450; PB +2)" })).toEqual({});
  });

  it("records the block's numeric challenge rating and none for 'None'", () => {
    const ratingFor = (challenge: string) => {
      const companion = new DDBCompanion2024("<div></div>" as unknown as HTMLElement, {});
      companion._addChallengeOverrides(challenge);
      return companion.challengeRating;
    };
    expect(ratingFor("None (XP 0; PB equals your Proficiency Bonus)")).toBeNull();
    expect(ratingFor("2 (XP 450; PB +2)")).toBe(2);
    expect(ratingFor("1/2 (XP 100; PB +2)")).toBe(0.5);
    expect(ratingFor("— Proficiency Bonus equals your bonus")).toBeNull();
    expect(ratingFor("¼ (50 XP)")).toBe(0.25);
    // 2014 one-line blocks put the XP between the rating and the bonus
    expect(ratingFor("2 (450 XP) Proficiency Bonus +2")).toBe(2);
    expect(ratingFor("1/2 (100 XP) Proficiency bonus +2")).toBe(0.5);
  });

  it("keeps a 2014 block's printed XP beside a non-numeric rating", () => {
    expect(overridesFor({ challenge: "— (10 XP) Proficiency Bonus equals your bonus" })).toEqual({
      cr: "—",
      xp: "10 XP",
      pb: "equals your bonus",
    });
    expect(overridesFor({ challenge: "2 (450 XP) Proficiency Bonus +2" })).toEqual({});
  });

  it("reads a 2014 challenge line", () => {
    expect(overridesFor({ challenge: "— Proficiency Bonus equals your bonus" })).toEqual({
      cr: "—",
      xp: "0 XP",
      pb: "equals your bonus",
    });
  });

  it("carries form-marked damage traits, and leaves plain ones to the actor", () => {
    const text = { resistances: "Cold (Frost only), Fire (Ember only)", immunities: "Poison, Charmed" };
    expect(overridesFor(text, { subType: "Frost" })).toEqual({ resistances: "Cold" });
    expect(overridesFor(text, { template: true })).toEqual({ resistances: "Cold (Frost only), Fire (Ember only)" });
  });

  it("reads a label's value up to the next label on the same line", () => {
    const block = `<div><p><strong>AC</strong> 14 + your Wisdom modifier <strong>Initiative</strong> +1 (11)</p>`
      + `<p><em><strong>HP</strong></em> 6 + your level</p></div>`;
    const companion = new DDBCompanion2024(block as unknown as HTMLElement, {});
    expect(companion._extractValue("AC")).toBe("14 + your Wisdom modifier");
    expect(companion._extractValue("Initiative")).toBe("+1 (11)");
    expect(companion._extractValue("HP")).toBe("6 + your level");
    expect(companion._extractValue("Speed")).toBeNull();
  });

  it("keeps '(X Only)' trait names on a template only", () => {
    expect(new DDBCompanion2024("<div></div>" as unknown as HTMLElement, { template: true }).removeCreatureOnlyNames).toBe(false);
    expect(new DDBCompanion2024("<div></div>" as unknown as HTMLElement, { subType: "Ember" }).removeCreatureOnlyNames).toBe(true);
  });
});

describe("DDBCompanionFactory.prepareStatBlockEmbeds", () => {
  const stored = (ids: string[]) => {
    const factory = new DDBCompanionFactory("", {});
    const index = new Map(ids.map((id) => [id, {
      _id: id,
      uuid: `Compendium.world.ddb-summons.Actor.${id}`,
      flags: { ddbimporter: { id } },
    }]));
    (factory as any).itemHandler = {
      buildIndex: async () => index,
      compendium: { index, collection: "world.ddb-summons" },
    };
    factory.statBlocks = [{
      name: "Test Spirit",
      companionIds: ["companion-test-spirit-ember-2024", "companion-test-spirit-frost-2024"],
      templateId: "companion-test-spirit-2024-template",
    }];
    return factory;
  };

  it("embeds the template when it is stored", async () => {
    const factory = stored(["companion-test-spirit-ember-2024", "companion-test-spirit-frost-2024", "companion-test-spirit-2024-template"]);
    await factory.prepareStatBlockEmbeds();
    expect(factory.statBlockEmbeds?.get(0)).toEqual(["Compendium.world.ddb-summons.Actor.companion-test-spirit-2024-template"]);
  });

  it("embeds every form when there is no template", async () => {
    const factory = stored(["companion-test-spirit-ember-2024", "companion-test-spirit-frost-2024"]);
    await factory.prepareStatBlockEmbeds();
    expect(factory.statBlockEmbeds?.get(0)).toEqual([
      "Compendium.world.ddb-summons.Actor.companion-test-spirit-ember-2024",
      "Compendium.world.ddb-summons.Actor.companion-test-spirit-frost-2024",
    ]);
  });

  it("embeds nothing when a form is missing", async () => {
    const factory = stored(["companion-test-spirit-ember-2024"]);
    await factory.prepareStatBlockEmbeds();
    expect(factory.statBlockEmbeds?.has(0)).toBe(false);
  });
});

describe("DDBCompanionFactory.rewriteStatBlocks", () => {
  const block2024 = `<div class="stat-block"><h4 class="compendium-hr">Test Spirit</h4><p><strong>AC</strong> 12</p></div>`;
  const html2024 = `<p>Opening text.</p>${block2024}<p>Closing text.</p>`;

  const factoryWith = (embeds: Map<number, string[]> | null, is2014 = false) => {
    const factory = new DDBCompanionFactory("", { is2014 });
    factory.statBlocks = [{ name: "Test Spirit", companionIds: ["companion-test-spirit-2024"], templateId: null }];
    factory.statBlockEmbeds = embeds;
    return factory;
  };

  it("does nothing before the embeds are prepared", () => {
    expect(factoryWith(null).rewriteStatBlocks(html2024)).toBe(html2024);
  });

  it("replaces the stat block with a secret embed and keeps the text around it", () => {
    const result = factoryWith(new Map([[0, ["Compendium.world.ddb-summons.Actor.abcdefghijklmnop"]]])).rewriteStatBlocks(html2024);
    expect(result).toBe(
      `<p>Opening text.</p><section class="secret" id="secret-ddb-statblock-abcdefghijklmnop">`
      + `<p>@Embed[Compendium.world.ddb-summons.Actor.abcdefghijklmnop caption=false cite=true statblock]</p>`
      + `</section><p>Closing text.</p>`,
    );
  });

  it("embeds each form in one section", () => {
    const result = factoryWith(new Map([[0, ["Compendium.p.Actor.aaaaaaaaaaaaaaaa", "Compendium.p.Actor.bbbbbbbbbbbbbbbb"]]]))
      .rewriteStatBlocks(html2024);
    expect(result.match(/@Embed\[/g)).toHaveLength(2);
    expect(result.match(/<section/g)).toHaveLength(1);
  });

  it("wraps DDB's own block when nothing is stored, once, and embeds over it later", () => {
    const wrapped = factoryWith(new Map()).rewriteStatBlocks(html2024);
    expect(wrapped).toBe(`<p>Opening text.</p><section class="secret" id="secret-ddb-statblock-TestSpirit">${block2024}</section><p>Closing text.</p>`);
    expect(factoryWith(new Map()).rewriteStatBlocks(wrapped)).toBe(wrapped);

    const embedded = factoryWith(new Map([[0, ["Compendium.p.Actor.abcdefghijklmnop"]]])).rewriteStatBlocks(wrapped);
    expect(embedded).not.toContain("stat-block");
    expect(embedded.match(/<section/g)).toHaveLength(1);
    expect(embedded).toContain("@Embed[Compendium.p.Actor.abcdefghijklmnop");
  });

  it("leaves 2014 frames that are not a parsed stat block alone", () => {
    const html = `<div class="basic-text-frame"><p>A sidebar.</p></div>`
      + `<div class="basic-text-frame stat-block-finder"><p class="Stat-Block-Styles_Stat-Block-Title">TEST SPIRIT</p></div>`;
    const result = factoryWith(new Map([[0, ["Compendium.p.Actor.abcdefghijklmnop"]]]), true).rewriteStatBlocks(html);
    expect(result).toContain(`<div class="basic-text-frame"><p>A sidebar.</p></div>`);
    expect(result).toContain("@Embed[Compendium.p.Actor.abcdefghijklmnop");
    expect(result).not.toContain("TEST SPIRIT");
  });

  it("leaves a stat block with a name it did not parse alone", () => {
    const html = `<div class="stat-block"><h4 class="compendium-hr">Someone Else</h4></div>`;
    expect(factoryWith(new Map([[0, ["Compendium.p.Actor.abcdefghijklmnop"]]])).rewriteStatBlocks(html)).toBe(html);
  });
});
