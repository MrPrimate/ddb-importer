// @vitest-environment jsdom
// Feat proficiency, language and expertise grants as Trait advancements on the feat. The DDB data
// here is synthetic: shaped like DDB's feat choices and modifiers, with no book text.
import FeatTraitAdvancements from "../../../src/parser/advancements/FeatTraitAdvancements";
import { DICTIONARY } from "../../../src/config/_module";

const FEAT = 9001;
const FEAT_TYPE = 1088085227;
const CHOICE_TYPE = 1088085227;

/** One option per label; ids are stable per label so picks can name them. */
const OPTION_IDS = new Map<string, number>();
function optionId(label: string): number {
  if (!OPTION_IDS.has(label)) OPTION_IDS.set(label, 5000 + OPTION_IDS.size);
  return OPTION_IDS.get(label)!;
}

interface IChoiceSpec { type?: 2 | 3; subType: 1 | 2 | 3 | 5 | 6 | null; labels: string[]; pick?: string | null }

function ddbData(choiceSpecs: IChoiceSpec[], mods: [string, string][] = []): IDDBData {
  const allLabels = [...new Set(choiceSpecs.flatMap((spec) => spec.labels))];
  return {
    character: {
      choices: {
        feat: choiceSpecs.map((spec, i) => ({
          componentId: FEAT,
          componentTypeId: CHOICE_TYPE,
          id: `c${i}`,
          type: spec.type ?? 2,
          subType: spec.subType,
          label: "Choose",
          optionValue: spec.pick ? optionId(spec.pick) : null,
          optionIds: spec.labels.map(optionId),
        })),
        choiceDefinitions: [2, 3].map((type) => ({
          id: `${CHOICE_TYPE}-${type}`,
          options: allLabels.map((label) => ({ id: optionId(label), label })),
        })),
      },
      modifiers: {
        feat: mods.map(([type, friendlySubtypeName]) => ({
          componentId: FEAT, componentTypeId: FEAT_TYPE, type, subType: friendlySubtypeName.toLowerCase(), friendlySubtypeName,
        })),
      },
    },
  } as unknown as IDDBData;
}

function build(data: IDDBData, { isMuncher = false, description = "" } = {}) {
  return new FeatTraitAdvancements({
    ddbData: data,
    definition: { id: FEAT, entityTypeId: FEAT_TYPE, name: "Test Feat", description },
    isMuncher,
  }).build() as any[];
}

const SKILLS = DICTIONARY.actor.skills.map((s) => s.label);
const SAVES = DICTIONARY.actor.abilities.map((a) => `${a.long.charAt(0).toUpperCase()}${a.long.slice(1)} Saving Throws`);

describe("FeatTraitAdvancements.traitKey", () => {
  it.each([
    ["Sleight of Hand", "skills:slt"],
    ["Dexterity Saving Throws", "saves:dex"],
    ["Alchemist's Supplies", "tool:art:alchemist"],
    ["Alchemist’s Supplies", "tool:art:alchemist"],
    ["Common", "languages:standard:common"],
    ["Druidic", "languages:exotic:druidic"],
    ["Thieves' Cant", "languages:exotic:cant"],
    ["Elvish", "languages:standard:elvish"],
    ["Abyssal", "languages:exotic:abyssal"],
    ["Heavy Armor", "armor:hvy"],
    ["Martial Weapons", "weapon:mar"],
    ["Crossbow, Hand", "weapon:mar:handcrossbow"],
    ["Monster Harvesting Tools", null],
  ])("maps %s to %s", (label, key) => {
    expect(FeatTraitAdvancements.traitKey(label)).toBe(key);
  });
});

describe("FeatTraitAdvancements.build", () => {
  it("a fixed grant (Heavily Armored shape) records its grant on an import", () => {
    const [trait] = build(ddbData([], [["proficiency", "Heavy Armor"]]));
    expect(trait.configuration).toMatchObject({ mode: "default", allowReplacements: false, grants: ["armor:hvy"], choices: [] });
    expect(trait.level).toBe(0);
    expect(trait.value.chosen).toEqual(["armor:hvy"]);
  });

  it("counted skill-or-tool picks (Skilled shape) collapse to wildcards and are not fixed grants", () => {
    const tools = DICTIONARY.actor.proficiencies
      .filter((p) => p.type === "Tool" && "baseTool" in p && p.baseTool).map((p) => p.name);
    const pool = [...SKILLS, ...tools, "Monster Harvesting Tools"];
    const data = ddbData(
      ["Deception", "Investigation", "Bagpipes"].map((pick) => ({ subType: 1, labels: pool, pick })),
      [["proficiency", "Deception"], ["proficiency", "Investigation"], ["proficiency", "Bagpipes"]],
    );
    const [trait] = build(data);
    expect(trait.configuration.grants).toEqual([]);
    expect(trait.configuration.choices).toEqual([{ count: 3, pool: ["skills:*", "tool:*"] }]);
    expect(trait.value.chosen).toEqual(["skills:dec", "skills:inv", "tool:music:bagpipes"]);
  });

  it("leaves the value empty on the mule, where nothing is picked", () => {
    const [trait] = build(ddbData([{ subType: 1, labels: SKILLS, pick: null }]), { isMuncher: true });
    expect(trait.configuration.choices).toEqual([{ count: 1, pool: ["skills:*"] }]);
    expect(trait.value?.chosen).toBeUndefined();
  });

  it("a saving throw pick (Resilient shape)", () => {
    const [trait] = build(ddbData([{ subType: 1, labels: SAVES, pick: "Dexterity Saving Throws" }],
      [["proficiency", "Dexterity Saving Throws"]]));
    expect(trait.configuration).toMatchObject({ grants: [], choices: [{ count: 1, pool: ["saves:*"] }] });
    expect(trait.value.chosen).toEqual(["saves:dex"]);
  });

  it("language picks keep DDB's pool where it is not a whole group", () => {
    const [trait] = build(ddbData([
      { subType: 3, labels: ["Giant", "Celestial", "Elvish"], pick: "Giant" },
      { subType: 3, labels: ["Giant", "Celestial", "Elvish"], pick: "Celestial" },
    ], [["language", "Giant"], ["language", "Celestial"]]));
    expect(trait.configuration.choices).toEqual([{
      count: 2, pool: ["languages:standard:giant", "languages:exotic:celestial", "languages:standard:elvish"],
    }]);
    expect(trait.value.chosen).toEqual(["languages:standard:giant", "languages:exotic:celestial"]);
  });

  it("proficiency-or-expertise text (Observant shape) is one upgrade Trait, DDB's expertise branch folded in", () => {
    const pool = ["Insight", "Investigation", "Perception"];
    const [trait, ...rest] = build(
      ddbData([{ subType: 1, labels: pool, pick: "Perception" }, { subType: 2, labels: pool, pick: "Perception" }],
        [["expertise", "Perception"]]),
      { description: "<p>You gain proficiency in one of these skills. If you already have proficiency in it, you instead gain Expertise in it.</p>" },
    );
    expect(rest).toEqual([]);
    expect(trait.configuration).toMatchObject({ mode: "upgrade", grants: [], choices: [{ count: 1, pool: ["skills:ins", "skills:inv", "skills:prc"] }] });
    expect(trait.value.chosen).toEqual(["skills:prc"]);
  });

  it("a separate expertise pick (Skill Expert shape) is its own expertise Trait", () => {
    const traits = build(ddbData([
      { subType: 1, labels: SKILLS, pick: "Sleight of Hand" },
      { subType: 2, labels: SKILLS, pick: "Athletics" },
    ], [["proficiency", "Sleight of Hand"], ["expertise", "Athletics"]]));
    expect(traits.map((t) => t.configuration.mode)).toEqual(["default", "expertise"]);
    expect(traits[1].configuration.choices).toEqual([{ count: 1, pool: ["skills:*"] }]);
    expect(traits[1].value.chosen).toEqual(["skills:ath"]);
  });

  it("DDB's any-tool pool (no single gaming set) reads as tool:*", () => {
    const tools = DICTIONARY.actor.proficiencies
      .filter((p) => p.type === "Tool" && "baseTool" in p && p.baseTool && "toolType" in p && p.toolType !== "game")
      .map((p) => p.name);
    const [trait] = build(ddbData([{ subType: 1, labels: tools, pick: "Alchemist's Supplies" }]));
    expect(trait.configuration.choices).toEqual([{ count: 1, pool: ["tool:*"] }]);
  });

  it("DDB's standard-or-rare language pool (no Druidic or Thieves' Cant) reads as languages:*", () => {
    const standard = DICTIONARY.actor.languages
      .filter((l) => !l.name.includes("(") && l.advancement === "standard")
      .map((l) => l.name);
    const [trait] = build(ddbData([{ subType: 3, labels: [...standard, "Abyssal", "Sylvan", "Naku Naku"], pick: "Sylvan" }]));
    expect(trait.configuration.choices).toEqual([{ count: 1, pool: ["languages:*"] }]);
    expect(trait.value.chosen).toEqual(["languages:exotic:sylvan"]);
  });

  describe("picks DDB hangs off a type 3 option", () => {
    const ABILITIES = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
    const RESILIENT = "<p>Choose one ability score. You gain the following benefits: Increase the chosen ability score by 1. You gain proficiency in saving throws using the chosen ability.</p>";

    it("Resilient on the mule: the ability options become a save pick", () => {
      const [trait] = build(ddbData([{ type: 3, subType: null, labels: ABILITIES, pick: null }]),
        { isMuncher: true, description: RESILIENT });
      expect(trait.configuration).toMatchObject({ mode: "default", grants: [], choices: [{ count: 1, pool: ["saves:*"] }] });
    });

    it("Resilient on a character keeps DDB's own save choice, no second pick", () => {
      const traits = build(ddbData([
        { type: 3, subType: null, labels: ABILITIES, pick: "Dexterity" },
        { subType: 1, labels: SAVES, pick: "Dexterity Saving Throws" },
      ], [["proficiency", "Dexterity Saving Throws"]]), { description: RESILIENT });
      expect(traits).toHaveLength(1);
      expect(traits[0].configuration.choices).toEqual([{ count: 1, pool: ["saves:*"] }]);
      expect(traits[0].value.chosen).toEqual(["saves:dex"]);
    });

    const FORAGER = "<p>You gain proficiency in the Survival skill. If you already have this proficiency, you instead gain expertise with that skill.</p>";

    it("a skill switch named in the labels (Forager) is an upgrade grant on the mule", () => {
      const [trait, ...rest] = build(ddbData([{ type: 3, subType: null, labels: ["Survival: Proficiency", "Survival: Expertise"], pick: null }]),
        { isMuncher: true, description: FORAGER });
      expect(rest).toEqual([]);
      expect(trait.configuration).toMatchObject({ mode: "upgrade", grants: ["skills:sur"], choices: [] });
    });

    it("the same switch on a character replaces DDB's resolved proficiency with the upgrade", () => {
      const traits = build(ddbData([{ type: 3, subType: null, labels: ["Survival: Proficiency", "Survival: Expertise"], pick: "Survival: Expertise" }],
        [["expertise", "Survival"]]), { description: FORAGER });
      expect(traits).toHaveLength(1);
      expect(traits[0].configuration).toMatchObject({ mode: "upgrade", grants: ["skills:sur"] });
      expect(traits[0].value.chosen).toEqual(["skills:sur"]);
    });

    it("a switch whose labels name no skill reads it from the text (Showman)", () => {
      const [trait] = build(ddbData([{ type: 3, subType: null, labels: ["Expert Performer", "Expert Performer: Expertise"], pick: null }]),
        { isMuncher: true, description: "<p>Expert Performer. You gain proficiency in the Performance skill. If you already have proficiency in it, you gain Expertise in it. Taunt. You can mock a creature; it has Disadvantage on its next Insight check.</p>" });
      expect(trait.configuration).toMatchObject({ mode: "upgrade", grants: ["skills:prf"], choices: [] });
    });

    it("a switch over a listed choice is an upgrade pick (2024 Observant on the mule)", () => {
      const [trait] = build(ddbData([{ type: 3, subType: null, labels: ["Proficiency", "Expertise"], pick: null }]),
        { isMuncher: true, description: "<p>Keen Observer. Choose one of the following skills: Insight, Investigation, or Perception. If you lack proficiency with the chosen skill, you gain proficiency in it, and if you already have proficiency in it, you gain Expertise in it. Quick Search. You can Search as a Bonus Action.</p>" });
      expect(trait.configuration).toMatchObject({ mode: "upgrade", grants: [], choices: [{ count: 1, pool: ["skills:ins", "skills:inv", "skills:prc"] }] });
    });

    it("a two-skill switch (Discipline Acquisition) grants both as upgrades", () => {
      const [trait] = build(ddbData([{ type: 3, subType: null, labels: [
        "Animal Handling and Nature Proficiency", "Animal Handling Proficiency, Nature Expertise",
        "Animal Handling Expertise, Nature Proficiency", "Animal Handling and Nature Expertise",
      ], pick: null }]),
      { isMuncher: true, description: "<p>You gain proficiency in the Animal Handling and Nature skills. If you already have proficiency in that skill, you gain Expertise in it.</p>" });
      expect(trait.configuration).toMatchObject({ mode: "upgrade", grants: ["skills:ani", "skills:nat"] });
    });

    it("options that are not a proficiency switch (Focused Personas) add nothing", () => {
      expect(build(ddbData([{ type: 3, subType: null, labels: ["Activate Adept Persona", "Activate Expert Persona"], pick: null }]),
        { isMuncher: true, description: "<p>Choose a skill you are proficient in. You gain Expertise while you assume the persona.</p>" })).toEqual([]);
    });
  });

  describe("weapon mastery options (2024 Weapon Master)", () => {
    const WEAPON_MASTER = "<p>Mastery Property. Your training with weapons allows you to use the mastery property of one kind of Simple or Martial weapon of your choice.</p>";
    const masteryLabels = DICTIONARY.actor.proficiencies
      .filter((p) => p.type === "Weapon" && "mastery" in p && p.mastery && p.foundryValue && p.advancement && !p.name.includes(","))
      .map((p) => `${p.name} (${p.mastery!.charAt(0).toUpperCase()}${p.mastery!.slice(1)})`);

    it("the mule's option list is one mastery pick from weapon:*", () => {
      const [trait] = build(ddbData([{ type: 3, subType: null, labels: [...masteryLabels, "Atgeir (Pull)"], pick: null }]),
        { isMuncher: true, description: WEAPON_MASTER });
      expect(trait.configuration).toMatchObject({ mode: "mastery", grants: [], choices: [{ count: 1, pool: ["weapon:*"] }] });
    });

    it("a character's picked option is recorded", () => {
      const [trait] = build(ddbData([{ type: 3, subType: null, labels: masteryLabels, pick: "Greataxe (Cleave)" }]),
        { description: WEAPON_MASTER });
      expect(trait.value.chosen).toEqual(["weapon:mar:greataxe"]);
    });
  });

  it("Boon of Skill: every skill granted, Expertise pick is forcedExpertise, and the pick keeps its proficiency", () => {
    const data = ddbData([{ subType: 2, labels: SKILLS, pick: "Stealth" }],
      [...SKILLS.map((label) => ["proficiency", label] as [string, string]), ["expertise", "Stealth"]]);
    const [proficiency, expertise] = build(data);
    expect(proficiency.configuration.mode).toBe("default");
    expect(proficiency.configuration.grants).toHaveLength(SKILLS.length);
    expect(proficiency.configuration.grants).toContain("skills:ste");
    expect(expertise.configuration).toMatchObject({ mode: "forcedExpertise", choices: [{ count: 1, pool: ["skills:*"] }] });
    expect(expertise.value.chosen).toEqual(["skills:ste"]);
  });

  it("a proficiency-and-Expertise pick (Aereni Expertise, subtype 6) is forcedExpertise", () => {
    const [trait] = build(ddbData([{ subType: 6, labels: SKILLS, pick: "Athletics" }], [["proficiency", "Athletics"]]));
    expect(trait.configuration).toMatchObject({ mode: "forcedExpertise", grants: [], choices: [{ count: 1, pool: ["skills:*"] }] });
    expect(trait.value.chosen).toEqual(["skills:ath"]);
  });

  it("ignores ability and damage choices, and other features' modifiers", () => {
    const data = ddbData([{ subType: 5, labels: ["Strength Score"], pick: "Strength Score" }]);
    (data.character.modifiers.feat as any[]).push({ componentId: 1, componentTypeId: FEAT_TYPE, type: "proficiency", friendlySubtypeName: "Stealth" });
    expect(build(data)).toEqual([]);
  });
});
