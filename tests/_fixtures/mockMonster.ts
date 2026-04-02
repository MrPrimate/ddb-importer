/**
 * Factory for creating minimal DDBMonster-shaped mock objects.
 *
 * Monster parser prototype methods read from `this.source` (raw DDB data)
 * and write to `this.npc` (Foundry NPC actor data).
 */

export interface MockMonsterOverrides {
  source?: Record<string, any>;
  npc?: Record<string, any>;
  [key: string]: any;
}

/** Minimal ability block for npc.system.abilities */
function defaultAbilities() {
  return {
    str: { value: 10, proficient: 0, prof: 0, dc: 0, bonuses: { check: "", save: "" }, mod: 0 },
    dex: { value: 10, proficient: 0, prof: 0, dc: 0, bonuses: { check: "", save: "" }, mod: 0 },
    con: { value: 10, proficient: 0, prof: 0, dc: 0, bonuses: { check: "", save: "" }, mod: 0 },
    int: { value: 10, proficient: 0, prof: 0, dc: 0, bonuses: { check: "", save: "" }, mod: 0 },
    wis: { value: 10, proficient: 0, prof: 0, dc: 0, bonuses: { check: "", save: "" }, mod: 0 },
    cha: { value: 10, proficient: 0, prof: 0, dc: 0, bonuses: { check: "", save: "" }, mod: 0 },
  };
}

/** Minimal skills block matching foundry 5e NPC */
function defaultSkills() {
  const skills: Record<string, any> = {};
  const skillDefs = [
    { name: "acr", ability: "dex" }, { name: "ani", ability: "wis" },
    { name: "arc", ability: "int" }, { name: "ath", ability: "str" },
    { name: "dec", ability: "cha" }, { name: "his", ability: "int" },
    { name: "ins", ability: "wis" }, { name: "itm", ability: "cha" },
    { name: "inv", ability: "int" }, { name: "med", ability: "wis" },
    { name: "nat", ability: "int" }, { name: "prc", ability: "wis" },
    { name: "prf", ability: "cha" }, { name: "per", ability: "cha" },
    { name: "rel", ability: "int" }, { name: "slt", ability: "dex" },
    { name: "ste", ability: "dex" }, { name: "sur", ability: "wis" },
  ];
  for (const s of skillDefs) {
    skills[s.name] = { value: 0, ability: s.ability, bonuses: { check: "", passive: "" } };
  }
  return skills;
}

export function makeMockMonster(overrides: MockMonsterOverrides = {}): any {
  const { source: sourceOverrides, npc: npcOverrides, ...rest } = overrides;
  return {
    source: {
      id: 1,
      name: "Test Monster",
      sizeId: 4, // Medium
      typeId: 2, // Beast
      alignmentId: 10, // Unaligned
      armorClass: 10,
      armorClassDescription: "",
      averageHitPoints: 10,
      hitPointDice: { diceCount: 2, diceValue: 8, diceMultiplier: 0, fixedValue: 2, diceString: "2d8 + 2" },
      stats: [
        { statId: 1, name: null, value: 10 },
        { statId: 2, name: null, value: 10 },
        { statId: 3, name: null, value: 10 },
        { statId: 4, name: null, value: 10 },
        { statId: 5, name: null, value: 10 },
        { statId: 6, name: null, value: 10 },
      ],
      savingThrows: [],
      skills: [],
      skillsHtml: "",
      movements: [],
      senses: [],
      sensesHtml: "",
      languages: [],
      languageDescription: null,
      languageNote: null,
      damageAdjustments: [],
      conditionImmunities: [],
      challengeRatingId: 3, // CR 1/4 by default
      passivePerception: 10,
      isLegendary: false,
      isMythic: false,
      hasLair: false,
      specialTraitsDescription: "",
      actionsDescription: "",
      bonusActionsDescription: "",
      reactionsDescription: "",
      legendaryActionsDescription: "",
      mythicActionsDescription: "",
      lairDescription: "",
      characteristicsDescription: "",
      subTypes: [],
      swarm: null,
      environments: [],
      sourceId: 1,
      sourcePageNumber: null,
      sources: [],
      initiativeBonus: null,
      extraInitiative: null,
      extraTreasure: "",
      feats: [],
      ...sourceOverrides,
    },
    npc: {
      name: sourceOverrides?.name ?? "Test Monster",
      system: {
        abilities: defaultAbilities(),
        attributes: {
          hp: {},
          ac: {},
          init: { bonus: "" },
          movement: { walk: 0, fly: 0, swim: 0, burrow: 0, climb: 0, hover: false, units: "ft" },
          senses: {},
          spell: { level: 0 },
          spellcasting: "",
        },
        skills: defaultSkills(),
        traits: { size: "med", di: {}, dr: {}, dv: {}, ci: {}, languages: {} },
        details: {
          type: { value: "", subtype: "", swarm: "", custom: "" },
          source: {},
          cr: 0.25,
        },
      },
      prototypeToken: {
        width: 1,
        height: 1,
        texture: { scaleX: 1, scaleY: 1 },
        sight: { range: 0 },
        detectionModes: {},
      },
      flags: { ddbimporter: {}, dnd5e: {}, monsterMunch: {} },
      ...npcOverrides,
    },
    abilities: {},
    movement: {},
    spellcasting: { spelldc: 10, spellcasting: "", spellLevel: 0, spellAttackBonus: 0 },
    removedHitPoints: 0,
    temporaryHitPoints: 0,
    typeName: "",
    name: sourceOverrides?.name ?? "Test Monster",
    ...rest,
  };
}
