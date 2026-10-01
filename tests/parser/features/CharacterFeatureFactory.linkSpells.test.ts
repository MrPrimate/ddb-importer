// CharacterFeatureFactory.linkSpells: feat spell advancements (ItemGrant / ItemChoice) take the spell
// items DDB granted through the feat into value.added, and the spells carry the feat's origin.
import CharacterFeatureFactory from "../../../src/parser/features/CharacterFeatureFactory";
import type DDBCharacter from "../../../src/parser/DDBCharacter";

interface ISpellStub {
  id: string;
  name: string;
  level: number;
  lookup?: string;
  lookupId?: number;
  lookupName?: string;
  usesSpellSlot?: boolean;
  granted?: boolean;
  source?: string | null;
  ability?: string;
}

function spell({
  id, name, level, lookup = "feat", lookupId, lookupName, usesSpellSlot = false, granted, source, ability = "wis",
}: ISpellStub): any {
  const dndbeyond: any = { lookup, lookupId, lookupName, usesSpellSlot, ability };
  if (granted) dndbeyond.granted = true;
  const item: any = {
    _id: id,
    name,
    type: "spell",
    system: { level },
    flags: { ddbimporter: { originalName: name, dndbeyond } },
  };
  if (source !== null) item._stats = { compendiumSource: source ?? `Compendium.world.spells.Item.${id}` };
  return item;
}

function feat(id: string, name: string, ddbId: number, advancement: Record<string, any>): any {
  return {
    _id: id,
    name,
    type: "feat",
    system: { advancement },
    flags: { ddbimporter: { id: ddbId, type: "feat", originalName: name } },
  };
}

function grant(id: string, uuids: string[]): any {
  return {
    _id: id,
    type: "ItemGrant",
    configuration: { items: uuids.map((uuid) => ({ uuid, optional: false })), type: "spell", spell: { ability: ["wis"] } },
    value: {},
  };
}

function choice(id: string, level: number, count: number, pool: string[] = []): any {
  return {
    _id: id,
    type: "ItemChoice",
    configuration: {
      pool: pool.map((uuid) => ({ uuid })),
      choices: { "0": { count, replacement: false } },
      restriction: { level, type: "spell", list: [] },
      type: "spell",
      spell: { ability: ["wis"] },
    },
    value: { added: {}, replaced: {} },
  };
}

function factory(features: any[], spells: any[], spellLinks: IDDBSpellLink[] = [], actions: any[] = []) {
  // the constructor only reads the DDB source, the raw character and the parsed data stub
  const ddbCharacter = {
    source: { ddb: { character: { optionalOrigins: [] } } },
    raw: { character: {} },
    data: { features, actions, spells },
  } as unknown as DDBCharacter;
  const instance = new CharacterFeatureFactory(ddbCharacter);
  instance.spellLinks = spellLinks;
  return instance;
}

describe("CharacterFeatureFactory.linkSpells", () => {
  const MISTY = "Compendium.world.spells.Item.ddbMistyStep14II";

  it("links a grant by name and a list choice by level, leaving slot copies and other spells alone", () => {
    const fey = feat("feyTouched000000", "Fey Touched (Wisdom)", 1789250, {
      g1: grant("g1", [MISTY]),
      c1: choice("c1", 1, 1),
    });
    const mistyStep = spell({ id: "mistyFree0000000", name: "Misty Step", level: 2, lookupId: 1789250 });
    const mistyCopy = spell({ id: "mistyCopy0000000", name: "Misty Step", level: 2, lookupId: 1789250, usesSpellSlot: true, granted: true });
    const bless = spell({ id: "blessFree0000000", name: "Bless", level: 1, lookupId: 1789250 });
    const blessCopy = spell({ id: "blessCopy0000000", name: "Bless", level: 1, lookupId: 1789250, usesSpellSlot: true, granted: true });
    const classSpell = spell({ id: "cureWounds000000", name: "Cure Wounds", level: 1, lookup: "class" });
    const spellLinks: IDDBSpellLink[] = [
      { type: "grant", advancementId: "g1", choices: [], uuids: [{ name: "Misty Step", uuid: MISTY }], level: 1 },
      { type: "choice", advancementId: "c1", choices: { level: 1 }, level: 1 },
    ];

    factory([fey], [mistyStep, mistyCopy, bless, blessCopy, classSpell], spellLinks).linkSpells();

    expect(fey.system.advancement.g1.value).toEqual({ ability: "wis", added: { mistyFree0000000: MISTY } });
    expect(fey.system.advancement.c1.value).toEqual({
      ability: "wis",
      added: { "0": { blessFree0000000: "Compendium.world.spells.Item.blessFree0000000" } },
      replaced: {},
    });
    expect(mistyStep.flags.dnd5e).toEqual({ sourceId: MISTY, advancementOrigin: "feyTouched000000.g1" });
    expect(bless.flags.dnd5e.advancementOrigin).toBe("feyTouched000000.c1");
    expect(mistyCopy.flags.dnd5e).toBeUndefined();
    expect(blessCopy.flags.dnd5e).toBeUndefined();
    expect(classSpell.flags.dnd5e).toBeUndefined();
  });

  it("fills a cantrip list choice up to its count and leaves a spell with no advancement unlinked", () => {
    const initiate = feat("magicInitiate000", "Magic Initiate (Druid)", 63, { c1: choice("c1", 0, 2) });
    const guidance = spell({ id: "guidance00000000", name: "Guidance", level: 0, lookupId: 63 });
    const flame = spell({ id: "produceFlame0000", name: "Produce Flame", level: 0, lookupId: 63 });
    const extra = spell({ id: "thirdCantrip0000", name: "Shillelagh", level: 0, lookupId: 63 });
    const animals = spell({ id: "speakAnimals0000", name: "Speak with Animals", level: 1, lookupId: 63 });

    factory([initiate], [guidance, flame, extra, animals]).linkSpells();

    expect(Object.keys(initiate.system.advancement.c1.value.added["0"])).toEqual(["guidance00000000", "produceFlame0000"]);
    expect(extra.flags.dnd5e).toBeUndefined();
    expect(animals.flags.dnd5e).toBeUndefined();
  });

  it("matches a grant on the compendium source when no spell link was recorded, including feats parsed as actions", () => {
    const MAGE_HAND = "Compendium.world.spells.Item.ddbMageHand24III";
    const telekinetic = feat("telekinetic00000", "Telekinetic", 1789203, { g1: grant("g1", [MAGE_HAND]) });
    const mageHand = spell({ id: "mageHand00000000", name: "Mage Hand", level: 0, lookupId: 1789203, source: MAGE_HAND });
    const otherFeatSpell = spell({ id: "fireBolt00000000", name: "Fire Bolt", level: 0, lookupId: 999 });

    factory([], [mageHand, otherFeatSpell], [], [telekinetic]).linkSpells();

    expect(telekinetic.system.advancement.g1.value).toEqual({ ability: "wis", added: { mageHand00000000: MAGE_HAND } });
    expect(mageHand.flags.dnd5e.advancementOrigin).toBe("telekinetic00000.g1");
    expect(otherFeatSpell.flags.dnd5e).toBeUndefined();
  });

  it("falls back to the feat name when the spell carries no lookup id and skips spells it cannot source", () => {
    const feyPact = feat("feyPact000000000", "Fey Pact", 555, { g1: grant("g1", ["Compendium.world.spells.Item.ddbDruidcraft24I"]) });
    const druidcraft = spell({ id: "druidcraft000000", name: "Druidcraft", level: 0, lookupName: "Fey Pact" });
    const unsourced = feat("plantmender00000", "Plantmender", 777, { c1: choice("c1", 0, 1) });
    const mendPlants = spell({ id: "mendPlants000000", name: "Mend Plants", level: 0, lookupId: 777, source: null });
    const spellLinks: IDDBSpellLink[] = [
      { type: "grant", advancementId: "g1", choices: [], uuids: [{ name: "Druidcraft", uuid: "Compendium.world.spells.Item.ddbDruidcraft24I" }], level: 1 },
    ];

    factory([feyPact, unsourced], [druidcraft, mendPlants], spellLinks).linkSpells();

    expect(druidcraft.flags.dnd5e.advancementOrigin).toBe("feyPact000000000.g1");
    expect(unsourced.system.advancement.c1.value).toEqual({ added: {}, replaced: {} });
    expect(mendPlants.flags.dnd5e).toBeUndefined();
  });
});
