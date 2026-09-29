import { DICTIONARY } from "../../config/_module";
import type { IPublisherAmmunitionType } from "../../config/dictionary/items/ammunition";
import { utils, logger, CompendiumHelper, DDBSources, DDBToolProficiencies, ItemRarity } from "../../lib/_module";
import { DDBItemActivity } from "../activities/_module";
import { DDBItemEnricher, Effects } from "../enrichers/_module";
import MagicItemMaker from "./MagicItemMaker";
import Vestige from "./Vestige";
import { addRestrictionFlags } from "../../effects/restrictions";
import { DDBTable, DDBReferenceLinker, DDBModifiers, DDBDataUtils, DDBDescriptions, SystemHelpers } from "../lib/_module";
import DDBCharacter, { IDDBCharacterDataStub } from "../DDBCharacter";
import DDBActivityFactoryMixin from "../activities/mixins/DDBActivityFactoryMixin";
import DDBSummonsManager from "../companions/DDBSummonsManager";

interface IDDBItemMartialArtsDie {
  diceCount: number | null;
  diceMultiplier: number | null;
  diceString: string | null;
  diceValue: number | null;
  fixedValue: number | null;
}

interface IDDBItemFlags {
  damage: {
    parts: [string | number | null, string | null][];
  };
  classFeatures: string[];
  martialArtsDie: IDDBItemMartialArtsDie;
  maxMediumArmorDex: number;
  magicItemAttackInt: boolean;
}

interface IPerSpell {
  isPerSpell: boolean;
  charges: number | null;
}

interface IActionDataMagicBonus {
  null: number | null | "";
  zero: number;
}

export interface IActionData {
  associatedToolsOrAbilities: string[];
  // "none" = flat attack bonus, no ability contribution
  ability: T5eAbility | "none" | null;
  activation: I5eActivityActivation | null;
  consumption: unknown | null;
  effects: unknown | null;
  range: I5eActivityRange | null;
  target: I5eActivityTarget | null;
  save: I5eActivitySave | null;
  duration: I5eActivityDuration | null;
  attack: unknown | null;
  magicBonus: IActionDataMagicBonus;
  isFlat: boolean;
  extraAttackBonus: string;
  meleeAttack: boolean;
  spellAttack: boolean;
  consumptionValue: number | null;
  rangedAttack?: boolean;
  consumptionTargets?: I5eConsumptionTarget[];
  uses?: I5eSystemLimitedUses;
}

interface IDDBItem {
  ddbCharacter: DDBCharacter;
  ddbItem: IDDBInventoryItem;
  isCompendium?: boolean;
  enricher?: DDBItemEnricher | null;
  spellCompendium?: any;
  notifier?: NotifierV1 | null;
}

export default class DDBItem extends DDBActivityFactoryMixin<T5eInventoryTypes> {

  static CLOTHING_ITEMS = DICTIONARY.equipment.CLOTHING_ITEMS;
  static EQUIPMENT_TRINKET = DICTIONARY.equipment.EQUIPMENT_TRINKET;
  static LOOT_ITEM = DICTIONARY.equipment.LOOT_ITEM;
  static LOOT_TYPES = DICTIONARY.equipment.LOOT_TYPES;
  static NON_CONTAINERS = DICTIONARY.equipment.NON_CONTAINERS;
  static CONSUMABLE_WONDROUS_ITEMS = DICTIONARY.equipment.CONSUMABLE_WONDROUS_ITEMS;
  static CONSUMABLE_TRINKETS = DICTIONARY.equipment.CONSUMABLE_TRINKETS;
  static POTIONS = DICTIONARY.equipment.POTIONS;
  static AMMUNITION = DICTIONARY.equipment.AMMUNITION;

  /** The rolled item's own magical bonus; activity formulas resolve it live, enchantments included. */
  static MAGICAL_BONUS_REF = "@item.magicalBonus";

  /** Alternation of the six ability long names, for the save-parsing regexes. */
  static SAVE_ABILITY_NAMES = DDBDescriptions.SAVE_ABILITY_NAMES;

  /**
   * Map long ability names captured from a description to system keys, dropping
   * anything that is not one of the six abilities. `save.ability` is a choice
   * list, so "Strength or Dexterity saving throw" legitimately yields two.
   */
  static saveAbilityKeys(...names: (string | undefined)[]): string[] {
    return DDBDescriptions.saveAbilityKeys(...names);
  }

  declare data: I5eInventoryItem;
  ddbItem: IDDBInventoryItem;
  /** Restricted damage modifiers whose restriction names a save; see `#foldRestrictedSaveAttacks`. */
  #restrictedSaveAttacks: { name: string; restriction: string; damage: I5eDamagePart }[] = [];
  // never populated for items; activity generation guards its reads
  rawCharacter: I5ePCData | null = null;
  raw: IDDBCharacterDataStub;
  declare ddbDefinition: IDDBItemDefinition;
  isMuncher: boolean;
  isAction = false;
  legacy: boolean;
  is2014: boolean;
  is2024: boolean;
  originalName: string;
  name: string;
  parsingType: string | null;
  overrides: {
    ddbType: string | null;
    armorType: TEquipmentTypes | null;
    name: string | null;
    custom: boolean;
    earlyProperties: Set<string>;
  };
  isContainer: boolean;
  isContainerTag: boolean;
  isOuterwearTag: boolean;
  isClothingTag: boolean;
  isTashasInstalled: boolean;
  isTattoo: boolean;
  tattooType: boolean;
  isSpellwrought: boolean;
  isMealTag: boolean;
  isConsumable: boolean;
  isPotion: boolean;
  magicChargeType: string;
  itemTagTypes: string[];
  systemType: {
    value: string | null;
    subtype: string | null;
    baseItem: string | null;
  };
  addAutomationEffects: boolean;
  updateExisting: boolean;
  removeWeaponMasteryDescription: boolean;
  versatileDamage: I5eDamagePart | null;
  addMagical: boolean;
  characterEffectAbilities: I5eAbilities;
  ddbCharacter: DDBCharacter;
  characterProficiencies: IDDBPCDnDBeyondProficiencyFlags[];
  actionData: IActionData;
  // memoised by the multiSaveSections getter; [] means "single save, do not reshape"
  #multiSaveSections?: { slice: ISectionSlice; save: IParsedSave }[];
  perSpell: IPerSpell;
  damageParts: I5eDamagePart[];
  healingParts: I5eDamagePart[];
  spellCompendium: CompendiumCollection<"Item"> | null;
  activityOptions: IDDBItemActivityBuild;
  // assigned by #generateItemFlags() in the constructor
  flags!: IDDBItemFlags;
  infusionItemMap: IDDBInfusionItem | undefined;
  infusionDetail: IDDBInfusionDefinition | null | undefined;
  declare documentType: T5eInventoryTypes;

  constructor({ ddbCharacter, ddbItem, isCompendium = false, enricher = null, spellCompendium = null, notifier = null }: IDDBItem) {
    if (!ddbCharacter || !ddbItem) {
      logger.error("DDBCharacter and DDBItem are required to create DDBItem");
      throw new Error("DDBCharacter and DDBItem are required to create DDBItem");
    }
    if (!ddbCharacter.source) {
      logger.error("DDBCharacter source data must be loaded before creating DDBItem");
      throw new Error("DDBCharacter source data must be loaded before creating DDBItem");
    }
    const addEffects = isCompendium
      ? utils.getSetting<boolean>("munching-policy-add-midi-effects")
      : utils.getSetting<boolean>("character-update-policy-add-midi-effects");

    super({
      enricher,
      activityGenerator: DDBItemActivity,
      notifier,
      useMidiAutomations: addEffects,
      usesOnActivity: false,
    });

    this.notifier = notifier;
    this.ddbCharacter = ddbCharacter as DDBCharacter;
    this.ddbData = ddbCharacter.source.ddb;
    this.ddbItem = ddbItem;
    this.ddbDefinition = ddbItem.definition;
    this.data = {} as any;
    if (!this.ddbDefinition.description && !this.ddbDefinition.snippet) this.ddbDefinition.description = "";
    this.raw = ddbCharacter.raw;
    this.isMuncher = isCompendium;
    foundry.utils.setProperty(this.ddbItem, "isCompendiumItem", isCompendium);
    foundry.utils.setProperty(this.ddbItem, "isMuncher", isCompendium);

    this.legacy = this.ddbDefinition.isLegacy;
    this.is2014 = this.ddbDefinition.sources.every((s) => DDBSources.is2014Source(s));
    this.is2024 = !this.is2014;

    this.originalName = utils.nameString(ddbItem.definition.name);
    this.name = DDBDataUtils.getName(this.ddbData, ddbItem, this.raw?.character);
    this.#generateItemFlags();

    // this.documentType is initialised to null by the mixin constructor
    this.parsingType = null;

    this.overrides = {
      ddbType: null,
      armorType: null,
      name: null,
      custom: false,
      earlyProperties: new Set(),
    };

    this.characterProficiencies = foundry.utils.getProperty(this.raw?.character, "flags.ddbimporter.dndbeyond.proficienciesIncludingEffects") as IDDBPCDnDBeyondProficiencyFlags[]
      ?? [];
    this.characterEffectAbilities = foundry.utils.getProperty(this.raw?.character, "flags.ddbimporter.dndbeyond.effectAbilities") as I5eAbilities;

    this.isContainer = this.ddbDefinition.isContainer && !DDBItem.NON_CONTAINERS.includes(this.ddbDefinition.name);
    this.isContainerTag = this.ddbDefinition.tags.includes("Container");
    this.isOuterwearTag = this.ddbDefinition.tags.includes("Outerwear")
      || this.ddbDefinition.tags.includes("Footwear");
    this.isClothingTag = this.isOuterwearTag || this.ddbDefinition.tags.includes("Clothing");
    this.isTashasInstalled = game.modules.get("dnd-tashas-cauldron")?.active ?? false;
    this.isTattoo = this.ddbDefinition.name.toLowerCase().includes("tattoo");
    this.tattooType = this.isTashasInstalled && this.isTattoo;
    this.isSpellwrought = this.ddbDefinition.name.toLowerCase().includes("spellwrought");
    this.isMealTag = this.ddbDefinition.tags.includes("Meal")
      || this.ddbDefinition.tags.includes("magical meal")
      || this.ddbDefinition.tags.includes("Food")
      || this.originalName.startsWith("Magnetite Curry");
    this.isConsumable = DDBItem.CONSUMABLE_TRINKETS.includes(this.originalName)
      || DDBItem.CONSUMABLE_TRINKETS.some((t) => this.originalName.startsWith(t))
      || DDBItem.CONSUMABLE_WONDROUS_ITEMS.includes(this.originalName)
      || DDBItem.CONSUMABLE_WONDROUS_ITEMS.some((t) => this.originalName.startsWith(t));
    this.isPotion = this.ddbDefinition.tags.includes("Potion")
      || DDBItem.POTIONS.includes(this.originalName);
    // this.ddbDefinition.isConsumable; // this adds too many

    // if the item is x per spell
    this.perSpell = this.parsePerSpellMagicItem(this.ddbItem.limitedUse?.resetTypeDescription ?? "");

    this.magicChargeType = this.perSpell.isPerSpell
      ? MagicItemMaker.MAGICITEMS.CHARGE_TYPE_PER_SPELL
      : MagicItemMaker.MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM;

    this.itemTagTypes = this.ddbDefinition.type && this.ddbDefinition.tags && Array.isArray(this.ddbDefinition.tags)
      ? [this.ddbDefinition.type.toLowerCase(), ...this.ddbDefinition.tags.map((t) => t.toLowerCase())]
      : this.ddbDefinition.type
        ? [this.ddbDefinition.type.toLowerCase()]
        : this.ddbDefinition.tags && Array.isArray(this.ddbDefinition.tags)
          ? this.ddbDefinition.tags.map((t) => t.toLowerCase())
          : [];

    this.systemType = {
      value: null,
      subtype: null,
      baseItem: null,
    };

    this.addAutomationEffects = this.isMuncher
      ? utils.getSetting<boolean>("munching-policy-add-midi-effects")
      : utils.getSetting<boolean>("character-update-policy-add-midi-effects");

    this.updateExisting = this.isMuncher
      ? utils.getSetting<boolean>("munching-policy-update-existing")
      : false;
    this.removeWeaponMasteryDescription = this.is2014
      || utils.getSetting<boolean>("munching-policy-remove-weapon-mastery-description");
    this._init();

    this.#determineType();

    this.actionData = {
      associatedToolsOrAbilities: [],
      ability: null,
      activation: null,
      consumption: null,
      effects: null,
      range: null,
      target: null,
      save: null,
      duration: null,
      attack: null,
      magicBonus: {
        null: null,
        zero: 0,
      },
      isFlat: false,
      extraAttackBonus: "",
      meleeAttack: true,
      spellAttack: false,
      consumptionValue: null,
    };

    this.activityOptions = {};

    this.damageParts = [];
    this.healingParts = [];
    this.versatileDamage = null;
    this.addMagical = false;

    this.enricher = enricher ?? new DDBItemEnricher({ activityGenerator: DDBItemActivity, notifier: this.notifier });
    this.spellCompendium = spellCompendium ?? CompendiumHelper.getCompendiumType("spells", false);

  }

  static async prepareSpellCompendiumIndex() {
    await CompendiumHelper.loadCompendiumIndex("spells", {
      fields: ["name", "flags.ddbimporter.id", "flags.ddbimporter.definitionId", "flags.ddbimporter.isLegacy", "system.source.rules"],
    });
  }

  _init() {
    logger.debug(`Generating Item ${this.ddbDefinition.name}`);
  }

  async #generateDataStub() {
    if (this.enricher.documentStub?.documentType) this.documentType = this.enricher.documentStub.documentType as T5eInventoryTypes;
    // mergeObject mutates this.systemType in place (inplace defaults to true)
    if (this.enricher.documentStub?.systemType) foundry.utils.mergeObject(this.systemType, this.enricher.documentStub.systemType);
    if (this.enricher.documentStub?.parsingType) this.parsingType = this.enricher.documentStub.parsingType;

    if (!this.documentType) {
      logger.error(`Document type must be set: ${this.ddbDefinition.name}`, {
        this: this,
      });
      throw Error("Document type must be set", {
        cause: this,
      });
    }

    this.data = {
      _id: foundry.utils.randomID(),
      name: this.name,
      type: this.documentType as T5eInventoryTypes,
      effects: [],
      system: SystemHelpers.getTemplate(this.documentType),
      flags: {
        ddbimporter: {
          originalName: this.originalName,
          version: CONFIG.DDBI.version,
          dndbeyond: {
            type: this.ddbDefinition.type ?? undefined,
          },
          is2014: this.is2014,
          is2024: !this.is2014,
          legacy: this.legacy,
        },
      },
    };

    if (this.enricher.documentStub?.copySRD) {
      const srdDoc = await fromUuid(this.enricher.documentStub.copySRD.uuid);
      if (srdDoc) {
        const systemData = (srdDoc.toObject() as I5eInventoryItem).system;
        systemData.source.book = "";
        systemData.source.license = "";
        this.data.system = systemData;
      } else {
        logger.warn(`Unable to load SRD document ${this.enricher.documentStub.copySRD.uuid} for ${this.ddbDefinition.name}`);
      }
    }

    if (this.enricher.documentStub?.replaceDefaultActivity) {
      if ("activities" in this.data.system) {
        this.data.system.activities = {};
      } else {
        logger.error(`Unable to replace default activity for ${this.ddbDefinition.name} as no activities property found`);
      }
    }

    // Spells will still have activation/duration/range/target,
    // weapons will still have range & damage (1 base part & 1 versatile part),
    // and all items will still have limited uses (but no consumption)

    if (foundry.utils.hasProperty(this.data, "system.type.value")) {
      this.data.system.type.value = this.systemType.value ?? "";
    } else if (this.systemType.value) {
      logger.error(`Unable to set type ${this.systemType.value} for ${this.ddbDefinition.name}`, {
        this: this,
      });
    }
    this.data.system.identified = true;

    const legacyName = utils.getSetting<boolean>("munching-policy-legacy-postfix");
    if (this.isMuncher && legacyName && this.legacy) {
      this.data.name += " (Legacy)";
    }

    for (const value of Array.from(this.overrides.earlyProperties)) {
      this.data.system.properties = utils.addToProperties(this.data.system.properties, value);
    }

    this.#addExtraDDBFlags();
    this.#enrichFlags();
  }

  #getActivityDuration(): I5eActivityDuration {
    const duration: I5eActivityDuration = {
      value: null,
      units: "",
      special: "",
    };

    const durationArray: { foundryUnit: TDurationUnit; descriptionMatches: string[] }[] = [
      { foundryUnit: "day", descriptionMatches: ["day", "days"] },
      { foundryUnit: "hour", descriptionMatches: ["hour", "hours"] },
      { foundryUnit: "inst", descriptionMatches: ["instant", "instantaneous"] },
      { foundryUnit: "minute", descriptionMatches: ["minute", "minutes"] },
      { foundryUnit: "month", descriptionMatches: ["month", "months"] },
      { foundryUnit: "perm", descriptionMatches: ["permanent"] },
      { foundryUnit: "round", descriptionMatches: ["round", "rounds"] },
      // { foundryUnit: "spec", descriptionMatches: [null] },
      { foundryUnit: "turn", descriptionMatches: ["turn", "turns"] },
      { foundryUnit: "year", descriptionMatches: ["year", "years"] },
    ];
    // attempt to parse duration
    const descriptionUnits = durationArray.map((unit) => unit.descriptionMatches).flat().join("|");
    const durationExpression = new RegExp(`(\\d*)(?:\\s)(${descriptionUnits})`);
    const durationMatch = (this.ddbDefinition.description ?? "").match(durationExpression);

    if (durationMatch) {
      const durationUnit = durationArray.find((duration) => duration.descriptionMatches.includes(durationMatch[2]));
      if (durationUnit) {
        duration.units = durationUnit.foundryUnit;
        duration.value = durationMatch[1];
      }
    }
    return duration;
  }

  /**
   * Read a save out of an item's rules text, or null when it names none.
   *
   * The ability is matched by name rather than captured with a wildcard: a
   * wildcard would swallow the "DC 15 " prefix of the usual phrasing and read
   * part of it as the ability, and a lazy match could reach across a sentence
   * and pair a DC with an ability from somewhere else entirely.
   *
   * DDB text writes the roll as both "saving throw" and the "save" shorthand
   * ("must succeed on a DC 15 Constitution save"), so both are accepted.
   *
   * Where an item describes several saves - a magic item with two properties -
   * the explicit-DC form wins, so that the ability and the DC at least come
   * from the same sentence. An item whose two saves both matter needs an
   * enricher that builds each save as its own activity.
   */
  static parseSaveFromDescription(description: string): I5eActivitySave | null {
    const save = {
      ability: [] as string[],
      dc: {
        calculation: "",
        formula: "",
      },
    } satisfies I5eActivitySave;
    let found = false;
    const abilities = DDBItem.SAVE_ABILITY_NAMES;

    // "succeed on a Dexterity saving throw against your spell save DC", and the
    // far more common "succeed on a DC 15 Dexterity saving throw"
    const spellSaveExpression
      = new RegExp(`succeed on an? (?:DC (\\d+) )?(${abilities})(?: or (${abilities}))? sav(?:e|ing throw)( against your spell save DC)?`, "i");
    const spellSaveCheck = description.match(spellSaveExpression);
    if (spellSaveCheck) {
      save.ability = DDBItem.saveAbilityKeys(spellSaveCheck[2], spellSaveCheck[3]);
      if (spellSaveCheck[4]) save.dc.calculation = "spellcasting";
      else if (spellSaveCheck[1]) save.dc.formula = spellSaveCheck[1];
      found = true;
    }

    // any other phrasing carrying an explicit DC: "must make a DC 15 Dexterity saving throw"
    const saveExpression = new RegExp(`DC (\\d+) (${abilities})(?: or (${abilities}))? sav(?:e|ing throw)`, "i");
    const saveCheck = description.match(saveExpression);
    if (saveCheck) {
      save.ability = DDBItem.saveAbilityKeys(saveCheck[2], saveCheck[3]);
      save.dc.formula = `${saveCheck[1]}`;
      save.dc.calculation = "";
      found = true;
    }

    if (found && !save.dc.formula && !save.dc.calculation) {
      const proseDC = DDBItem.parseProseSaveDC(description);
      if (proseDC) save.dc = proseDC;
    }

    return found ? save : null;
  }

  /**
   * A save DC written out as a sum rather than a number: "(DC 10 plus your Proficiency Bonus)" or
   * "DC equals 8 plus your Strength modifier and your Proficiency Bonus". The item-bonus form
   * ("DC = 16 + the axe's bonus") needs the item's bonus, see {@link DDBItem.parseItemBonusSaveDC}.
   */
  static parseProseSaveDC(description: string): { calculation: string; formula: string } | null {
    const text = DDBDescriptions.plainText(description);
    const abilities = DDBItem.SAVE_ABILITY_NAMES;
    const lead = "DC (?:for the save )?(?:equals |is equal to |is |= )?";

    const plus = "(?:plus|\\+|and)";
    const abilityDC = text.match(new RegExp(
      `${lead}8 (?:plus|\\+) your (?:(${abilities}) modifier ${plus} (?:your )?Proficiency Bonus|Proficiency Bonus ${plus} (?:your )?(${abilities}) modifier)`,
      "i",
    ));
    if (abilityDC) {
      const [ability] = DDBItem.saveAbilityKeys(abilityDC[1] ?? abilityDC[2]);
      if (ability) return { calculation: ability, formula: "" };
    }

    // a further term after the bonus is one this cannot resolve, such as the ability used for the attack
    const profDC = text.match(new RegExp(`${lead}(\\d+) (?:plus|\\+) your Proficiency Bonus(?! ${plus})`, "i"));
    if (profDC) return { calculation: "", formula: `${profDC[1]} + @prof` };

    return null;
  }

  static RESTRICTION_NAMES_SAVE = /\bsav(?:e|ing)\b/i;

  /**
   * The save a restricted damage modifier's restriction names, as far as it says:
   * "Backfire - DC 15 CON save", "Dex. Save: DC 16", "DC 13 Dexterity saving throw".
   */
  static restrictionSave(restriction: string): { abilities: string[]; dc: string | null } {
    const abilities = new Set<string>();
    for (const match of restriction.matchAll(/\b(str|dex|con|int|wis|cha)(?:ength|terity|stitution|elligence|dom|risma)?\b/gi)) {
      abilities.add(match[1].toLowerCase());
    }
    const dc = restriction.match(/\bDC:? ?(\d+)/i);
    return { abilities: [...abilities], dc: dc ? dc[1] : null };
  }

  /**
   * DDB often ships the damage of a weapon's save as a restricted damage modifier as well, which
   * the parser turns into a "Restricted Attack" activity: a second attack roll for damage the
   * save already rolls. Such an attack is dropped when a save activity on the item rolls the same
   * dice against the save the restriction names. Where no save carries the dice (wound damage
   * that a save ends, on-hit dice beside a condition-only save) the attack is the only home of
   * that damage and stays.
   */
  #foldRestrictedSaveAttacks(): void {
    if (this.#restrictedSaveAttacks.length === 0) return;
    if (!("activities" in this.data.system) || !this.data.system.activities) return;
    const activities = this.data.system.activities as Record<string, I5eActivity>;
    const saves = Object.values(activities).filter((activity) => activity.type === "save");
    if (saves.length === 0) return;

    for (const restricted of this.#restrictedSaveAttacks) {
      const { number, denomination } = restricted.damage;
      if (!number || !denomination) continue;
      const { abilities, dc } = DDBItem.restrictionSave(restricted.restriction);
      const covered = saves.some((activity) => {
        const saveAbilities = Array.from(activity.save?.ability ?? []);
        if (abilities.length > 0 && !abilities.some((ability) => saveAbilities.includes(ability))) return false;
        const formula = activity.save?.dc?.formula;
        if (dc && formula && (/^\d+$/).test(formula) && formula !== dc) return false;
        return (activity.damage?.parts ?? []).some((part) => part.number === number && part.denomination === denomination);
      });
      if (!covered) continue;
      // DDB restrictions carry stray whitespace ("Save DC: 15 Dex.  "), which Foundry's string
      // field trims from the activity name when the activity is built live
      const squash = (name: string): string => name.replace(/\s+/g, " ").trim();
      const name = squash(restricted.name);
      for (const [id, activity] of Object.entries(activities)) {
        if (activity.type === "attack" && squash(activity.name ?? "") === name) delete activities[id];
      }
    }
  }

  /**
   * The charge cost of a spell cast from an item. DDB states a fixed cost as the maximum alone
   * (`minNumberConsumed` null, Lesser Restoration's 2 charges on a Staff of Healing) and a
   * variable cost as a min-max range (Cure Wounds' 1 to 4), so the minimum wins, then the
   * maximum, and only then the item's generic cost. Zero is a real cost and survives.
   */
  static itemSpellChargeCost(
    limitedUse: { minNumberConsumed?: number | string | null; maxNumberConsumed?: number | string | null } | null | undefined,
    fallback: number | string | null | undefined,
  ): { cost: number; min: number | null; max: number | null; variable: boolean } {
    const count = (value: number | string | null | undefined): number | null => {
      if (value === null || value === undefined || value === "") return null;
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    };
    const min = count(limitedUse?.minNumberConsumed);
    const max = count(limitedUse?.maxNumberConsumed);
    const cost = min ?? max ?? count(fallback) ?? 1;
    return { cost, min, max, variable: min !== null && max !== null && max > min };
  }

  /**
   * The consumption scaling ceiling for a variable charge cost. dnd5e offers scaling values 1 to
   * max and spends `cost + value - 1`, so the ceiling is the size of the range, capped by the
   * charges left.
   */
  static itemSpellChargeScalingMax(min: number, max: number): string {
    const levels = max - min + 1;
    return min === 1
      ? `min(@item.uses.value,${levels})`
      : `min(@item.uses.value - ${min - 1},${levels})`;
  }

  /** The fixed part of an item-bonus DC, "DC = 16 + the axe's bonus", or null. */
  static parseItemBonusSaveDC(description: string): number | null {
    const text = DDBDescriptions.plainText(description);
    const match = text.match(/DC (?:equals |is equal to |is |= )?(\d+) (?:plus|\+) (?:the|this) [\w\s'’-]{1,30}?['’]s? bonus/i);
    return match ? Number(match[1]) : null;
  }

  #generateSave() {
    const description = this.ddbDefinition.description ?? "";
    const save = DDBItem.parseSaveFromDescription(description);
    if (!save) return;
    // Only where system.magicalBonus is set: the field is blank-able, and a sheet save on a
    // magical item without a bonus writes "", which makes "16 + @item.magicalBonus" roll DC 0.
    // Other item types have no system.magicalBonus; their variants' enrichers bake the DC.
    const bonusDC = !save.dc?.formula && !save.dc?.calculation
      && ["weapon", "staff", "ammunition"].includes(this.parsingType ?? "")
      && (this.#getMagicalBonus(true) as number) > 0
      ? DDBItem.parseItemBonusSaveDC(description)
      : null;
    if (bonusDC) save.dc = { calculation: "", formula: `${bonusDC} + ${DDBItem.MAGICAL_BONUS_REF}` };
    if (save.dc?.formula && (/^\d+$/).test(save.dc.formula)) {
      const abilityNames = (save.ability ?? [])
        .map((key) => DICTIONARY.actor.abilities.find((ability) => ability.value === key)?.long)
        .filter((name): name is T5eAbilityLongNames => Boolean(name));
      const stageDC = Vestige.getStageSaveDC(this.originalName, description, abilityNames);
      if (stageDC) save.dc = { calculation: "", formula: stageDC };
    }
    this.actionData.save = save;
  }

  /**
   * The activation a wondrous item's own text states, earliest mention first. 2014 items say
   * "as an action" or "use an action"; 2024 items "take a Magic action", "as a Utilize action" or
   * "requires a Magic action". A spell cast from the item with no wording keeps the default: the
   * cast activity carries the spell's own casting time.
   */
  static ACTIVATION_WORDING = /(?<bonus>bonus action)|(?<reaction>reaction)|(?<action>(?:as|take|takes|taking) (?:a|an|the) (?:magic |utilize |study |search |influence )?action|(?:use|uses|using|spend|spends|requires) (?:a|an|your|its) (?:magic |utilize )?action)/i;


  #generateActivityActivation() {
    // default
    this.actionData.activation = ["armor"].includes(this.parsingType ?? "")
      ? { type: "none", value: 1, condition: "" }
      : { type: "action", value: 1, condition: "" };

    // 2024 rules: drinking or administering a potion is a Bonus Action (the DDB text never says
    // so, it only describes the effect), and that is how the SRD 2024 potions ship. DDB
    // tags only a few potions "Potion"; the rest carry it as the item type.
    const potionType = [this.ddbDefinition.filterType, this.ddbDefinition.subType, this.overrides.ddbType].includes("Potion");
    if (this.is2024 && (this.isPotion || potionType)) {
      this.actionData.activation = { type: "bonus", value: 1, condition: "" };
    }

    if (["wondrous", "armor"].includes(this.parsingType ?? "")) {
      let action: TActivationCost = ["wondrous"].includes(this.parsingType ?? "") ? "special" : "none";
      const match = (this.ddbDefinition.description ?? "").match(DDBItem.ACTIVATION_WORDING);
      if (match?.groups) {
        if (match.groups.bonus) action = "bonus";
        else if (match.groups.reaction) action = "reaction";
        else if (match.groups.action) action = "action";
      }

      this.actionData.activation = { type: action ?? "none", value: action ? 1 : undefined, condition: "" };
    }

  }

  #fixedAttackCheck() {
    const attachRegex = /makes its attack roll with a \+(\d+) bonus/;
    const attackMatch = (this.ddbDefinition.description ?? "").match(attachRegex);
    if (attackMatch) {
      this.actionData.isFlat = true;
      this.actionData.extraAttackBonus = attackMatch[1];
      this.actionData.ability = "none";
      this.actionData.spellAttack = true;
    }

    const attackTypeRegex = /(ranged|melee) (spell|weapon|unarmed) attack/;
    const attackTypeMatch = (this.ddbDefinition.description ?? "").match(attackTypeRegex);
    if (attackTypeMatch) {
      this.actionData.spellAttack = attackTypeMatch[2] === "spell";
      this.actionData.rangedAttack = attackTypeMatch[1] === "ranged";
      this.actionData.meleeAttack = attackTypeMatch[1] === "melee";
    }

  }

  #generateActionData() {
    this.actionData.duration = this.#getActivityDuration();
    this.actionData.range = this.#getActivityRange();
    this.#generateActivityActivation();
    this.#generateSave();
    this.#fixedAttackCheck();
  }


  #generateAmmunitionDamage() {
    // first damage part
    // blowguns and other weapons rely on ammunition that provides the damage parts
    if (this.ddbDefinition.damage && this.ddbDefinition.damage.diceString && this.ddbDefinition.damageType) {
      const damageString = utils.parseDiceString(this.ddbDefinition.damage.diceString).diceString;
      const damage = SystemHelpers.buildDamagePart({
        damageString,
        type: this.ddbDefinition.damageType.toLowerCase(),
      });
      this.damageParts.push(damage);
    }

    // additional damage parts
    if (this.enricher.combineGrantedDamageModifiers) {
      this.damageParts.push(...DDBItem.getCombinedDamageModifiers(this.ddbDefinition.grantedModifiers));
    } else {
      const additionalDamageParts = DDBItem.getDamageParts(
        this.ddbDefinition.grantedModifiers
          .filter((mod) => mod.type === "damage" && (!mod.restriction || mod.restriction === "")),
      );
      this.damageParts.push(...additionalDamageParts);
    }

    // Add saving throw additional
    // e.g. arrow of slaying is "DC 17 Constitution for Half Damage",
    this.ddbDefinition.grantedModifiers
      .filter((mod) => mod.type === "damage" && mod.restriction && mod.restriction !== "")
      .forEach((mod) => {
        if (!mod.restriction) return; // filtered above, narrow for typing
        const damageParts = DDBItem.getDamageParts([mod]);

        if (damageParts.length === 0) {
          const saveSearch = /DC (\d+) (\w+) /i;
          const saveMatch = mod.restriction.match(saveSearch);

          this.additionalActivities.push({
            name: saveMatch ? `Save` : "Additional Damage",
            type: saveMatch ? "save" : "damage",
            options: {
              generateDamage: true,
              damageParts,
              includeBaseDamage: false,
              saveOverride: saveMatch
                ? {
                  dc: {
                    formula: `${saveMatch[1]}`,
                    calculation: "",
                  },
                  ability: [saveMatch[2].toLowerCase().substring(0, 3)],
                }
                : null,
            },
          });
        }
      });
  }

  #generateGrantedModifiersDamageParts() {
    // DDB files both healing amounts and maximum hit point increases as bonus/hit-points; the
    // dice block tells them apart (EffectGenerator turns the dice-less ones into hp.bonuses.overall)
    const healingModifiers = this.ddbDefinition.grantedModifiers.filter(
      (mod) => mod.type === "bonus" && mod.subType === "hit-points" && (mod.dice ?? mod.die),
    );
    if (healingModifiers) {
      const healingDamageParts = DDBItem.getDamageParts(healingModifiers, "healing");
      this.healingParts.push(...healingDamageParts);
    }

    if (this.enricher.combineGrantedDamageModifiers) {
      this.damageParts.push(...DDBItem.getCombinedDamageModifiers(this.ddbDefinition.grantedModifiers));
    } else {
      const additionalDamageParts = DDBItem.getDamageParts(
        this.ddbDefinition.grantedModifiers
          .filter((mod) => mod.type === "damage" && CONFIG.DND5E.damageTypes[mod.subType]),
      );
      this.damageParts.push(...additionalDamageParts);
    }

  }

  #generateStaffDamageParts() {
    const weaponBehavior = this.ddbDefinition.weaponBehaviors[0];
    if (weaponBehavior) {
      const versatile = (weaponBehavior.properties ?? []).find((property) => property.name === "Versatile");
      if (versatile && versatile.notes) {
        this.versatileDamage = SystemHelpers.buildDamagePart({
          damageString: utils.parseDiceString(versatile.notes).diceString,
        });
      }

      // first damage part
      // blowguns and other weapons rely on ammunition that provides the damage parts
      if (weaponBehavior.damage && weaponBehavior.damage.diceString && weaponBehavior.damageType) {
        const damageString = utils.parseDiceString(weaponBehavior.damage.diceString).diceString;
        const damage = SystemHelpers.buildDamagePart({
          damageString,
          type: weaponBehavior.damageType.toLowerCase(),
          stripMod: true,
        });
        this.damageParts.push(damage);
      }
    }

    // additional damage parts
    this.#generateGrantedModifiersDamageParts();

  }

  getDamageType(): I5eDamageType | undefined {
    if (this.ddbDefinition.damageType) {
      const damageTypeReplace = this.ddbDefinition.grantedModifiers.find((mod) =>
        mod.type === "replace-damage-type"
        && (!mod.restriction || mod.restriction === ""),
      );

      const damageType: I5eDamageType = damageTypeReplace
        ? damageTypeReplace.subType.toLowerCase() as I5eDamageType
        : this.ddbDefinition.damageType.toLowerCase() as I5eDamageType;
      return damageType;
    } else {
      return undefined;
    }
  }

  /**
   * Great Weapon Fighting's die modifier for this weapon's damage dice, baked onto the damage
   * parts because dnd5e 6 has no rule change that alters a die result. The Fighting Style enricher
   * ships an AC5e effect that applies it at roll time from the attack's actual grip, so this stands
   * down when AC5e is installed.
   * @returns {string[]} the dice modifiers to add, empty when none apply
   */
  get greatWeaponFightingModifiers(): string[] {
    if (this.parsingType !== "weapon") return [];
    if (this.ddbDefinition.attackType !== 1) return [];
    if (SystemHelpers.effectModules().ac5eInstalled) return [];
    if (this.flags.classFeatures.includes("greatWeaponFighting2024")) return ["min3"];
    if (this.flags.classFeatures.includes("greatWeaponFighting")) return ["r<=2"];
    return [];
  }

  /**
   * Adds dice modifiers to a damage part that rolls dice; a flat or custom formula part is left alone.
   * @param {I5eDamagePart} damage the damage part to modify
   * @param {string[]} modifiers the dice modifiers to add
   */
  static addDamageDieModifiers(damage: I5eDamagePart, modifiers: string[]): void {
    if (modifiers.length === 0 || !damage.number || !damage.denomination || damage.custom?.enabled) return;
    damage.modifiers = [...new Set([...(damage.modifiers ?? []), ...modifiers])];
  }

  #generateWeaponDamageParts() {
    const greatWeaponFighting = this.greatWeaponFightingModifiers;
    const twoHanded = (this.ddbDefinition.properties ?? []).find((property) => property.name === "Two-Handed");

    const damageType = this.getDamageType();

    const versatile = (this.ddbDefinition.properties ?? []).find((property) => property.name === "Versatile");
    if (versatile && versatile.notes) {
      this.versatileDamage = SystemHelpers.buildDamagePart({
        damageString: utils.parseDiceString(versatile.notes).diceString,
      });
      // the versatile part is only rolled when the weapon is held in two hands
      DDBItem.addDamageDieModifiers(this.versatileDamage, greatWeaponFighting);
    }

    // a Versatile weapon's base damage is its one-handed damage, so only Two-Handed weapons qualify
    const fightingStyleDiceMod = twoHanded ? greatWeaponFighting : [];

    // if we are a martial artist and the weapon is eligable we may need to use a bigger dice type.
    // this martial arts die info is added to the weapon flags before parse weapon is called
    const martialArtsDie = this.flags.martialArtsDie;

    if (Number.isInteger(this.ddbDefinition.fixedDamage)) {
      const damage = SystemHelpers.buildDamagePart({
        damageString: utils.parseDiceString(String(this.ddbDefinition.fixedDamage)).diceString,
        stripMod: true,
        type: damageType,
      });
      this.damageParts.push(damage);
    } else if (this.ddbDefinition.damage && this.ddbDefinition.damage.diceString && damageType) {
      let diceString = this.ddbDefinition.damage.diceString;
      if (martialArtsDie.diceValue && martialArtsDie.diceString && this.ddbDefinition.damage.diceValue
        && martialArtsDie.diceValue > this.ddbDefinition.damage.diceValue
      ) {
        diceString = martialArtsDie.diceString;
      }
      const damage = SystemHelpers.buildDamagePart({
        damageString: utils.parseDiceString(diceString).diceString,
        stripMod: true,
        type: damageType,
      });
      DDBItem.addDamageDieModifiers(damage, fightingStyleDiceMod);
      this.damageParts.push(damage);
    }

    const modsOnWeapon = this.ddbDefinition.grantedModifiers.filter((mod) => mod.type === "damage");
    const unfilteredDamageMods = modsOnWeapon.length === 0
      ? DDBModifiers.getModifiers(this.ddbData, "item")
        .filter((mod) => mod.type === "damage" && this.ddbDefinition.id === mod.componentId
          && this.ddbDefinition.entityTypeId === mod.componentTypeId)
      : modsOnWeapon;

    // console.error(`Weapon mods for ${this.name}`, {
    //   unfilteredDamageMods,
    //   modsOnWeapon,
    //   raw: DDBModifiers.getModifiers(this.ddbData, "item"),
    //   filtered: DDBModifiers.getModifiers(this.ddbData, "item")
    //     .filter((mod) => mod.type === "damage" && this.ddbDefinition.id === mod.componentId
    //       && this.ddbDefinition.entityTypeId === mod.componentTypeId),
    // })

    // additional damage parts with no restrictions
    const unfilteredParts: I5eDamagePart[] = [];
    unfilteredDamageMods
      .filter((mod) => !mod.restriction || mod.restriction === "")
      .forEach((mod) => {
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        const damagePart = die ? die.diceString : mod.value;
        if (damagePart) {
          const damage = SystemHelpers.buildDamagePart({
            damageString: utils.parseDiceString(String(damagePart)).diceString,
            stripMod: true,
            type: mod.subType ? mod.subType : "",
          });
          DDBItem.addDamageDieModifiers(damage, fightingStyleDiceMod);
          unfilteredParts.push(damage);
        }
      });


    if (this.enricher.combineGrantedDamageModifiers) {
      this.damageParts.push(...DDBItem.filterCombinedDamageParts(unfilteredParts));
    } else {
      this.damageParts.push(...unfilteredParts);
    }


    const restrictions: string[] = [];
    // loop over restricted damage types
    unfilteredDamageMods
      .filter((mod) => mod.restriction && mod.restriction !== "")
      .forEach((mod) => {
        if (!mod.restriction) return; // filtered above, narrow for typing
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        const damagePart = die
          ? die.diceString
          : mod.value
            ? `${mod.value}`
            : undefined;
        if (damagePart) {
          const damage = SystemHelpers.buildDamagePart({
            damageString: damagePart,
            stripMod: true,
            type: mod.subType ? mod.subType : "",
          });

          const viciousWeapon = this.originalName.startsWith("Vicious ");
          if (!viciousWeapon) {
            const includeBaseRegex = /takes an extra/i;
            const includeBaseDamage = includeBaseRegex.test(this.ddbDefinition.description);

            if (DDBItem.RESTRICTION_NAMES_SAVE.test(mod.restriction)) {
              this.#restrictedSaveAttacks.push({ name: `Restricted Attack: ${mod.restriction}`, restriction: mod.restriction, damage });
            }
            this.additionalActivities.push({
              name: `Restricted Attack: ${mod.restriction}`,
              type: "attack",
              options: {
                generateDamage: true,
                damageParts: [damage],
                includeBaseDamage: includeBaseDamage || (this.enricher.activity?.additionalDamageIncludeBase ?? false),
                chatFlavor: mod.restriction ?? "",
              },
            });
            restrictions.push(mod.restriction);
          }
          if (viciousWeapon && !this.name.includes("Net")) {
            this.activityOptions.criticalDamage = "7";
          }
        }
      });

    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.restrictions", restrictions);
    // add damage modifiers from other sources like improved divine smite
    if (this.flags.damage.parts) {
      this.flags.damage.parts.forEach((part) => {
        const damage = SystemHelpers.buildDamagePart({
          damageString: String(part[0]),
          stripMod: true,
          type: part[1],
        });
        this.damageParts.push(damage);
      });
    }
  }

  /**
   * Gets the DND5E weapontype (simpleM, martialR etc.) as string
   * Supported Types only: Simple/Martial Melee/Ranged and Ammunition (Firearms in D&DBeyond)
   * @returns {string} WeaponType
   */
  #getWeaponType(): TWeaponType {
    const type = DICTIONARY.weapon.weaponType.find(
      (type) => type.categoryId === this.ddbDefinition.categoryId,
    );
    const range = DICTIONARY.weapon.weaponRange.find(
      (type) => type.attackType === this.ddbDefinition.attackType,
    );

    const isAdvancedWeapon = (this.ddbDefinition.description ?? "").includes("Mastery of Advanced Weapons requires military training and skill");
    if (isAdvancedWeapon) {
      if (range) return `advanced${range.value}` as TWeaponType;
      else return "advancedM";
    }

    if (type && range) {
      return `${type.value}${range.value}` as TWeaponType;
    } else {
      return "simpleM";
    }
  }

  #getArmorType(): TArmorType | "clothing" | "bonus" | null {
    // get the generic armor type
    const nameEntry = DICTIONARY.equipment.armorType.find((type) => type.name === this.ddbDefinition.type);
    const idEntry = DICTIONARY.equipment.armorType.find((type) => type.id === this.ddbDefinition.armorTypeId);

    const armorType = nameEntry !== undefined
      ? nameEntry.value
      : idEntry !== undefined
        ? idEntry.value
        : "medium";

    return armorType;
  }

  #generateArmorMaxDex() {
    if (!("armor" in this.data.system)) return;
    const armorData = this.data.system.armor;
    if (!armorData) return;
    let maxDexModifier;
    switch (this.systemType.value) {
      case "heavy":
        maxDexModifier = 0;
        break;
      case "medium":
        maxDexModifier = this.flags.maxMediumArmorDex ?? 2;
        break;
      default:
        maxDexModifier = null;
        break;
    }
    const maxDexMods = DDBModifiers.filterModifiersOld(this.ddbDefinition.grantedModifiers, "set", "ac-max-dex-modifier");
    const itemDexMaxAdjustment = DDBModifiers.getModifierSum(maxDexMods, this.raw?.character);
    if (maxDexModifier !== null && Number.isInteger(itemDexMaxAdjustment) && Number(itemDexMaxAdjustment) > maxDexModifier) {
      maxDexModifier = Number(itemDexMaxAdjustment);
    }

    armorData.dex = maxDexModifier;
  }

  #determineOtherGearTypeIdOneType() {
    switch (this.ddbDefinition.subType) {
      case "Potion":
        this.documentType = "consumable";
        this.systemType.value = "potion";
        this.parsingType = "consumable";
        this.overrides.ddbType = this.ddbDefinition.subType;
        break;
      case "Tool":
        this.documentType = "tool";
        this.parsingType = "tool";
        this.overrides.ddbType = this.ddbDefinition.subType;
        break;
      case "Ammunition":
        this.documentType = "consumable";
        this.systemType.value = "ammo";
        this.parsingType = "ammunition";
        this.overrides.ddbType = this.ddbDefinition.subType;
        break;
      case "Arcane Focus":
      case "Holy Symbol":
      case "Druidic Focus":
        this.documentType = "equipment";
        this.parsingType = "wondrous";
        this.overrides.ddbType = this.ddbDefinition.subType;
        this.overrides.earlyProperties.add("foc");
        if (this.ddbDefinition.name.toLowerCase().includes("wand")) {
          this.systemType.value = "wand";
        } else if (this.ddbDefinition.name.toLowerCase().includes("rod")) {
          this.systemType.value = "rod";
        } else if (this.ddbDefinition.name.toLowerCase().includes("staff")) {
          this.documentType = "weapon";
          this.systemType.value = "simpleM";
          this.systemType.baseItem = "quarterstaff";
          this.parsingType = "weapon";
        } else {
          this.systemType.value = "trinket";
        }
        break;
      case "Vehicle":
      case "Mount":
        this.#getLootType(this.ddbDefinition.subType);
        break;
      default: {
        // console.warn(`Default subtype for ${this.name}`, {
        //   this: this,
        //   clothingItem: DDBItem.CLOTHING_ITEMS.includes(this.ddbDefinition.name),
        //   clothingExpressions: !this.isContainer && this.isOuterwearTag && !this.isContainerTag,
        // });
        // if (this.isMealTag) {
        //   this.documentType = "consumable";
        //   this.systemType.value = "food";
        //   this.parsingType = "consumable";
        //   // this.overrides.ddbType = this.ddbDefinition.subType;
        // } else
        if ((!this.isContainer && this.isOuterwearTag && !this.isContainerTag)
          || DDBItem.CLOTHING_ITEMS.includes(this.ddbDefinition.name)
        ) {
          this.documentType = "equipment";
          this.systemType.value = "clothing";
          this.parsingType = "wondrous";
          this.overrides.ddbType = "Clothing";
          this.overrides.armorType = "clothing"; // might not need this anymore
        } else if (DDBItem.EQUIPMENT_TRINKET.includes(this.ddbDefinition.name)) {
          this.documentType = "equipment";
          this.systemType.value = "trinket";
          this.parsingType = "wondrous";
          this.overrides.ddbType = this.ddbDefinition.subType;
        } else {
          this.#getLootType(this.ddbDefinition.subType);
        }
      }
    }
  }


  #getLootType(typeHint: string | null) {
    this.overrides.ddbType = typeHint ?? this.ddbDefinition.subType;
    this.parsingType = "loot";
    this.documentType = "loot";

    if (this.isContainer
      || (!DDBItem.NON_CONTAINERS.includes(this.ddbDefinition.name) && (["Mount", "Vehicle"].includes(this.ddbDefinition.subType ?? "")
      || ["Vehicle", "Mount"].includes(typeHint ?? "")))
    ) {
      this.overrides.ddbType = typeHint;
      this.documentType = "container";
      return;
    } else if (this.ddbDefinition.name.startsWith("Lantern,")
      || ["Lamp", "Healer's Kit"].includes(this.ddbDefinition.name)
    ) {
      this.documentType = "consumable";
      this.systemType.value = "trinket";
      return;
    } else if (["Waterskin"].includes(this.ddbDefinition.name)) {
      this.documentType = "consumable";
      this.systemType.value = "food";
      return;
    } else if (this.ddbDefinition.name.startsWith("Spell Scroll:")) {
      this.documentType = "consumable";
      this.systemType.value = "scroll";
      this.parsingType = "scroll";
      return;
    }

    let itemType: T5eInventoryTypes = this.itemTagTypes
      .map((itemType) => {
        if (itemType === "container") return "container";
        if (itemType === "consumable") return "consumable";
        return DICTIONARY.types.full.find((t) => t.indexOf(itemType) !== -1 || itemType.indexOf(t) !== -1);
      })
      .reduce(
        (itemType, currentType) => (currentType !== undefined && itemType === undefined ? currentType : itemType),
        undefined,
      ) as T5eInventoryTypes;

    if (!itemType && this.ddbDefinition.type === "Gear"
      && ["Adventuring Gear"].includes(this.ddbDefinition.subType ?? "")
      && !DDBItem.LOOT_ITEM.includes(this.ddbDefinition.name)
    ) {
      // && data.definition.subType === "Adventuring Gear"
      // && data.definition.tags.includes('Utility')
      // && ((data.definition.tags.includes('Damage')
      // && data.definition.tags.includes('Combat'))
      // || data.definition.tags.includes('Healing'));
      itemType = "consumable";
    }

    if (itemType) {
      this.documentType = itemType;
      if (itemType === "consumable") {
        if (this.ddbDefinition.name.includes("vial") || this.ddbDefinition.name.includes("flask")) {
          this.systemType.value = "potion";
        } else if (this.ddbDefinition.name.startsWith("Ration")) {
          this.systemType.value = "food";
        } else if (this.ddbDefinition.magic) {
          this.systemType.value = "wondrous";
        } else {
          this.systemType.value = "trinket";
        }
      }
    }

    if (this.documentType === "loot") {
      const lookup = DDBItem.LOOT_TYPES[typeHint ?? ""]
        ?? DDBItem.LOOT_TYPES[this.ddbDefinition.subType ?? ""];
      if (lookup) this.systemType.value = lookup;
      else {
        logger.warn(`Failed to find loot type for ${this.ddbDefinition.name}, this is unlikely to be a problem`, {
          this: this,
          itemType,
          lookup,
        });
      }
    }
  }

  #fallbackType() {
    if (this.ddbDefinition.name.includes(" Ring") || this.ddbDefinition.name.startsWith("Ring ")) {
      this.documentType = "equipment";
      this.systemType.value = "ring";
      this.overrides.armorType = "ring";
      this.parsingType = "wondrous";
      this.overrides.ddbType = "Ring";
    } else if (this.ddbDefinition.subType) {
      this.#getLootType(this.ddbDefinition.subType);
    } else {
      this.#getLootType("Miscellaneous");
    }
  }

  #determineOtherGearType() {
    switch (this.ddbDefinition.gearTypeId) {
      case 1:
        this.#determineOtherGearTypeIdOneType();
        break;
      case 4:
        this.#getLootType("Mount");
        break;
      case 5:
        this.documentType = "consumable";
        this.systemType.value = "potion";
        this.parsingType = "consumable";
        this.overrides.ddbType = "Poison";
        break;
      case 6:
        this.documentType = "consumable";
        this.systemType.value = "potion";
        this.parsingType = "consumable";
        this.overrides.ddbType = "Potion";
        break;
      case 11:
        this.documentType = "tool";
        this.parsingType = "tool";
        this.overrides.ddbType = "Tool";
        break;
      case 12:
      case 17:
      case 19:
        this.#getLootType("Vehicle");
        break;
      case 16:
        this.#getLootType("Equipment Pack");
        break;
      case 18:
        // Change to parseGemstone (consummable) ?
        this.#getLootType("Gemstone");
        break;
      default:
        this.#fallbackType();
        logger.warn("Other Gear type missing from " + this.ddbDefinition.name, this.ddbItem);
    }
  }


  #determineType() {
    if (!this.ddbDefinition.filterType) {
      if (this.ddbDefinition.name.startsWith("Spell Scroll:")) {
        this.documentType = "consumable";
        this.systemType.value = "scroll";
        this.parsingType = "scroll";
      } else {
        this.documentType = "loot";
        this.parsingType = "custom";
      }
      this.overrides.ddbType = "Custom Item";
      this.overrides.custom = true;
      return;
    }

    switch (this.ddbDefinition.filterType) {
      case "Weapon": {
        if (this.ddbDefinition.type === "Ammunition" || this.ddbDefinition.subType === "Ammunition") {
          this.documentType = "consumable";
          this.systemType.value = "ammo";
          this.parsingType = "ammunition";
        } else {
          this.documentType = "weapon";
          this.systemType.value = this.#getWeaponType();
          this.parsingType = "weapon";
        }
        break;
      }
      case "Armor":
        this.documentType = "equipment";
        this.systemType.value = this.#getArmorType();
        this.parsingType = "armor";
        break;
      case "Ring": {
        this.documentType = "equipment";
        this.systemType.value = "ring";
        this.overrides.armorType = "ring";
        this.parsingType = "wondrous";
        break;
      }
      case "Wondrous item": {
        if ([
          "bead of",
          "dust of",
          "elemental gem",
        ].some((consumablePrefix) => this.ddbDefinition.name.toLowerCase().startsWith(consumablePrefix.toLowerCase()))) {
          this.documentType = "consumable";
          this.systemType.value = "wondrous";
          this.parsingType = "consumable";
          this.overrides.ddbType = this.ddbDefinition.type;
        } else if (this.isTattoo) {
          this.overrides.ddbType = "Tattoo";
          const type = this.tattooType
            ? "dnd-tashas-cauldron.tattoo"
            : this.isContainer
              ? "container"
              : this.isSpellwrought ? "consumable" : "equipment";
          // in this instance we know tashsa's is valid
          this.documentType = type as T5eInventoryTypes;
          this.parsingType = "wondrous";
          if (this.isSpellwrought) {
            this.systemType.value = "tattoo";
            this.addMagical = true;
          }
          if (this.tattooType) {
            this.systemType.value = this.isSpellwrought
              ? "spellwrought"
              : "permanent";
            this.addMagical = true;
          }
        } else if (this.isContainer) {
          this.documentType = "container";
          this.parsingType = "wondrous";
        } else if (this.isMealTag) {
          this.documentType = "consumable";
          this.systemType.value = "food";
          this.parsingType = "consumable";
        } else if (this.isConsumable) {
          // console.error(`Consumable: ${this.ddbDefinition.name}`);
          this.documentType = "consumable";
          this.systemType.value = "wondrous";
          this.parsingType = "consumable";
          this.overrides.ddbType = this.ddbDefinition.type;
        } else if (this.isPotion) {
          this.documentType = "consumable";
          this.systemType.value = "potion";
          this.parsingType = "consumable";
          this.overrides.ddbType = this.ddbDefinition.type;
        } else {
          this.documentType = "equipment";
          this.systemType.value = "trinket";
          this.parsingType = "wondrous";
        }
        break;
      }
      case "Wand":
      case "Rod":
        this.documentType = "equipment";
        this.systemType.value = this.ddbDefinition.filterType.toLowerCase();
        this.parsingType = this.ddbDefinition.filterType.toLowerCase();
        this.overrides.ddbType = this.ddbDefinition.type;
        this.overrides.earlyProperties.add("foc");
        break;
      case "Scroll":
        this.documentType = "consumable";
        this.systemType.value = this.ddbDefinition.filterType.toLowerCase();
        this.parsingType = "scroll";
        this.overrides.ddbType = this.ddbDefinition.type;
        break;
      case "Staff":
        this.documentType = "weapon";
        this.systemType.value = this.#getWeaponType();
        this.parsingType = "staff";
        this.overrides.earlyProperties.add("foc");
        break;
      case "Potion":
        this.documentType = "consumable";
        this.systemType.value = "potion";
        this.parsingType = "consumable";
        this.overrides.ddbType = this.ddbDefinition.type;
        break;
      case "Other Gear":
        this.#determineOtherGearType();
        break;
      default:
        logger.warn(`Item filterType not implemented for ${this.ddbDefinition.name}`, { DDBItem: this });
        break;
    }

  }

  #getWarlockFeatures(): string[] {
    // Some features, notably hexblade abilities we scrape out here
    const warlockFeatures = this.ddbData.character.characterValues
      .filter(
        (characterValue) =>
          characterValue.value
          && characterValue.valueId == this.ddbItem.id
          && DICTIONARY.actor.characterValuesLookup.some(
            (entry) => entry.typeId == characterValue.typeId,
          ),
      )
      .map(
        (characterValue) =>
          // the filter above guarantees a matching lookup entry exists
          DICTIONARY.actor.characterValuesLookup.find(
            (entry) => entry.typeId == characterValue.typeId,
          )!.name,
      );

    // Any Pact Weapon Features
    const pactFeatures = (this.ddbData.character.options.class ?? [])
      .filter(
        (option) =>
          warlockFeatures.includes("pactWeapon")
          && option.definition.name
          && DICTIONARY.actor.pactFeatures.includes(option.definition.name),
      )
      .map((option) => option.definition.name);

    const features = warlockFeatures.concat(pactFeatures);
    return features;
  }

  isMartialArtists(): boolean {
    return this.ddbData.character.classes.some((cls) => cls.classFeatures.some((feature) => feature.definition.name === "Martial Arts"));
  }

  #getMonkFeatures(): string[] {
    const kenseiWeapon = DDBModifiers.getChosenClassModifiers(this.ddbData).some((mod) =>
      mod.friendlySubtypeName === this.ddbDefinition.type
      && mod.type === "kensei",
    );

    const monkWeapon = DDBModifiers.getChosenClassModifiers(this.ddbData).some((mod) =>
      mod.friendlySubtypeName === this.ddbDefinition.type
      && mod.type == "monk-weapon",
    ) || (this.ddbDefinition.isMonkWeapon && this.isMartialArtists());

    const features = [];

    if (kenseiWeapon) features.push("kenseiWeapon");
    if (monkWeapon) features.push("monkWeapon");

    return features;
  }

  /**
   * Overkill (Gunslinger 11)
   * @param {IDDBClass[] | null | undefined} classes the character's classes
   * @returns {boolean} true if the character has the feature at the required level
   */
  static hasOverkill(classes: IDDBClass[] | null | undefined): boolean {
    return (classes ?? []).some((cls) =>
      cls.definition?.name === "Gunslinger"
      && (cls.classFeatures ?? []).some((feature) =>
        feature.definition.name === "Overkill"
        && cls.level >= (feature.definition.requiredLevel ?? 0)),
    );
  }

  #getGunslingerFeatures(): string[] {
    return DDBItem.hasOverkill(this.ddbData.character?.classes) ? ["overkill"] : [];
  }

  /**
   * Critical Shot (Gunslinger 2)
   * @param {IDDBClass[] | null | undefined} classes the character's classes
   * @returns {number | null} the critical hit threshold, or null without the feature
   */
  static getCriticalShotThreshold(classes: IDDBClass[] | null | undefined): number | null {
    for (const cls of classes ?? []) {
      if (cls.definition?.name !== "Gunslinger") continue;
      const feature = (cls.classFeatures ?? []).find((f) =>
        f.definition.name === "Critical Shot"
        && cls.level >= (f.definition.requiredLevel ?? 0),
      );
      if (feature?.levelScale?.fixedValue) return feature.levelScale.fixedValue;
    }
    return null;
  }

  #getMartialArtsDie(): IDDBItemMartialArtsDie {
    let result: IDDBItemMartialArtsDie = {
      diceCount: null,
      diceMultiplier: null,
      diceString: null,
      diceValue: null,
      fixedValue: null,
    };

    const die = this.ddbData.character.classes
      // is a martial artist
      .filter((cls) => cls.classFeatures.some((feature) => feature.definition.name === "Martial Arts"))
      // get class features
      .map((cls) => cls.classFeatures)
      .flat()
      // filter relevant features, those that are martial arts and have a levelscaling hd
      .filter((feature) => feature.definition.name === "Martial Arts" && feature.levelScale && feature.levelScale.dice)
      // get this dice object (the filter above guarantees levelScale.dice exists)
      .map((feature) => feature.levelScale!.dice!);

    if (die && die.length > 0) {
      result = die[0];
    }

    return result;
  }

  /**
   * Retrieves extra damage modifiers for weapon attacks based on provided restrictions.
   * e.g. Divine Smite
   * @param {Array} restrictions An array of restrictions to filter damage modifiers.
   * @returns {Array} An array of damage modifiers, each represented as a tuple
   *                  [diceString or value, subType]. If no matching die or value is found,
   *                  returns [null, null].
   */
  #getExtraDamage(restrictions: string[]): [string | number | null, string | null][] {
    return DDBModifiers.filterBaseModifiers(this.ddbData, "damage", { restriction: restrictions }).map((mod) => {
      const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
      if (die) {
        return [die.diceString, mod.subType];
      } else if (mod.value) {
        return [mod.value, mod.subType];
      } else {
        return [null, null];
      }
    });
  }

  #getClassFeatures() {
    const warlockFeatures = this.#getWarlockFeatures();
    const monkFeatures = this.#getMonkFeatures();
    const gunslingerFeatures = this.#getGunslingerFeatures();
    return warlockFeatures.concat(monkFeatures, gunslingerFeatures);
  }

  #generateItemFlags() {
    const grantedModifiers = this.ddbDefinition.grantedModifiers ?? (foundry.utils.getProperty(this.ddbItem, "grantedModifiers") as IDDBModifier[]) ?? [];
    this.flags = {
      damage: {
        parts: [],
      },
      // Some features, notably hexblade abilities we scrape out here
      classFeatures: this.#getClassFeatures(),
      martialArtsDie: this.#getMartialArtsDie(),
      maxMediumArmorDex: Math.max(
        ...DDBModifiers.filterBaseModifiers(this.ddbData, "set", { subType: "ac-max-dex-armored-modifier", includeExcludedEffects: true }).map((mod) => parseInt(String(mod.value))),
        ...DDBModifiers.filterModifiersOld(grantedModifiers, "set", "ac-max-dex-armored-modifier", ["", null]).map((mod) => parseInt(String(mod.value))),
        ...DDBModifiers.filterModifiersOld(grantedModifiers, "set", "ac-max-dex-modifier", ["", null]).map((mod) => parseInt(String(mod.value))),
        2,
      ),
      magicItemAttackInt:
        DDBModifiers.filterBaseModifiers(this.ddbData, "bonus", { subType: "magic-item-attack-with-intelligence" }).length > 0
        || DDBModifiers.filterBaseModifiers(this.ddbData, "replace-weapon-ability", { subType: "intelligence-score" }).length > 0,
    };

    if (this.flags.classFeatures.includes("Lifedrinker") && this.is2014) {
      this.flags.damage.parts.push(["@abilities.cha.mod", "necrotic"]);
    }

    // for melee attacks get extras
    if (this.ddbDefinition.attackType === 1) {
      // get improved divine smite etc for melee attacks
      const extraDamage = this.#getExtraDamage(["Melee Weapon Attacks"]);

      if (extraDamage.length > 0) {
        this.flags.damage.parts = this.flags.damage.parts.concat(extraDamage);
      }
      // do we have great weapon fighting? 2014 is a class option, 2024 a Fighting Style feat
      if (DDBDataUtils.hasCharacterFeat(this.ddbData, "Great Weapon Fighting")) {
        this.flags.classFeatures.push("greatWeaponFighting2024");
      } else if (DDBDataUtils.hasChosenCharacterOption(this.ddbData, "Great Weapon Fighting")) {
        this.flags.classFeatures.push("greatWeaponFighting");
      }
      // do we have two weapon fighting style?
      if (DDBDataUtils.hasChosenCharacterOption(this.ddbData, "Two-Weapon Fighting")) {
        this.flags.classFeatures.push("Two-Weapon Fighting");
      }
      if (DDBDataUtils.getCustomValueFromCharacter(this.ddbItem, this.raw?.character, 18)) {
        this.flags.classFeatures.push("OffHand");
      }
    }
    // ranged fighting style is added as a global modifier elsewhere
    // as is defensive style

    logger.debug(`Flags for ${this.ddbDefinition.name}`, { ddbItem: this.ddbItem, flags: this.flags });
  };


  async #prepare() {
    await this.loadEnricher();
    await this.#generateDataStub();
    this.#generateBaseItem();
    this.#generateActionData();
    this.#generateDamageParts();
  }

  #getDescription(): I5eItemDescription {
    const chatSnippet = this.ddbDefinition.snippet ? this.ddbDefinition.snippet : "";
    const chatAdd = utils.getSetting<boolean>("add-description-to-chat");

    const attunementText = this.ddbDefinition.canAttune && this.ddbDefinition.attunementDescription && this.ddbDefinition.attunementDescription !== ""
      ? `<div class="item-attunement"><i>(Requires attunement by a ${this.ddbDefinition.attunementDescription})</i></div>`
      : "";

    const valueDamageText = DDBReferenceLinker.parseDamageRolls({ text: this.ddbDefinition.description, document: this.data });
    const chatDamageText = chatAdd ? DDBReferenceLinker.parseDamageRolls({ text: chatSnippet, document: this.data }) : "";
    return {
      value: DDBReferenceLinker.parseTags(attunementText + valueDamageText),
      chat: chatAdd ? DDBReferenceLinker.parseTags(chatDamageText ?? "") : "",
    };
  }

  #generateQuantity() {
    this.data.system.quantity = this.ddbDefinition.quantity
      ? this.ddbDefinition.quantity
      : this.ddbItem.quantity
        ? this.ddbItem.quantity
        : 1;
  }

  #getSingleItemWeight(): I5eItemWeight {
    const bundleSize = this.ddbDefinition?.bundleSize ? this.ddbDefinition.bundleSize : 1;
    const totalWeight = this.ddbDefinition?.weight ? this.ddbDefinition.weight : 0;
    const weight = totalWeight / bundleSize;
    return {
      value: weight,
      units: "lb",
    };
  }

  #generateEquipped() {
    if (!("equipped" in this.data.system)) return;
    if (this.ddbDefinition.canEquip !== undefined && this.ddbDefinition.canEquip === true) {
      this.data.system.equipped = this.ddbItem.equipped;
    } else {
      this.data.system.equipped = false;
    }
  }

  /**
   * dnd5e 6.0 holds rarity as a set with no "varies" member. A DDB "Varies" family root gets the
   * tiers its description and its batch siblings name (the sheet then shows "Varies" and the
   * compendium browser matches every tier); "Unknown Rarity" and an unparseable "Varies" become an
   * empty set. The DDB label is kept on the dndbeyond flags either way so the rarity compendium
   * folders can still bucket those items.
   */
  #generateItemRarity() {
    const label = this.ddbDefinition.rarity;
    let rarities = ItemRarity.fromDDB(label, this.ddbDefinition.magic);
    if (rarities.length === 0 && label === "Varies") {
      const siblings = (this.ddbData?.character?.inventory ?? []).map((item) => item.definition);
      rarities = ItemRarity.forVaries(this.ddbDefinition.name, this.ddbDefinition.description, siblings);
    }
    this.data.system.rarities = rarities;
    if (label) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.rarity", label);
    }
  }

  #getActivityRange(): I5eActivityRange {
    const range: I5eActivityRange = {
      value: this.ddbDefinition.range ? this.ddbDefinition.range : null,
      long: this.ddbDefinition.longRange ? this.ddbDefinition.longRange : null,
      units: (this.ddbDefinition.range || this.ddbDefinition.range) ? "ft" : "",
      special: "",
    };

    if (this.ddbDefinition.description.includes("touch")) {
      range.units = "touch";
    }

    const thrownRangeRegex = /(throw|thrown|throw this|throw it|throw the|throw a (?:\w+))( \w+| at a point)? (the|this|up to) (\d+) feet/ig;
    const match = thrownRangeRegex.exec(this.ddbDefinition.description);
    if (match) {
      range.value = match[4];
      range.units = "ft";
    }

    const canSeeWithinRegex = /creature( or object)? you can see within (\d+) feet/ig;
    const match2 = canSeeWithinRegex.exec(this.ddbDefinition.description);
    if (match2) {
      range.value = match2[2];
      range.units = "ft";
    }

    return range;
  }

  #getWeaponRange(): I5eWeaponRange {
    // sometimes reach weapons have their range set as 5. it's not clear why.
    const shortRange = this.ddbDefinition.range ? this.ddbDefinition.range : 5;
    const properties = this.data.system.properties as string[];
    const reach = properties.includes("rch") && this.ddbDefinition.range == 5 ? 5 : 0;
    return {
      value: shortRange + reach,
      long: (this.ddbDefinition.longRange && this.ddbDefinition.longRange != this.ddbDefinition.range)
        ? this.ddbDefinition.longRange + reach
        : null,
      units: "ft",
      reach: null,
    };
  }

  #getWeaponBehaviourRange(): I5eWeaponRange {
    // range: { value: null, long: null, units: '' },
    const weaponBehavior = this.ddbDefinition.weaponBehaviors[0];
    return {
      value: weaponBehavior?.range ?? 5,
      long: weaponBehavior?.longRange ?? 5,
      units: "ft",
    };
  }

  #getMagicalBonus(returnZero = false): number | "" {
    const values = this.ddbDefinition.grantedModifiers
      .filter(
        (mod) => mod.type === "bonus" && mod.subType === "magic" && mod.value && mod.value !== 0 && Number.isInteger(mod.value),
      )
      .map((mod) => mod.value as number);
    // Distinct values are alternatives, not a stack: a "Varies" record carries its +1/+2/+3 tiers
    // and a levelled weapon each level's bonus ("+2 instead of +1"), so the lowest is the one that
    // applies unconditionally. Repeats (Hazirawn's +1 and attuned +1) do add up.
    const bonus = values.length > 1 && new Set(values).size === values.length
      ? Math.min(...values)
      : values.reduce((prev, cur) => prev + cur, 0);
    return bonus === 0 && !returnZero ? "" : bonus;
  }

  #getWeaponMagicalBonus(returnZero = false): number | "" {
    const bonus = this.#getMagicalBonus(returnZero);
    if (this.flags.classFeatures.includes("Improved Pact Weapon") && bonus === 0) {
      return 1;
    } else {
      return bonus;
    }
  };

  #getMagicalArmorBonus(): number {
    const bonus = this.ddbDefinition.grantedModifiers
      .filter(
        (mod) => mod.type === "bonus" && mod.subType === "armor-class" && mod.value && mod.value !== 0 && Number.isInteger(mod.value),
      )
      .reduce((prev, cur) => prev + (cur.value as number), 0);
    return bonus;
  }

  #generateBaseItem() {

    let baseItem;
    let toolType;

    // an enricher documentStub reshaping the document (e.g. a weapon DDB typed
    // as ammunition) knows the base item better than the DDB definition does
    if (this.systemType.baseItem) {
      baseItem = this.systemType.baseItem;
    } else if (this.ddbDefinition.filterType === "Weapon") {
      baseItem = this.ddbDefinition.type?.toLowerCase().split(",").reverse().join("").replace(/\s/g, "");
    } else if (this.ddbDefinition.filterType === "Armor" && this.ddbDefinition.baseArmorName) {
      baseItem = this.ddbDefinition.baseArmorName.toLowerCase().split(",").reverse().join("").replace(/\s/g, "");
    } else if (this.ddbDefinition.filterType === "Other Gear"
      && ((this.ddbDefinition.gearTypeId === 1 && this.ddbDefinition.subType === "Tool")
        || (this.ddbDefinition.gearTypeId === 11))) {
      const toolProficiencies = DICTIONARY.actor.proficiencies
        .filter((prof) => prof.type === "Tool")
        .map((prof) => {
          return prof;
        });

      const baseTool = toolProficiencies.find((allProf) => allProf.name.toLowerCase() === this.ddbDefinition.name.toLowerCase());
      if (baseTool) {
        baseItem = DDBToolProficiencies.getToolKey(baseTool);
        toolType = baseTool.toolType;
      }
    } else if (this.ddbDefinition.filterType === "Staff") {
      baseItem = "quarterstaff";
    }


    if (baseItem) foundry.utils.setProperty(this.data, "system.type.baseItem", baseItem);
    if (baseItem && this.data.type === "tool") this.actionData.associatedToolsOrAbilities.push(baseItem);
    if (toolType) {
      foundry.utils.setProperty(this.data, "system.type.value", toolType);
    }

  }

  #generateProficient() {
    if (!("proficient" in this.data.system)) return;
    if (this.characterProficiencies.some((proficiency) =>
      proficiency.name === this.ddbDefinition.type
      || proficiency.name === this.ddbDefinition.baseArmorName)
    ) {
      this.data.system.proficient = true;
    }
  }

  #generateDamageParts() {
    switch (this.parsingType) {
      case "ammunition": {
        this.#generateAmmunitionDamage();
        break;
      }
      case "staff": {
        this.#generateStaffDamageParts();
        break;
      }
      case "weapon": {
        this.#generateWeaponDamageParts();
        break;
      }
      default: {
        this.#generateGrantedModifiersDamageParts();
      }
    }
  }

  #generateExtraProperties() {
    if (this.originalName.includes("Adamantine")) {
      this.data.system.properties = utils.addToProperties(this.data.system.properties, "ada");
    }
  }

  #generateMagicalBonus() {
    this.actionData.magicBonus.null = this.#getMagicalBonus();
    this.actionData.magicBonus.zero = this.#getMagicalBonus(true) as number;
    switch (this.parsingType) {
      case "armor": {
        const magicBonus = this.#getMagicalArmorBonus();
        if (magicBonus > 0) {
          foundry.utils.setProperty(this.data, "system.armor.magicalBonus", magicBonus);
          this.addMagical = true;
        }
        break;
      }
      case "staff":
      case "ammunition": {
        if (this.actionData.magicBonus.zero > 0) {
          this.addMagical = true;
          foundry.utils.setProperty(this.data, "system.magicalBonus", this.actionData.magicBonus.zero);
        }
        break;
      }
      case "weapon": {
        const magicalBonus = this.#getWeaponMagicalBonus(true) as number;
        this.actionData.magicBonus.zero = magicalBonus;
        if (magicalBonus > 0) {
          foundry.utils.setProperty(this.data, "system.magicalBonus", magicalBonus);
          this.addMagical = true;
          // dnd5e only applies system.magicalBonus to a weapon's *base* damage
          // part, and a firearm deliberately has none, so fold it into the
          // part the activity actually rolls. It is a reference rather than
          // the number so an enchantment raising the bonus (Magic Weapon) is
          // rolled too. Known limitation: unlike dnd5e's own handling this
          // isn't gated on `magicAvailable`, so an unattuned magical firearm
          // still adds it to damage. Attack rolls are unaffected, they read
          // system.magicalBonus directly.
          if (this.isFirearm && this.damageParts.length > 0) {
            const damagePart = this.damageParts[0];
            if (damagePart.custom?.enabled) {
              damagePart.custom.formula = `${damagePart.custom.formula} + ${DDBItem.MAGICAL_BONUS_REF}`;
            } else {
              damagePart.bonus = damagePart.bonus
                ? `${damagePart.bonus} + ${DDBItem.MAGICAL_BONUS_REF}`
                : DDBItem.MAGICAL_BONUS_REF;
            }
          }
        }
        break;
      }
      default: {
        if (this.actionData.magicBonus.zero > 0) {
          this.addMagical = true;
          if (!this.enricher.effects || this.enricher.effects.length === 0) {
            logger.error(`Magical Bonus detected, but not handled for ${this.name}`, {
              this: this,
            });
          }
        }
      }
    }
  }

  /**
   * Guess a dnd5e ammunition subtype from a weapon or ammunition name, for the
   * many DDB weapon types with no DICTIONARY.actor.proficiencies row. Texts are
   * tried in order, so pass the most specific signal (the DDB weapon type)
   * first. Returns null when nothing matches, which leaves the item as it is
   * today -- dnd5e then offers every ammunition on the sheet.
   */
  static inferAmmunitionType(...texts: (string | null | undefined)[]): string | null {
    for (const text of texts) {
      if (!text) continue;
      const match = DICTIONARY.weapon.ammunitionTypes.find((ammo) => ammo.pattern.test(text));
      if (match) return match.value;
    }
    return null;
  }

  /**
   * Publisher specific ammunition types, currently Mage Hand Press only. These
   * are keyed off the DDB source category so nothing outside that publisher is
   * re-typed -- the DMG Shotgun keeps firearmBullet.
   */
  static getPublisherAmmunitionTypes(sourceCategoryId: number | null): IPublisherAmmunitionType[] {
    if (sourceCategoryId !== DICTIONARY.sourceCategories.mageHandPress) return [];
    return DICTIONARY.ammunition.mageHandPress;
  }

  /**
   * Match an ammunition item name against the publisher table. Names are matched
   * as whole words anywhere in the name, since DDB ships count suffixes
   * ("Shells (10)") and prefixes ("Portable Cannonballs"), and the module may
   * append "(Legacy)". Word boundaries keep "Seashell" out.
   */
  static getPublisherAmmunitionTypeByName(name: string | null | undefined, sourceCategoryId: number | null): string | null {
    if (!name) return null;
    const lowerName = name.toLowerCase();
    const match = DDBItem.getPublisherAmmunitionTypes(sourceCategoryId).find((ammo) =>
      ammo.itemNames.some((itemName) => new RegExp(`\\b${itemName}\\b`, "i").test(lowerName)),
    );
    return match?.key ?? null;
  }

  /** Match a DDB weapon `type` against the publisher table. */
  static getPublisherAmmunitionTypeByWeapon(weaponType: string | null | undefined, sourceCategoryId: number | null): string | null {
    if (!weaponType) return null;
    const match = DDBItem.getPublisherAmmunitionTypes(sourceCategoryId).find((ammo) =>
      ammo.weaponTypes.some((type) => type.toLowerCase() === weaponType.toLowerCase()),
    );
    return match?.key ?? null;
  }

  static getRechargeFormula(description: string, maxCharges: number): string {
    if (description === "" || !description) {
      return `${maxCharges}`;
    }

    const chargeMatchFormula = /regains (\dd\d*(?: \+ \d)?) expended charges/i;
    const chargeMatchFixed = /regains (\d*) /i;
    const chargeMatchLastDitch = /(\dd\d* \+ \d)/i;
    const chargeNextDawn = /can't be used this way again until the next/i;

    const matchFormula = chargeMatchFormula.exec(description);
    const matchFixed = chargeMatchFixed.exec(description);
    const matchLastDitch = chargeMatchLastDitch.exec(description);

    let match = String(maxCharges);
    if (matchFormula && matchFormula[1]) {
      match = String(matchFormula[1]);
    } else if (matchFixed && matchFixed[1]) {
      match = String(matchFixed[1]);
    } else if (matchLastDitch && matchLastDitch[1]) {
      match = String(matchLastDitch[1]);
    } else if (description.search(chargeNextDawn) !== -1) {
      match = String(maxCharges);
    }

    return `${match}`;
  }

  _getUses(): I5eSystemLimitedUses {
    const limitedUse = this.ddbItem.limitedUse;
    if (limitedUse !== undefined && limitedUse !== null && limitedUse.resetTypeDescription !== null) {
      const resetType = DICTIONARY.resets.find((reset) => reset.id == limitedUse.resetType);

      const recoveryFormula = DDBItem.getRechargeFormula(limitedUse.resetTypeDescription, limitedUse.maxUses);
      const recoveryIsMax = `${recoveryFormula}` === `${limitedUse.maxUses}`;

      const recovery: I5eSystemLimitedUsesRecovery[] = [];
      if (!resetType) {
        logger.warn(`Unknown reset type ${limitedUse.resetType} for ${this.ddbDefinition.name}`);
      } else if (!resetType.isCharges && resetType.value && ![""].includes(resetType.value)) {
        recovery.push({
          period: resetType.value,
          type: recoveryIsMax ? "recoverAll" : "formula",
          formula: recoveryIsMax ? "" : recoveryFormula,
        });
      }
      return {
        max: `${limitedUse.maxUses}`,
        spent: limitedUse.numberUsed ?? 0,
        recovery,
      };
    } else {
      return { spent: 0, max: null, recovery: [] };
    }
  }

  /**
   * "can't be used again until", "cannot use this property again until": a single property that
   * comes back with the reset, as opposed to charged items (matched separately) and wording like
   * "the magic ceases to function until you finish a Long Rest" that describes a running total.
   */
  static SINGLE_USE_PROPERTY = /(?:can't|cannot) (?:be used|use (?:it|this property|this feature|the \w+(?: \w+)?)) (?:this way |in this way )?again until (?:the next (?:dawn|dusk)|you finish a (?:short|long|short or long) rest)/i;

  /**
   * "(no Concentration required)", "doesn't require your Concentration", "without requiring
   * concentration" and similar. Wording that only mentions concentration ("provided you maintain
   * concentration", "a spell you cast that requires Concentration") must not match.
   */
  static NO_CONCENTRATION = /no concentration|(?:do(?:es)? ?n't|does not|do not|no longer) requires? (?:your )?concentration|without requiring (?:your )?concentration|requiring no concentration/;

  /**
   * Does the item description say a spell it grants is cast without concentration?
   *
   * The check is per sentence so an item granting several spells only frees the one it names. A
   * matching sentence that names none of the item's other spells ("The spell is cast at level 5 and
   * doesn't require Concentration", "These spells do not require concentration") applies to every
   * spell the item grants.
   *
   * Tags are stripped by regex rather than utils.stripHtml so this runs without a DOM; block-level
   * closers become line breaks so separate paragraphs never read as one sentence.
   */
  static spellIgnoresConcentration(description: string, spellName: string, otherSpellNames: string[] = []): boolean {
    const text = description
      .replace(/<\/(?:p|li|div|tr|td|th|h\d)>|<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&rsquo;|&#8217;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replaceAll("’", "'")
      .toLowerCase();

    // DDB and the importer can suffix names, e.g. "Bless (Legacy)"
    const normalizeName = (name: string) => name.replace(/\s*\(.*\)\s*$/, "").trim().toLowerCase();
    const name = normalizeName(spellName);
    const others = otherSpellNames.map(normalizeName).filter((other) => other !== "" && other !== name);

    return text
      .split(/[.!?\n]/)
      .filter((sentence) => DDBItem.NO_CONCENTRATION.test(sentence))
      .some((sentence) => (name !== "" && sentence.includes(name))
        || !others.some((other) => sentence.includes(other)));
  }

  static getMagicItemResetType(description: string): TLimitedUsePeriod | null {
    let resetType: TLimitedUsePeriod | null = null;
    const normalizedDescription = description.replaceAll("’", "'");

    const chargeMatchFormula = /expended charges (?:\w+|each day) at (\w+)/i;
    const usedAgainFormula = /(?:until|when) you (?:take|finish) a (short|long|short or long) rest/i;
    const chargeNextDawnFormula = /can't be used (?:this way )?again until the next (dawn|dusk)/i;

    const chargeMatch = chargeMatchFormula.exec(normalizedDescription);
    const untilMatch = usedAgainFormula.exec(normalizedDescription);
    const dawnMatch = chargeNextDawnFormula.exec(normalizedDescription);

    if (chargeMatch && chargeMatch[1] && ["dawn", "dusk"].includes(chargeMatch[1].toLowerCase())) {
      resetType = chargeMatch[1].toLowerCase() as TLimitedUsePeriod;
    } else if (chargeMatch && chargeMatch[1] && ["sunset"].includes(chargeMatch[1].toLowerCase())) {
      resetType = "dusk";
    } else if (dawnMatch && dawnMatch[1]) {
      resetType = dawnMatch[1].toLowerCase() as TLimitedUsePeriod;
    } else if (chargeMatch && chargeMatch[1]) {
      resetType = "day";
    } else if (untilMatch && untilMatch[1]) {
      resetType = untilMatch[1].toLowerCase().startsWith("short") ? "sr" : "lr";
    }

    // console.warn("reset type", {
    //   chargeMatch,
    //   untilMatch,
    //   dawnMatch,
    //   description,
    //   resetType,
    // });

    return resetType;
  }

  _getCompendiumUses(defaultMax: string | null = null): I5eSystemLimitedUses {
    if (!this.isMuncher) return { spent: 0, max: null, recovery: [] };

    // Multi-stage items repeat every lower stage's text, so the whole-description scan below
    // always reports the dormant numbers. Resolve the named stage first where one applies.
    const stagedUses = Vestige.getStageUses(this.originalName, this.ddbDefinition.description, DDBItem);
    if (stagedUses) {
      this.actionData.consumptionValue = 1;
      return stagedUses;
    }

    const maxUses = /has (\d*) charges/i;
    const maxUsesMatches = maxUses.exec(this.ddbItem.definition.description);
    const resetType = DDBItem.getMagicItemResetType(this.ddbItem.definition.description);
    // Items with one property per reset ("Once you use the pearl, it can't be used again until
    // the next dawn") name no charges; the character path gets that from DDB's limitedUse, the
    // compendium path has only the text. One use per reset matches the official compendia.
    const singleUse = !maxUsesMatches?.[1] && resetType && !["", "charges"].includes(resetType)
      && DDBItem.SINGLE_USE_PROPERTY.test(this.ddbItem.definition.description.replaceAll("’", "'"));
    const limitedUse = {
      maxUses: (maxUsesMatches && maxUsesMatches[1]) ? parseInt(maxUsesMatches[1]) : (singleUse ? 1 : null),
      numberUsed: 0,
      resetType,
      resetTypeDescription: this.ddbItem.definition.description,
    };

    if (limitedUse.maxUses) {
      const recoveryFormula = DDBItem.getRechargeFormula(this.ddbItem.definition.description, limitedUse.maxUses);
      const recoveryIsMax = `${recoveryFormula}` === `${limitedUse.maxUses}`;

      const recovery: I5eSystemLimitedUsesRecovery[] = [];
      if (limitedUse.resetType && !["", "charges"].includes(limitedUse.resetType)) {
        recovery.push({
          period: limitedUse.resetType,
          type: recoveryIsMax ? "recoverAll" : "formula",
          formula: recoveryIsMax ? "" : recoveryFormula,
        });
      }
      this.actionData.consumptionValue = 1;

      return {
        max: `${limitedUse.maxUses}`,
        // party-inventory imports carry the expended count; item enrichers read it back through
        // the document's spent (_ItemActivities.itemUses), so it must not be flattened to 0 here
        spent: this.ddbItem.chargesUsed ?? 0,
        recovery,
      };
    } else {
      return { spent: null, max: defaultMax, recovery: [] };
    }
  }

  // { value: "recoverAll", label: game.i18n.localize("DND5E.USES.Recovery.Type.RecoverAll") },
  // { value: "loseAll", label: game.i18n.localize("DND5E.USES.Recovery.Type.LoseAll") },
  // { value: "formula", label: game.i18n.localize("DND5E.USES.Recovery.Type.Formula") }
  _generateUses(defaultMax: string | null = null) {
    if (!("uses" in this.data.system)) return;
    this.data.system.uses = this.isMuncher
      ? this._getCompendiumUses(defaultMax)
      : this._getUses();

    if (!this.data.system.uses.max || this.data.system.uses.max === "") {
      this.data.system.uses.spent = null;
    }
  }

  _generateConsumableUses() {
    if (!("uses" in this.data.system)) return;
    this.actionData.consumptionValue = 1;
    if (this.ddbItem.limitedUse) {
      this._generateUses("1");
    } else {
      // default
      this.data.system.uses = {
        spent: 0,
        max: "1",
        recovery: [],
        autoDestroy: true,
      };
    }
    const autoDestroyValue = !["wand", "trinket", "ring", "wondrous"].includes(this.systemType.value ?? "") || this.isSpellwrought;
    foundry.utils.setProperty(this.data, "system.uses.autoDestroy", autoDestroyValue);
  }

  targetsCreature(text: string = this.ddbDefinition.description): boolean {
    const creature = /You touch (?:a|one) (?:willing |living )?creature|affecting one creature|creature you touch|a creature you|creature( that)? you can see|interrupt a creature|would strike a creature|creature of your choice|creature or object within range|cause a creature|creature must be within range|a creature in range|each creature within/gi;
    const creaturesRange = /(humanoid|monster|creature|target|beast)(s)? (or loose object )?(of your choice )?(that )?(you can see )?within range/gi;
    const targets = /attack against the target|at a target in range/gi;
    return !!(text.match(creature)
      || text.match(creaturesRange)
      || text.match(targets));
  }


  /**
   * The labelled sections of this item's description that each name a save, memoised.
   *
   * A multi-mode item ("Acid Jet.", "Frost Shot.") gets one activity per section, so the primary
   * activity must read only the FIRST section rather than the whole description - otherwise it
   * claims every mode's damage and area.
   */
  get multiSaveSections(): { slice: ISectionSlice; save: IParsedSave }[] {
    this.#multiSaveSections ??= this._saveBearingSections(this.ddbDefinition.description ?? "");
    return this.#multiSaveSections;
  }

  /**
   * Does the primary activity describe the FIRST labelled section, or something else entirely?
   *
   * On a wondrous item or a potion the primary activity is the save `parseSaveFromDescription`
   * found, which is the first section's - so scoping its damage, area and name to that section
   * keeps it honest. On a weapon the primary is the weapon attack, so every section is an extra
   * and the item's own damage and target must be left alone. This mirrors the ordering in
   * `_getActivitiesType`, which cannot be called speculatively because it has side effects.
   */
  get #primaryIsFirstSection(): boolean {
    if (this.multiSaveSections.length === 0) return false;
    if (this.documentType === "container") return false;
    if (["tool", "weapon", "staff"].includes(this.parsingType ?? "")) return false;
    return Boolean(this.actionData.save);
  }

  /** The name the primary activity takes on a multi-mode item, or null to leave it unnamed. */
  get #primaryActivityName(): string | null {
    if (!this.#primaryIsFirstSection) return null;
    return DDBActivityFactoryMixin.multiSaveActivityName(this.multiSaveSections[0].slice.rawLabel) || null;
  }

  /**
   * On a multi-mode item the primary describes the first section, so it needs that section's text
   * for the same reason its siblings do - dnd5e falls back to the whole item description, which
   * on this item describes every other mode too.
   */
  get #primaryActivityOptions(): IDDBActivityBuild {
    if (!this.#primaryIsFirstSection) {
      const flatTarget = this.#flatPrimaryTarget;
      return flatTarget ? { targetOverride: flatTarget } : {};
    }
    return { data: { description: { value: this.multiSaveSections[0].slice.section } } };
  }

  /** Who a save in the item's text is aimed at, read from a piece of it; a save always affects a creature. */
  #flatSaveTargetFor(text: string): I5eActivityTarget {
    const target = this.#targetFromDescription(text);
    if (target.affects && !target.affects.type) target.affects.type = "creature";
    return target;
  }

  /**
   * The primary save's own target when the text describes several different saves without
   * labelled sections, read like its siblings' (`flatSaveTarget`): an attunement save has no
   * area, and "throw the flask at a point within 30 feet" is a range, not the area. Null keeps
   * the item's target. Weapons are left alone: their primary is the attack.
   */
  get #flatPrimaryTarget(): I5eActivityTarget | null {
    if (!this.actionData.save || ["weapon", "staff"].includes(this.parsingType ?? "")) return null;
    const html = DDBDescriptions.stripTables(this.ddbDefinition.description ?? "");
    const saves = DDBDescriptions.parseSaves(html);
    if (new Set(saves.map((save) => DDBDescriptions.saveKey(save))).size < 2) return null;
    const scope = DDBDescriptions.saveScopes(html).get(DDBDescriptions.saveKey(this.actionData.save));
    return DDBActivityFactoryMixin.flatSaveTarget(scope, (text) => this.#flatSaveTargetFor(text));
  }

  /** The description text the primary activity describes: its own section, or the whole item. */
  get #primaryDescription(): string {
    return this.#primaryIsFirstSection
      ? this.multiSaveSections[0].slice.section
      : this.ddbDefinition.description ?? "";
  }

  /**
   * Build one save activity per mode of a multi-mode item.
   *
   * Called from build() rather than from the description scan so that it also reaches items whose
   * damage came from DDB - a weapon carrying two save riders never enters
   * #generateDamageFromDescription at all.
   */
  #generateMultiSaveActivities(): void {
    this._multiSaveActivityGeneration({
      text: this.ddbDefinition.description ?? "",
      primarySave: this.actionData.save,
      skipFirstSection: this.#primaryIsFirstSection,
      targetOverrideForSection: (section) => this.#sectionTarget(section),
      flatTargetFor: (text) => this.#flatSaveTargetFor(text),
    });
  }

  /**
   * Build one check activity per release check in the description.
   *
   * Sentence-scoped, so the whole description is read rather than the primary's section: a weapon
   * writes its escape check inside the grapple section. Called from build() rather than from the
   * damage scan, which never runs for an item whose damage came from DDB.
   */
  #generateCheckActivities(): void {
    this._checkActivityGeneration({ text: this.ddbDefinition.description ?? "" });
  }

  /**
   * The damage the item's own save names, for text that describes several different saves with
   * no labelled sections. Null when that does not apply, and for weapons, whose save riders sit
   * beside their attack. Without it the save takes every damage figure in the description, which
   * then belongs to the other saves: Many Hands' frighten save would deal the 10d6 of its
   * Constitution save.
   */
  get #ownSaveDamage(): I5eDamagePart[] | null {
    if (this.#primaryIsFirstSection || !this.actionData.save) return null;
    if (["weapon", "staff"].includes(this.parsingType ?? "")) return null;
    const html = this.ddbDefinition.description ?? "";
    const saves = DDBDescriptions.parseSaves(DDBDescriptions.stripTables(html));
    if (new Set(saves.map((save) => DDBDescriptions.saveKey(save))).size < 2) return null;
    const text = DDBDescriptions.saveDamageTexts(html).get(DDBDescriptions.saveKey(this.actionData.save));
    return text === undefined ? null : DDBDescriptions.saveOwnDamageParts(text);
  }

  #generateDamageFromDescription() {
    if (this.damageParts.length > 0) {
      logger.debug(`Skipping damage description parse as damage already created`);
      return;
    }
    const source = this.#primaryDescription;
    const sectioned = this.#primaryIsFirstSection;
    const description = utils.stripHtml(source).replace(/[\u2013-\u2013\u2212]/g, "-");

    const ownSaveDamage = this.#ownSaveDamage;
    const { parts, otherParts } = ownSaveDamage
      ? { parts: ownSaveDamage, otherParts: [] as I5eDamagePart[] }
      : DDBDescriptions.parseDamageParts(source);
    logger.debug(`${this.name} Description Damage matches`, { description, parts, otherParts, ownSaveDamage });
    this.damageParts.push(...parts);

    const regainExpression = new RegExp(/(regains|regain)\s+?(?:([0-9]+))?(?: *\(?([0-9 ]+d[0-9]+(?:\s*[-+]\s*[0-9]+)??)\)?)?\s+hit\s+points/i);
    const regainMatch = description.match(regainExpression);
    logger.debug(`${this.name} Description Healing matches`, { description, regainMatch });

    // DDB ships the healing amount as a hit-points bonus modifier on the same items whose text
    // says "regain 2d4 + 2 Hit Points" (Periapt of Health, the Potions of Healing); the modifier
    // part is already the primary heal, so the prose must not become a second "Healing" activity
    if (regainMatch && this.healingParts.length > 0) {
      logger.debug(`${this.name}: skipping description healing, granted modifiers already supply it`);
    } else if (regainMatch) {
      const damageValue = regainMatch[3] ? regainMatch[3] : regainMatch[2];
      const part = SystemHelpers.buildDamagePart({
        damageString: utils.parseDiceString(damageValue, "").diceString,
        type: "healing",
      });
      this.healingParts.push(part);
    }

    // On a sectioned item the leftover parts belong to the other modes' own activities, which
    // _multiSaveActivityGeneration builds; a catch-all "Damage" activity would double them up.
    if (otherParts.length > 0 && !sectioned) {
      this.additionalActivities.push({
        name: `Damage`,
        type: "damage",
        options: {
          generateDamage: true,
          damageParts: otherParts,
          includeBaseDamage: false,
          activationOverride: {
            type: "special",
            value: null,
            condition: "",
          },
          durationOverride: {
            value: null,
            units: "inst",
            special: "",
          },
        },
      });
    }
  }

  /**
   * Read an activity target out of a piece of the item's rules text.
   */
  #targetFromDescription(text: string, { mutateRange = false } = {}): I5eActivityTarget {
    const affects = {
      count: "",
      type: "" as TTarget,
      choice: false,
      special: "",
    };
    const template = {
      count: "",
      contiguous: false,
      type: "" as TTemplate,
      size: "",
      width: "",
      height: "",
      units: "ft" as TTemplateUnits,
    };
    const target: I5eActivityTarget = {
      prompt: true,
      affects,
      template,
    };

    const targetsCreature = this.targetsCreature(text);
    const creatureTargetCount = (/(each|one|a|the) creature(?: or object)?/ig).exec(text);

    if (targetsCreature || creatureTargetCount) {
      affects.count = creatureTargetCount && ["one", "a", "the"].includes(creatureTargetCount[1]) ? "1" : "";
      affects.type = creatureTargetCount && creatureTargetCount[2] ? "creatureOrObject" : "creature";
    }
    const aoeSizeRegex = /(?<!creature you can see |an object you can see |one creature )(?:within|in a|fills a) (\d+)(?: |-)(?:feet|foot|ft|ft\.)(?: |-)(cone|radius|emanation|sphere|line|cube|of it|of an|of the|of you|of yourself)(\w+[. ])?/ig;
    const aoeSizeMatch = aoeSizeRegex.exec(text);

    if (aoeSizeMatch) {
      const type = aoeSizeMatch[3]?.trim() ?? aoeSizeMatch[2]?.trim() ?? "radius";
      template.type = ["cone", "radius", "sphere", "line", "cube"].includes(type) ? type as TTemplate : "radius";
      template.size = aoeSizeMatch[1] ?? "";
      if (mutateRange && aoeSizeMatch[2] && aoeSizeMatch[2].trim() === "of you" && this.actionData.range) {
        this.actionData.range.units = "self";
      }
    }

    return target;
  }

  /**
   * The target of one mode of a multi-mode item, or null when its section names no area of its
   * own - in which case the generated activity inherits the item's target.
   */
  #sectionTarget(section: string): I5eActivityTarget | null {
    const target = this.#targetFromDescription(section);
    return target.template?.size ? target : null;
  }

  #generateTargets(text: string = this.#primaryDescription) {
    this.actionData.target = this.#targetFromDescription(text, { mutateRange: true });
  }

  #removeMasteryContainer(text: string): string {
    if (!this.removeWeaponMasteryDescription) return text;
    if (this.documentType !== "weapon") return text;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    doc.querySelectorAll(".mastery-container").forEach((container) => {
      container.remove();
    });

    return doc.body.innerHTML;
  }

  async #generateDescription() {
    if (this.parsingType === "custom") {
      let description = this.ddbDefinition.description && this.ddbDefinition.description !== "null"
        ? this.ddbDefinition.description
        : "";
      description = this.ddbDefinition.notes
        ? description + `<p><blockquote>${this.ddbDefinition.notes}</blockquote></p>`
        : description;

      const chatAdd = utils.getSetting<boolean>("add-description-to-chat");
      this.data.system.description = {
        value: description,
        chat: chatAdd ? this.ddbDefinition.snippet ?? "" : "",
      };
    } else {
      this.ddbDefinition.description = await DDBTable.generateTable({
        parentName: this.name,
        html: this.ddbDefinition.description,
        updateExisting: this.updateExisting,
        sourceBook: this.data.system?.source?.book,
        notifier: this.notifier,
      });
      this.data.system.description = this.#getDescription();
    }
    this.data.system.description.value = this.#removeMasteryContainer(this.data.system.description.value);
  }


  #get2024Price() {
    if (this.is2014) return 0;
    if (!this.data.system.properties.includes("mgc")) {
      return 0;
    }

    let price = 0;
    if (this.parsingType === "scroll") {
      const levelRegex = /level (\d+)/i;
      const levelMatch = levelRegex.exec(this.originalName);
      if (levelMatch && levelMatch[1]) {
        const level = parseInt(levelMatch[1]);
        switch (level) {
          case 0:
            price = 30;
            break;
          case 1:
            price = 50;
            break;
          case 2:
            price = 200;
            break;
          case 3:
            price = 300;
            break;
          case 4:
            price = 2000;
            break;
          case 5:
            price = 3000;
            break;
          case 6:
            price = 20000;
            break;
          case 7:
            price = 25000;
            break;
          case 8:
            price = 30000;
            break;
          case 9:
            price = 100000;
            break;
          default:
            price = 0; // no match
        }
      }
    } else {
      switch (ItemRarity.first(this.data.system)) {
        case "common":
          price = 100;
          break;
        case "uncommon":
          price = 400;
          break;
        case "rare":
          price = 4000;
          break;
        case "veryRare":
          price = 40000;
          break;
        case "legendary":
          price = 200000;
          break;
        case "artifact":
        default:
          price = 0;
      }

      if (this.parsingType === "consumable") {
        price /= 2;
      }
    }

    return price;
  }

  #generatePrice() {
    let value = this.ddbDefinition.cost
      ? Number.parseFloat(String(this.ddbDefinition.cost))
      : 0;

    if (value === 0) value = this.#get2024Price();

    this.data.system.price = {
      "value": Number.isInteger(value) ? value : (value * 10),
      "denomination": Number.isInteger(value) ? "gp" : "sp",
    };
  }

  #generateCapacity() {
    if (!("capacity" in this.data.system)) return;
    if (this.ddbDefinition.capacityWeight) {
      this.data.system.capacity.weight = {
        units: "lb",
        value: this.ddbDefinition.capacityWeight,
      };
    }
  }

  #generateCurrency() {
    if (!("currency" in this.data.system)) return;
    if (!this.ddbItem.currency) return;
    this.data.system.currency = {
      cp: this.ddbItem.currency?.cp ?? 0,
      sp: this.ddbItem.currency?.sp ?? 0,
      ep: this.ddbItem.currency?.ep ?? 0,
      gp: this.ddbItem.currency?.gp ?? 0,
      pp: this.ddbItem.currency?.pp ?? 0,
    };
  }

  #generateWeightless() {
    const isWeightless = this.ddbDefinition.weightMultiplier === 0;
    if (isWeightless) {
      this.data.system.properties = utils.addToProperties(this.data.system.properties, "weightlessContents");
    }
  }

  // `injected` dictionary properties (e.g. TGC firearm props) only exist in
  // the dnd5e system config once DDBRuleJournalFactory.registerRules has run.
  // Emitting them before injection makes dnd5e's validProperties filtering drop
  // them or render them unlabeled, so gate on the config being present.
  #weaponPropertyAllowed(property: { value: string; injected?: boolean }) {
    return !property.injected || CONFIG.DND5E.itemProperties?.[property.value] !== undefined;
  }

  #generateStaffProperties() {
    const weaponBehavior = this.ddbDefinition.weaponBehaviors[0];
    if (!weaponBehavior?.properties || !Array.isArray(weaponBehavior.properties)) return;

    DICTIONARY.weapon.properties.filter((p) =>
      weaponBehavior.properties.find((prop) => prop.name === p.name) !== undefined
      && this.#weaponPropertyAllowed(p),
    ).map((p) => p.value).forEach((prop) => {
      this.data.system.properties = utils.addToProperties(this.data.system.properties, prop);
    });
  }

  #generateWeaponProperties() {
    // merge rather than assign, like every other property generator here:
    // `overrides.earlyProperties` (e.g. `foc` on a "Staff of ..." Arcane Focus,
    // which parses as a weapon) is applied during #prepare, and an assignment
    // drops it.
    DICTIONARY.weapon.properties
      .filter((property) => {
        if (!this.#weaponPropertyAllowed(property)) return false;
        // if it is a weapon property
        if (this.ddbDefinition.properties
          && Array.isArray(this.ddbDefinition.properties)
          && this.ddbDefinition.properties.some((prop) => prop.name === property.name)
        ) {
          return true;
        }
        // if it is a granted property
        if (this.ddbDefinition.grantedModifiers
          && Array.isArray(this.ddbDefinition.grantedModifiers)
          && this.ddbDefinition.grantedModifiers.some((prop) =>
            prop.type === "weapon-property"
            && prop.friendlySubtypeName === property.name,
          )
        ) {
          return true;
        }
        // else not a property
        return false;
      })
      .map((property) => property.value)
      .forEach((prop) => {
        this.data.system.properties = utils.addToProperties(this.data.system.properties, prop);
      });
  }

  #getWeaponProficient(): boolean | null {
    if (!("type" in this.data.system)) return null;
    // if it's a simple weapon and the character is proficient in simple weapons:
    if (
      this.characterProficiencies.some((proficiency) => proficiency.name === "Simple Weapons")
      && this.data.system.type.value.includes("simple")
    ) {
      return true;
    } else if (
      this.characterProficiencies.some((proficiency) => proficiency.name === "Martial Weapons")
      && this.data.system.type.value.includes("martial")
    ) {
      return true;
    } else {
      const proficient = this.characterProficiencies.some((proficiency) =>
        proficiency.name.toLowerCase() === this.ddbDefinition.type?.toLowerCase(),
      );
      if (proficient) return proficient;
    }
    return null;
  };

  #getAbility(): T5eAbility | null {
    const properties = this.data.system.properties as string[];
    // finesse weapons can choose freely, and is now automated
    if (properties.includes("fin")) {
      return null;
    }

    // thrown, but not finesse weapon: STR
    if (properties.includes("thr")) {
      return "str";
    }

    // if it's a ranged weapon, and mot a reach weapon (long = 10 (?))
    const longRange = foundry.utils.getProperty(this.data, "system.range.long") as number | undefined;
    if (longRange !== undefined && Number.isInteger(longRange) && longRange > 5 && !properties.includes("rch")) {
      return "dex";
    }

    // the default is null (auto based on base)
    return null;
  }

  #getWeaponAbility(): T5eAbility | null {
    let result: T5eAbility | null = null;
    const ability = this.#getAbility();
    const mockAbility = ability === null
      ? (this.data.system.properties as string[]).includes("fin") ? "dex" : "str"
      : ability;

    const abilityValue = (ab: T5eAbility): number | undefined => this.characterEffectAbilities[ab]?.value;
    const mockAbilityValue = abilityValue(mockAbility);

    // warlocks can use cha for their Hex weapon
    if (this.flags.classFeatures.includes("hexWarrior") || (!this.is2014 && this.flags.classFeatures.includes("pactWeapon"))) {
      const chaValue = abilityValue("cha");
      if (chaValue !== undefined && mockAbilityValue !== undefined && chaValue >= mockAbilityValue) {
        result = "cha";
      }
    }
    // kensai monks
    if (this.flags.classFeatures.includes("kenseiWeapon") || this.flags.classFeatures.includes("monkWeapon")) {
      const dexValue = abilityValue("dex");
      if (dexValue !== undefined && mockAbilityValue !== undefined && dexValue >= mockAbilityValue) {
        result = "dex";
      }
    }
    if (this.flags.magicItemAttackInt && (this.ddbDefinition.magic || this.data.system.properties.includes("mgc") || this.infusionDetail)) {
      const intValue = abilityValue("int");
      if (intValue !== undefined && mockAbilityValue !== undefined && intValue > mockAbilityValue) {
        result = "int";
      }
    }
    const setAbility = result !== null
      ? result
      : mockAbility;
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.ability", setAbility);

    return result;
  }

  #isHalfToolProficiencyRoundedUp(ab: T5eAbility): boolean {
    const longAbility = DICTIONARY.actor.abilities
      .filter((ability) => ab === ability.value)
      .map((ability) => ability.long)[0];
    const roundUp = DDBModifiers.filterBaseModifiers(this.ddbData, "half-proficiency-round-up", { subType: `${longAbility}-ability-checks` });
    return Array.isArray(roundUp) && roundUp.length > 0;
  }

  #getToolProficiency(toolName: string, ability: T5eAbility) {
    const mods = DDBModifiers.getAllModifiers(this.ddbData, { includeExcludedEffects: true });
    const modifiers = mods
      .filter((modifier) => modifier.friendlySubtypeName === toolName)
      .map((mod) => mod.type);

    const toolExpertise = this.ddbData.character?.classes
      ? this.ddbData.character.classes.some((cls) =>
        cls.classFeatures.some((feature) => feature.definition.name === "Tool Expertise" && cls.level >= feature.definition.requiredLevel),
      )
        ? 2
        : 1
      : 1;

    const halfProficiency
      = DDBModifiers.getChosenClassModifiers(this.ddbData).find(
        (modifier) =>
          // Jack of All trades/half-rounded down
          (modifier.type === "half-proficiency" && modifier.subType === "ability-checks")
          // e.g. champion for specific ability checks
          || this.#isHalfToolProficiencyRoundedUp(ability),
      ) !== undefined
        ? 0.5
        : 0;

    const proficient = modifiers.includes("expertise")
      ? 2
      : modifiers.includes("proficiency")
        ? toolExpertise
        : halfProficiency;

    return proficient;
  }

  #generateAmmunitionSpecifics() {
    if (!("damage" in this.data.system)) return;
    this.activityOptions.generateRange = true;

    if (this.damageParts.length > 0) {
      this.data.system.damage = {
        replace: false,
        base: this.damageParts[0],
      };
    }

    // dnd5e filters a weapon's ammunition dropdown on subtype equality, so an
    // ammunition item we can't classify would be hidden from any weapon that
    // does have a type. Fall back to the name inference rather than leave it blank.
    const ammoType = DDBItem.getPublisherAmmunitionTypeByName(
      this.ddbDefinition.name,
      DDBSources.getDocumentSourceCategoryId(this.data),
    )
      ?? DICTIONARY.actor.proficiencies
        .find((prof) =>
          prof.type === "Ammunition"
          && (
            prof.name.toLowerCase() === this.ddbDefinition.name.toLowerCase().split(",")[0].trim()
            || prof.name.toLowerCase() === this.ddbDefinition.name.toLowerCase().split(" ")[0].trim()
          ),
        )?.ammunitionType
      ?? DDBItem.inferAmmunitionType(this.ddbDefinition.name);

    if (ammoType) {
      foundry.utils.setProperty(this.data, "system.type.subtype", ammoType);
      this.systemType.subtype = ammoType;
    }
  }

  #generateArmorSpecifics() {
    if (!("armor" in this.data.system)) return;
    const armorData = this.data.system.armor;
    if (!armorData) return;
    armorData.value = this.ddbDefinition.armorClass;
    foundry.utils.setProperty(this.data, "system.strength", this.ddbDefinition.strengthRequirement ?? 0);
    if (this.ddbDefinition.stealthCheck === 2) {
      foundry.utils.setProperty(this.data, "system.properties", utils.addToProperties(this.data.system.properties as string[], "stealthDisadvantage"));
    }
    this.#generateArmorMaxDex();
    this.#generateProficient();
    this._generateUses();
    if (!this.data.name.toLowerCase().includes("armor")) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.alternativeNames", [`${this.name} Armor`]);
    }
  }

  #generateConsumableSpecifics() {
    if (!("type" in this.data.system)) return;
    if (this.data.system.type.value === "wand") this.addMagical = true;
    this._generateConsumableUses();
    if (["Potion", "Poison"].includes(this.overrides.ddbType ?? this.ddbDefinition.subType ?? "")) {
      this.actionData.target = {
        "template": {
          "contiguous": false,
          "units": "ft",
          "type": "",
        },
        "affects": {
          "choice": false,
          "count": "1",
          "type": "creature",
          "special": "",
        },
      };
      this.actionData.range = {
        "units": "touch",
        "override": false,
        "special": "",
      };
    } else {
      this.#generateTargets();
    }
    this.#generateDamageFromDescription();
  }

  #generateLootSpecifics() {
    if (this.systemType.value) {
      // Loot-parsed items that resolved to a consumable document (e.g. plain
      // adventuring gear) get consumable uses. True loot documents (gems, art
      // objects etc) don't: the 5e loot schema has no uses/activities, so the
      // default 1-use self-consumption is meaningless for them.
      if (this.documentType !== "loot") this._generateConsumableUses();
      this.#generateTargets();
      this.#generateDamageFromDescription();
    }
    if (this.documentType === "container") {
      this.#generateCapacity();
      this.#generateCurrency();
      this.#generateWeightless();
    }
  }

  #generateScrollSpecifics() {
    // KNOWN_ISSUE_4_0: what kind of activity type are scrolls?
    this.addMagical = true;
    this._generateConsumableUses();
  }

  #generateStaffSpecifics() {
    this.activityOptions.generateAttack = true;
    this.#generateStaffProperties();
    if ("proficient" in this.data.system) {
      this.data.system.proficient = this.#getWeaponProficient();
    }
    if ("range" in this.data.system) {
      this.data.system.range = this.#getWeaponBehaviourRange();
    }
    this.actionData.ability = this.#getAbility();
    if ("range" in this.data.system) {
      this.actionData.meleeAttack = this.data.system.range.long === 5;
    }
    if (!game.modules.get("magicitems")?.active && !game.modules.get("items-with-spells-5e")?.active) {
      this._generateUses();
    }
    if (this.damageParts.length > 0 && "damage" in this.data.system) {
      this.data.system.damage = {
        base: this.damageParts[0],
        versatile: this.versatileDamage ?? undefined,
        // parts: this.actionData.save
        //   ? []
        //   : this.damageParts.slice(1),
      };
    }
  }

  #generateToolSpecifics() {
    this.activityOptions.generateCheck = true;
    const defaultAbility = DICTIONARY.actor.proficiencies.find((prof) => prof.name === this.ddbDefinition.name);
    this.actionData.ability = defaultAbility?.ability as T5eAbility ?? "dex";
    if ("proficient" in this.data.system) {
      this.data.system.proficient = this.ddbData
        ? this.#getToolProficiency(this.ddbDefinition.name, this.actionData.ability)
        : 0;
    }
    this._generateUses();
  }

  /**
   * DDB's Firearm property (id 33): "You don't add your ability modifier to the
   * weapon's damage, unless otherwise stated." dnd5e always appends @mod to a
   * weapon's *base* damage part (attack-data.mjs#_processDamagePart) and offers
   * no opt-out, so these weapons carry their damage on the activity instead,
   * where non-base parts are left alone.
   * @returns {boolean} true if this is a weapon with the DDB Firearm property
   */
  get isFirearm(): boolean {
    if (this.parsingType !== "weapon") return false;
    return (this.ddbDefinition.properties ?? []).some((property) => property.name === "Firearm");
  }

  /**
   * Critical Shot (Gunslinger 2) expands the critical range of Ranged weapons.
   * Unlike Overkill's 1d8 this does include firearms, which are Ranged weapons
   * like any other; thrown melee weapons (attackType 1) are still excluded.
   * @returns {number | null} the critical hit threshold, or null to leave it alone
   */
  get rangedCriticalThreshold(): number | null {
    if (this.parsingType !== "weapon") return null;
    if (this.ddbDefinition.attackType !== 2) return null;
    // ac5e ships its own transferred effect for this feature
    // (enrichers/class/gunslinger/CriticalShot.ts), so stand down and let it win
    if (SystemHelpers.effectModules().ac5eInstalled) return null;
    return DDBItem.getCriticalShotThreshold(this.ddbData.character?.classes);
  }

  /**
   * Overkill's other half: "If you already add your modifier to the damage roll,
   * the target takes an extra 1d8 damage of the weapon's type." That is every
   * Ranged weapon which is not a firearm. DDB's attackType 2 marks the ranged
   * weapon table, so thrown melee weapons (Dagger, Handaxe, Javelin) are
   * excluded while the Dart, a Simple Ranged Weapon, is not.
   * @returns {boolean} true if the importer must supply Overkill's extra 1d8 on this weapon
   */
  get hasOverkillRangedDamage(): boolean {
    if (this.parsingType !== "weapon") return false;
    if (!this.flags.classFeatures.includes("overkill")) return false;
    if (this.isFirearm) return false;
    if (this.ddbDefinition.attackType !== 2) return false;
    // MHP adds the die to ranged weapons' base damage at roll time. Firearms use
    // non-base parts, so their separate ability modifier remains importer-owned.
    const registeredSettings: ReadonlyMap<string, unknown> = game.settings.settings;
    if (game.modules.get("mage-hand-press-core")?.active
      && registeredSettings.has("mage-hand-press-core.gunslinger")
      && utils.getSetting<{ mankillerOverkill?: boolean }>("gunslinger", "mage-hand-press-core")?.mankillerOverkill) {
      return false;
    }
    return true;
  }

  #generateWeaponSpecifics() {
    this.activityOptions.generateAttack = true;
    const criticalThreshold = this.rangedCriticalThreshold;
    if (criticalThreshold) this.activityOptions.criticalThreshold = criticalThreshold;
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.damage", this.flags.damage);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.classFeatures", this.flags.classFeatures);
    this.#generateWeaponProperties();
    const proficientFeatures = ["pactWeapon", "kenseiWeapon"];
    if ("proficient" in this.data.system) {
      this.data.system.proficient = this.flags.classFeatures.some((feat) => proficientFeatures.includes(feat))
        ? true
        : this.#getWeaponProficient();
    }

    if (this.flags.classFeatures.includes("OffHand") && this.actionData.activation) this.actionData.activation.type = "bonus";
    // a copySRD stub has already supplied a real range; DDB leaves both range
    // fields null on the definitions those stubs exist to repair, so assigning
    // here would wipe it
    const keepSRDRange = Boolean(this.enricher.documentStub?.copySRD)
      && !this.ddbDefinition.range
      && !this.ddbDefinition.longRange;
    if ("range" in this.data.system && !keepSRDRange) {
      this.data.system.range = this.#getWeaponRange();
    }
    this._generateUses();
    this.actionData.ability = this.#getWeaponAbility();
    if (this.ddbDefinition.attackType === 1) {
      this.actionData.meleeAttack = true;
    } else {
      this.actionData.meleeAttack = false;
    }
    if (this.damageParts.length > 0 && "damage" in this.data.system) {
      if (this.isFirearm) {
        // leaving system.damage.base empty is the point: with no base part dnd5e has nothing to append @mod to.
        // Note that a "Restricted Attack" rider activity (see
        // #generateWeaponDamageParts) would roll only its rider dice on such a
        // weapon; no DDB firearm has a restricted damage modifier today.
        if (this.flags.classFeatures.includes("overkill")) {
          // Overkill (Gunslinger 11) puts the modifier back. It rides along as
          // its own part rather than restoring the base damage, so a firearm
          // looks the same either way and only this part comes and goes.
          this.damageParts.splice(1, 0, SystemHelpers.buildDamagePart({
            damageString: "@mod",
            types: this.damageParts[0].types ?? null,
          }));
        }
        this.activityOptions.includeBaseDamage = false;
        this.activityOptions.damageParts = this.damageParts;
      } else {
        if (this.hasOverkillRangedDamage) {
          this.damageParts.push(SystemHelpers.buildDamagePart({
            damageString: "1d8",
            types: this.damageParts[0].types ?? null,
          }));
        }
        this.data.system.damage = {
          base: this.damageParts[0],
          versatile: this.versatileDamage ?? undefined,
          // parts: this.actionData.save
          //   ? []
          //   : this.damageParts.slice(1),
        };
      }
    }

    const dictionaryWeapon = DICTIONARY.actor.proficiencies
      .find((prof) =>
        prof.type === "Weapon" && prof.name.toLowerCase() === this.ddbDefinition.type?.toLowerCase(),
      );

    const publisherAmmunitionType = DDBItem.getPublisherAmmunitionTypeByWeapon(
      this.ddbDefinition.type,
      DDBSources.getDocumentSourceCategoryId(this.data),
    );

    if (publisherAmmunitionType) {
      foundry.utils.setProperty(this.data, "system.ammunition.type", publisherAmmunitionType);
      this.data.system.properties = utils.addToProperties(this.data.system.properties, "amm");
    } else if (dictionaryWeapon?.ammunitionType) {
      foundry.utils.setProperty(this.data, "system.ammunition.type", dictionaryWeapon.ammunitionType);
    } else if (this.ddbDefinition.attackType === 2) {
      // ranged only: stops a melee weapon whose name happens to match a pattern
      // (a "Bowstaff") from being handed an ammunition type and property.
      const inferredAmmunitionType = DDBItem.inferAmmunitionType(this.ddbDefinition.type, this.ddbDefinition.name);
      if (inferredAmmunitionType) {
        foundry.utils.setProperty(this.data, "system.ammunition.type", inferredAmmunitionType);
        // some third party firearms carry Firearm/Reload/Magazine but no DDB
        // ammunition property at all, and dnd5e shows no ammunition selector
        // without `amm` whatever the type is.
        this.data.system.properties = utils.addToProperties(this.data.system.properties, "amm");
      }
    }
    if (dictionaryWeapon?.mastery) {
      foundry.utils.setProperty(this.data, "system.mastery", dictionaryWeapon.mastery);
    } else if (this.ddbDefinition.properties) {
      const masteryKeys = Object.keys(CONFIG.DND5E.weaponMasteries ?? {});
      const possibleMasteryPropertyKeys = this.ddbDefinition.properties.map((p) =>
        p.name.toLowerCase().replaceAll(" ", "").replaceAll("-", ""),
      );
      const masteryPropertyKey = masteryKeys.find((key) =>
        possibleMasteryPropertyKeys.includes(key.toLowerCase()),
      );
      if (masteryPropertyKey) {
        foundry.utils.setProperty(this.data, "system.mastery", masteryPropertyKey);
      }
    }
    if (dictionaryWeapon?.properties?.fir
      && this.characterProficiencies.some((proficiency) => proficiency.name === "Firearms")
      && "proficient" in this.data.system
    ) {
      this.data.system.proficient = 1;
    }

  }

  #generateWondrousSpecifics() {
    if (this.isContainer) {
      this.#generateCurrency();
      this.#generateWeightless();
    }
    if (!this.isContainer && !this.tattooType && !this.isSpellwrought
      && "armor" in this.data.system && "type" in this.data.system
      && "strength" in this.data.system && "properties" in this.data.system
    ) {
      this.data.system.armor = {
        value: null,
        dex: null,
      };
      this.data.system.type.value = this.overrides.armorType
        ?? (this.isClothingTag ? "clothing" : "trinket");
      this.data.system.strength = 0;
      this.data.system.properties = utils.removeFromProperties(this.data.system.properties, "stealthDisadvantage") as TEquipmentProperties[];
      this.data.system.proficient = null;
    }
    this._generateUses();
    if (!this.isTattoo && !this.isSpellwrought) {
      this.#generateCapacity();
    }
    if (this.isSpellwrought && !this.tattooType && "uses" in this.data.system) {
      this.data.system.uses = {
        spent: 0,
        max: "1",
        recovery: [],
        autoDestroy: true,
      };
    }
    this.#generateTargets();
    this.#generateDamageFromDescription();
  }

  #generateAttunement() {
    if (!("attunement" in this.data.system)) return;
    if (this.ddbItem.isAttuned || this.ddbDefinition.canAttune) {
      if (this.ddbDefinition.name.startsWith("Spell Gem")) {
        this.data.system.attunement = "optional";
      } else {
        this.data.system.attunement = "required";
      }
    }
  }

  #generateWandAndRodSpecifics() {
    this.addMagical = true;
    this._generateUses();
    this.#generateTargets();
    this.#generateDamageFromDescription();
    this.data.system.properties = utils.addToProperties(this.data.system.properties, "foc");
  }

  #generateTypeSpecifics() {
    switch (this.parsingType) {
      case "ammunition": {
        this.#generateAmmunitionSpecifics();
        break;
      }
      case "armor": {
        this.#generateArmorSpecifics();
        break;
      }
      case "consumable": {
        this.#generateConsumableSpecifics();
        break;
      }
      case "loot": {
        this.#generateLootSpecifics();
        break;
      }
      case "scroll": {
        this.#generateScrollSpecifics();
        break;
      }
      case "staff": {
        this.#generateStaffSpecifics();
        break;
      }
      case "tool": {
        this.#generateToolSpecifics();
        break;
      }
      case "weapon": {
        this.#generateWeaponSpecifics();
        break;
      }
      case "wondrous": {
        this.#generateWondrousSpecifics();
        break;
      }
      case "wand":
      case "rod": {
        this.#generateWandAndRodSpecifics();
        break;
      }
      case "custom":
      default: {
        foundry.utils.setProperty(this.data, "flags.ddbimporter.id", this.ddbItem.id);
        foundry.utils.setProperty(this.data, "flags.ddbimporter.custom", true);
        // this.data.system.source = "Custom item";
        // no matching case, try custom item parse
      }
    }
  }

  parsePerSpellMagicItem(useDescription = ""): IPerSpell {
    const result: IPerSpell = {
      isPerSpell: false,
      charges: null,
    };
    const limitedUseRegex = /can't be used (?:this way )?again until the next|can't be used to cast that spell again until the next/i;
    if (useDescription === "") {
      // some times 1 use per day items, like circlet of blasting have nothing in
      // the limited use description, fall back to this
      // can’t be used to cast that spell again until the next
      // can't be used this way again until the next dawn.
      if (limitedUseRegex.test(this.ddbDefinition.description.replaceAll("’", "'"))) {
        result.isPerSpell = true;
        result.charges = 1;
        return result;
      }
      return result;
    }

    const perSpell = /each ([A-z]*|\n*) per/i;
    const match = perSpell.exec(useDescription);
    if (match) {
      result.isPerSpell = true;
      result.charges = DICTIONARY.magicitems.nums.find((num) => num.id == match[1])?.value ?? null;
    }

    if (!match) {
      if (limitedUseRegex.test(useDescription.replaceAll("’", "'"))) {
        result.isPerSpell = true;
        result.charges = 1;
      }
    }

    return result;
  }

  #getSpellReset(): { period: TLimitedUsePeriod | undefined; isCharges: boolean } {
    const itemLimitedUse = this.ddbItem.limitedUse;
    if (itemLimitedUse) {
      const reset = itemLimitedUse.resetType
        ? DICTIONARY.resets.find((candidate) => candidate.id == itemLimitedUse.resetType)
        : undefined;
      return {
        period: reset?.value,
        isCharges: reset?.isCharges ?? false,
      };
    }

    return {
      period: DDBItem.getMagicItemResetType(this.ddbDefinition.description) ?? undefined,
      isCharges: true,
    };
  }


  async #addSpellAsCastActivity(spell: I5eSpellItem, otherSpellNames: string[] = []) {
    logger.debug(`Adding spell ${spell.name} to item as spell link ${this.data.name}`);
    const spellData = MagicItemMaker.buildMagicItemSpell(this.magicChargeType, spell);

    const compendiumSpell = this.spellCompendium?.index.find((s) =>
      foundry.utils.getProperty(s, "flags.ddbimporter.definitionId") === foundry.utils.getProperty(spell, "flags.ddbimporter.definitionId"),
    );

    if (!compendiumSpell) {
      logger.warn(`Missing Spell ${spell.name} from Spells Compendium, please Munch Spells`, {
        spell,
        definitionId: foundry.utils.getProperty(spell, "flags.ddbimporter.definitionId"),
      });
      foundry.utils.setProperty(spell, "flags.ddbimporter.removeSpell", false);
      return false;
    }

    const challenge: NonNullable<I5eActivitySpell["challenge"]> = {
      attack: undefined,
      save: undefined,
      override: false,
    };
    const ignoredProperties: I5eActivityCastSpellProperties[] = ["vocal", "somatic", "material"];
    // ignoring concentration on a spell that never needed it is harmless, so a loose match is fine
    if (DDBItem.spellIgnoresConcentration(this.ddbDefinition.description ?? "", spell.name, otherSpellNames)) {
      ignoredProperties.push("concentration");
    }
    const spellOverride: I5eActivitySpell = {
      uuid: compendiumSpell.uuid,
      properties: ignoredProperties,
      level: null,
      challenge,
      spellbook: true,
    };

    const usesOverride = {
      spent: 0,
      recovery: [] as I5eSystemLimitedUsesRecovery[],
      max: "",
    } satisfies I5eSystemLimitedUses;
    const generateActivityUses = this.perSpell.isPerSpell;
    const consumptionOverride = {
      spellSlot: false,
      targets: [] as I5eConsumptionTarget[],
      scaling: {
        allowed: false as boolean,
        max: "",
      },
    } satisfies I5eActivityConsumption;

    if (generateActivityUses && "uses" in this.data.system) {
      this.data.system.uses = foundry.utils.deepClone(usesOverride);
    }

    const reset = this.#getSpellReset();

    const charges = DDBItem.itemSpellChargeCost(spellData.limitedUse, this.actionData.consumptionValue);
    if (generateActivityUses) {
      // spells manage charges
      usesOverride.max = `${charges.max ?? 1}`;
      usesOverride.recovery.push({
        period: reset.period ?? null,
        type: "recoverAll",
      });
    }

    const activityConsumptionTarget: I5eConsumptionTarget | null = this.perSpell.isPerSpell
      ? {
        type: "activityUses",
        target: "",
        value: `${charges.min ?? charges.max ?? 1}`,
        scaling: {},
      }
      : spellData.limitedUse
        ? {
          type: "itemUses",
          target: "",
          value: `${charges.cost}`,
          scaling: {
            mode: charges.variable ? "amount" : "",
            formula: "",
          },
        }
        : null;

    const saveDCOverride = foundry.utils.getProperty(spell, "flags.ddbimporter.dndbeyond.dc") as number ?? null;
    if (Number.isInteger(parseInt(String(saveDCOverride)))) {
      challenge.save = String(parseInt(String(saveDCOverride)));
      challenge.override = true;
    }

    if (foundry.utils.hasProperty(spell, "flags.ddbimporter.dndbeyond.castAtLevel")) {
      // castData.level =  Number.parseInt(spellData.level);
      spellOverride.level = foundry.utils.getProperty(spell, "flags.ddbimporter.dndbeyond.castAtLevel") as number;
    }

    // the item text describes extra charges for any spell it grants, so only a real DDB cost
    // range may scale: a fixed-cost spell on the same staff must not
    const scalingAllowed = !this.perSpell.isPerSpell
      && charges.variable
      && Boolean(this.ddbDefinition.description.match("each (?:additional )?charge you expend"));

    if (activityConsumptionTarget) {
      consumptionOverride.targets = [activityConsumptionTarget];
    }

    if (scalingAllowed && charges.min !== null && charges.max !== null) {
      consumptionOverride.scaling.allowed = true;
      consumptionOverride.scaling.max = DDBItem.itemSpellChargeScalingMax(charges.min, charges.max);
    }

    const options: TDDBActivityBuildOptions = {
      spellOverride,
      generateConsumption: true,
      generateUses: generateActivityUses,
      usesOverride,
      consumptionOverride,
      generateActivation: false,
      generateTarget: false,
      generateDuration: false,
      generateRange: false,
    };

    const activity = this._getCastActivity({ name: spell.name }, options);

    await this.enricher.customFunction({
      name: spellData.name,
      activity: activity,
    });

    // console.warn(`Spell Activity or ${this.name}`, {
    //   activity,
    //   castData: spellOverride,
    //   options,
    //   spell,
    //   spellData,
    //   this: this,
    // });

    this.activities.push(activity);
    foundry.utils.setProperty(this.data, `system.activities.${activity.data._id}`, activity.data);

    foundry.utils.setProperty(spell, "flags.ddbimporter.removeSpell", true);
    return true;

  }

  /**
   * With per-spell charges the item keeps no uses, so nothing may still spend them. The unnamed
   * activity the parser built from DDB's activation (Cloak of the Bat, Driftglobe) only duplicates
   * the cast activities and goes; a named property that is not a cast (Whelm's shockwave "Save")
   * gets its own once-per-reset use instead.
   */
  #movePerSpellUsesOffItem() {
    if (!("activities" in this.data.system)) return;
    const activities = this.data.system.activities as Record<string, I5eActivity>;
    if (!Object.values(activities).some((activity) => activity.type === "cast")) return;
    const spendsItemUses = (activity: I5eActivity) => (activity.consumption?.targets ?? [])
      .some((target) => target.type === "itemUses" && !target.target);
    const reset = this.#getSpellReset();
    for (const [id, activity] of Object.entries(activities)) {
      if (activity.type === "cast" || !spendsItemUses(activity)) continue;
      if (!activity.name && activity.type === "utility" && (activity.effects ?? []).length === 0) {
        delete activities[id];
        continue;
      }
      activity.uses = {
        spent: 0,
        max: "1",
        recovery: reset.period ? [{ period: reset.period, type: "recoverAll" }] : [],
      };
      foundry.utils.setProperty(activity, "consumption.targets", (activity.consumption?.targets ?? []).map((target) =>
        target.type === "itemUses" && !target.target
          ? { ...target, type: "activityUses", value: "1" }
          : target,
      ));
    }
  }

  async #basicMagicItem() {
    if ((/arcane focus|spellcasting focus/i).test(this.ddbDefinition.description ?? "")) {
      this.data.system.properties = utils.addToProperties(this.data.system.properties, "foc");
    }
    if (!this.ddbDefinition.magic) return;

    const itemSpells = (this.raw.itemSpells ?? []).filter((spell) =>
      spell.flags.ddbimporter?.dndbeyond?.lookup === "item"
        && spell.flags.ddbimporter?.dndbeyond?.lookupId === this.ddbDefinition.id,
    );

    // Per-spell charges live on the cast activities, so the item-level uses go. Only when the
    // item grants spells, though: the same "can't be used again until the next dawn" wording
    // marks a Pearl of Power or Cape of the Mountebank as per-spell and wiped their one use.
    if (this.perSpell.isPerSpell && itemSpells.length > 0 && "uses" in this.data.system) {
      this.data.system.uses = {
        spent: null,
        recovery: [
        ],
        max: null,
      };
    }

    // every item spell becomes a cast activity linked to the spells compendium; the character
    // parse has already made sure the compendium holds them (ensureItemSpellsInCompendium)
    for (const spell of itemSpells) {
      logger.debug(`Adding spell ${spell.name} to item ${this.data.name}`);
      const otherSpellNames = itemSpells.filter((other) => other !== spell).map((other) => other.name);
      await this.#addSpellAsCastActivity(spell, otherSpellNames);
    }

    if (this.perSpell.isPerSpell && itemSpells.length > 0) this.#movePerSpellUsesOffItem();

    if (!this.raw.itemSpells) return;

    if (this.isMuncher) return;

    // a linked spell leaves the character's spell list; one the compendium still lacks stays
    // there so the sheet at least shows it
    this.raw.itemSpells = this.raw.itemSpells.filter((spell) => {
      const matchedSpell = foundry.utils.getProperty(spell, "flags.ddbimporter.removeSpell")
        && spell.flags.ddbimporter?.dndbeyond?.lookup === "item"
        && spell.flags.ddbimporter?.dndbeyond?.lookupId === this.ddbDefinition.id;
      return !matchedSpell;
    });

    // const spent = foundry.utils.getProperty(this.data, "system.uses.spent");
    // const activation = this.actionData.activation?.type ?? "";

    // if (activation === "" && spent === 0) {
    //   this.data.system.activation.type = "special";
    // }
  }

  async _addEffects() {
    if (this.data.name === "") this.data.name = "Unknown Object";
    // effects already on the document (item-spell riders, status effects) are not DDB
    // modifier effects, so an enricher clearing the auto effects keeps them
    const existingEffects = [...(this.data.effects ?? [])];
    this.data = Effects.EffectGenerator.generateEffects({
      ddb: this.ddbData,
      character: this.raw.character,
      ddbItem: this.ddbItem,
      document: this.data,
      isCompendiumItem: this.isMuncher,
      type: "item",
      description: this.data.system.description.chat !== ""
        ? this.data.system.description.chat
        : this.data.system.description.value,
    }) as I5eInventoryItem;
    if (this.enricher.clearAutoEffects) this.data.effects = existingEffects;
    this.data = await addRestrictionFlags(this.data, this.addAutomationEffects);

    const effects = await this.enricher.createEffects();
    this.data.effects ??= [];
    this.data.effects.push(...effects);
    this.enricher.createDefaultEffects();
    Vestige.generateStageEnchantments(this, DDBItem);
    Effects.AutoEffects.markMagical(this.data);
    this._activityEffectLinking();
    this._activityBehaviorNaming();
    this._activityDisplayDefaults();
  }


  /** Build the actors an item's summon activity places, when its enricher provides them. */
  async _generateSummons() {
    if (!this.enricher.generateSummons || !this.enricher.summonsFunction) return;
    const summons = await this.enricher.summonsFunction({
      ddbParser: this,
      document: this.data,
      raw: this.ddbDefinition.description ?? "",
      text: this.data.system.description ?? { value: "", chat: "" },
    });
    await DDBSummonsManager.addGeneratedSummons(summons);
  }

  async build() {
    try {
      await this.#prepare();

      const source = DDBSources.parseSource(this.ddbDefinition);
      this.data.system.source = source;
      foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.sourceId", source.id);
      foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.sourceCategoryId", source.categoryId);
      this.data.system.source.rules = this.is2014 ? "2014" : "2024";
      this.data.system.weight = this.#getSingleItemWeight();

      if (this.ddbDefinition.magic) this.addMagical = true;

      this.#generateTypeSpecifics();

      this.#generateEquipped();
      this.#generateItemRarity();
      this.#generateQuantity();
      this.#generateMagicalBonus();
      this.#generateExtraProperties();

      if (this.overrides.ddbType) {
        foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.type", this.overrides.ddbType);
      }

      if (this.addMagical) {
        this.data.system.properties = utils.addToProperties(this.data.system.properties, "mgc");
      }

      this.ddbCharacter.updateItemId(this.data);

      const statusEffect = Effects.AutoEffects.getStatusEffect({ ddbDefinition: this.ddbDefinition, foundryItem: this.data });
      if (statusEffect) {
        this.data.effects ??= [];
        this.data.effects.push(statusEffect);
      }

      if (this.enricher.clearAutoEffects) this.data.effects = [];

      // before the activities: a summon activity resolves its profiles against the summons
      // compendium, so the actors have to be in it first
      await this._generateSummons();

      if (this.documentType !== "container") {
        // containers can't have activities.
        this.#generateMultiSaveActivities();
        this.#generateCheckActivities();
        // an item's primary activity is normally unnamed; on a multi-mode item it describes the
        // first section, so it takes that section's label to tell it from its siblings
        if (!this.enricher.stopDefaultActivity) {
          await this._generateActivity(
            { name: this.#primaryActivityName },
            foundry.utils.mergeObject(foundry.utils.deepClone(this.activityOptions), this.#primaryActivityOptions),
          );
        }
        this.#addHealAdditionalActivities();
        if (this.enricher.addAutoAdditionalActivities) {
          await this._generateAdditionalActivities();
        }
        await this.enricher.addAdditionalActivities(this);
        this.#foldRestrictedSaveAttacks();
      }

      this.#generatePrice();

      if ("attuned" in this.data.system) {
        this.data.system.attuned = this.ddbItem.isAttuned;
      }
      this.#generateAttunement();

      // should be one of the last things to do
      await this.#generateDescription();
      DDBDataUtils.addCustomValues(this.ddbData, this.data);
      await this.#basicMagicItem();

      await this._addEffects();

      this.cleanup();
      await this.enricher.addDocumentAdvancements();
      await this.enricher.addDocumentOverride();

      this.data.system.identifier = utils.referenceNameString(`${this.originalName.toLowerCase()}`);
      this._finaliseActivityDescriptions();

      await this.enricher.cleanup();

    } catch (err) {
      logger.warn(
        `Unable to parse item: ${this.ddbDefinition.name}, ${this.ddbDefinition.type}/${this.ddbDefinition.filterType}. ${utils.errorMessage(err)}`,
        {
          this: this,
        },
      );
      if (err instanceof Error) logger.error(err.stack);
    }

  }

  #getInfusionItemMap(): IDDBInfusionItem | undefined {
    if (!this.ddbData.infusions?.item) return undefined;
    return this.ddbData.infusions.item.find((mapping) =>
      mapping.itemId === this.ddbDefinition.id
      && mapping.inventoryMappingId === this.ddbItem.id
      && mapping.itemTypeId === this.ddbDefinition.entityTypeId,
    );
  }

  getInfusionDetail(definitionKey: string): IDDBInfusionDefinition | undefined {
    if (!this.ddbData.infusions?.infusions?.definitionData) return undefined;
    return this.ddbData.infusions.infusions.definitionData.find(
      (infusion) => infusion.definitionKey === definitionKey,
    );
  }

  #addExtraDDBFlags() {
    foundry.utils.setProperty(this.data, "flags.ddbimporter.id", this.ddbItem.id);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.entityTypeId", this.ddbItem.entityTypeId);

    if (this.ddbDefinition.avatarUrl) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.avatarUrl", this.ddbDefinition.avatarUrl.split("?")[0]);
    }
    if (this.ddbDefinition.largeAvatarUrl) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.largeAvatarUrl", this.ddbDefinition.largeAvatarUrl.split("?")[0]);
    }
    if (this.ddbDefinition.filterType) {
      const filter = DICTIONARY.items.find((i) => i.filterType === this.ddbDefinition.filterType);
      if (filter) foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.filterType", filter.filterType);
    }

    // container info
    if (this.ddbItem.containerEntityId) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.containerEntityId", this.ddbItem.containerEntityId);
    }
    if (this.ddbItem.containerEntityTypeId) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.containerEntityTypeId", this.ddbItem.containerEntityTypeId);
    }

    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.isConsumable", this.ddbDefinition.isConsumable);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.isContainer", this.ddbDefinition.isContainer);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.isCustomItem", this.ddbDefinition.isCustomItem);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.homebrew", this.ddbDefinition.isHomebrew);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.isMonkWeapon", this.ddbDefinition.isMonkWeapon);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.isPack", this.ddbDefinition.isPack);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.levelInfusionGranted", this.ddbDefinition.levelInfusionGranted);
    foundry.utils.setProperty(this.data, "flags.infusions", { maps: [], applied: [], infused: false });

    this.infusionItemMap = this.#getInfusionItemMap();
    this.infusionDetail = this.infusionItemMap
      ? this.getInfusionDetail(this.infusionItemMap.definitionKey)
      : null;

    return this.data;
  }

  processInfusion() {
    if (this.infusionDetail) {
      logger.debug(`Infusion detected for ${this.name}`);

      // add infusion flags
      foundry.utils.setProperty(this.data, "flags.infusions.infused", true);

      // if item is loot, lets move it to equipment/trinket so effects will apply
      if (this.data.type === "loot") {
        const equipmentData = this.data as unknown as I5eEquipmentItem;
        equipmentData.type = "equipment";
        // legacy armor shape carries a type key the 5e types no longer model
        foundry.utils.setProperty(equipmentData, "system.armor", {
          type: "trinket",
          value: 10,
          dex: null,
        });
        // infusions will over ride the can equip status, so just check for equipped
        equipmentData.system.equipped = this.ddbItem.equipped;
      }

      // check to see if we need to fiddle attack modifiers on infused weapons
      // this still needs to be moved to an enchantment effect
      if (this.data.type === "weapon") {
        const intSwap = DDBModifiers.filterBaseModifiers(this.ddbData, "bonus", { subType: "magic-item-attack-with-intelligence" }).length > 0
            || DDBModifiers.filterBaseModifiers(this.ddbData, "replace-weapon-ability", { subType: "intelligence-score" }).length > 0;
        if (intSwap) {
          const characterAbilities = this.raw.character.flags?.ddbimporter?.dndbeyond?.effectAbilities;
          const mockAbility = foundry.utils.getProperty(this.data, "flags.ddbimporter.dndbeyond.ability") as T5eAbility;
          const intValue = characterAbilities?.int?.value;
          const mockValue = characterAbilities?.[mockAbility]?.value;
          if (intValue !== undefined && mockValue !== undefined && intValue > mockValue) {
            // TODO this has moved toactivities now
            // this.data.system.ability = "int";
          }
        }
      }
    } else if (this.infusionItemMap && !this.infusionDetail) {
      logger.warn(`${this.data.name} marked as infused but no infusion info found`);
    }
  }

  #enrichFlags() {
    const flags = this.data.flags.ddbimporter ?? { dndbeyond: {} };
    if (this.ddbDefinition?.entityTypeId) {
      flags.definitionEntityTypeId = this.ddbDefinition.entityTypeId;
    }
    if (this.ddbDefinition?.id) {
      flags.definitionId = this.ddbDefinition.id;
    }
    if (this.ddbItem.entityTypeId) {
      flags.entityTypeId = this.ddbItem.entityTypeId;
    }
    if (this.ddbItem.id) {
      flags.id = this.ddbItem.id;
    }
    if (this.ddbDefinition?.tags) {
      flags.dndbeyond!.tags = this.ddbDefinition.tags;
    }
    if (this.ddbDefinition?.sources) {
      flags.dndbeyond!.sources = this.ddbDefinition.sources;
    }
    if (this.ddbDefinition?.stackable) {
      flags.dndbeyond!.stackable = this.ddbDefinition.stackable;
    }
  }


  /** @override */
  /**
   * The damage the first labelled section names, when that section is the primary save. Its
   * siblings read their own sections; the primary would otherwise take every DDB damage modifier
   * on the item (Kobbold Flaymefrower's Dragon's Breath dealing Backfire's 4d6 as well).
   */
  get #sectionedPrimaryDamage(): I5eDamagePart[] | null {
    if (!this.#primaryIsFirstSection) return null;
    return DDBDescriptions.parseDamageParts(this.multiSaveSections[0].slice.section).parts;
  }

  override _getSaveActivity({ name = null, nameIdPostfix = null } = {}, options: IDDBItemActivityBuild = {}) {
    // the item's damage parts can come from DDB's damage modifiers as well as the text (Many
    // Hands, Nightmare Flask), so the primary save's own damage is chosen here; the multi-save
    // extras pass their own parts in `options`, which win
    const ownSaveDamage = this.#sectionedPrimaryDamage ?? this.#ownSaveDamage;
    const itemOptions: IDDBItemActivityBuild = foundry.utils.mergeObject({
      generateRange: !["weapon", "staff"].includes(this.parsingType ?? ""),
      includeBaseDamage: ["weapon", "staff"].includes(this.parsingType ?? ""),
      damageParts: ["weapon", "staff"].includes(this.parsingType ?? "")
        ? this.damageParts.slice(1)
        : ownSaveDamage,
      // an empty list would fall back to the whole item's damage
      ...(ownSaveDamage?.length === 0 ? { generateDamage: false } : {}),
    } as IDDBItemActivityBuild, options);

    return super._getSaveActivity({ name, nameIdPostfix }, itemOptions);
  }

  /** @override */
  override _getAttackActivity({ name = null, nameIdPostfix = null } = {}, options: IDDBItemActivityBuild = {}) {
    const itemOptions: IDDBItemActivityBuild = foundry.utils.mergeObject({
      generateRange: !["weapon", "staff"].includes(this.parsingType ?? ""),
      // force default to to generate consumption for attacks if it's a weapon. this might miss some special cases,
      // but mostly we don't want to consume a weapons charges for attacks
      generateConsumption: !["weapon", "staff"].includes(this.parsingType ?? ""),
      // don't add extra damages if it's a save (assume its save damage)
      generateDamage: !this.actionData.save,
      includeBaseDamage: ["weapon", "staff"].includes(this.parsingType ?? ""),
    } as IDDBItemActivityBuild, options);

    return super._getAttackActivity({ name, nameIdPostfix }, itemOptions);
  }

  /** @override */
  override _getUtilityActivity({ name = null, nameIdPostfix = null } = {}, options: IDDBItemActivityBuild = {}) {
    const itemOptions: IDDBItemActivityBuild = foundry.utils.mergeObject({
      generateRange: !["weapon", "staff"].includes(this.parsingType ?? ""),
      includeBaseDamage: ["weapon", "staff"].includes(this.parsingType ?? ""),
    } as IDDBItemActivityBuild, options);

    return super._getUtilityActivity({ name, nameIdPostfix }, itemOptions);
  }

  /** @override */
  override _getDamageActivity({ name = null, nameIdPostfix = null } = {}, options: IDDBItemActivityBuild = {}) {
    const itemOptions: IDDBItemActivityBuild = foundry.utils.mergeObject({
      generateRange: !["weapon", "staff"].includes(this.parsingType ?? ""),
      includeBaseDamage: ["weapon", "staff"].includes(this.parsingType ?? ""),
    } as IDDBItemActivityBuild, options);

    return super._getDamageActivity({ name, nameIdPostfix }, itemOptions);
  }

  /** "You must succeed on a DC 15 Wisdom saving throw": the wielder saves, not the target. */
  // "you" as the subject: "within 30 feet of you must make" and "each creature other than you
  // must make" are the enemy's save
  static WIELDER_SAVE = /(?<!\b(?:of|to|by|from|with|at|near|around|toward|towards|than|excluding|except|besides|but) )\b(?:you|(?:its|the|your) (?:wielder|bearer|owner|attuned creature)) (?:must |can |then |also )?(?:succeeds? on|makes?|attempts?|rolls?) (?:an?|the) (?:DC \d+ )?\w+(?: or \w+)? sav/i;

  /** Whether the item's save is one its wielder makes (a curse or a drawback), read from its sentence. */
  get #wielderMakesSave(): boolean {
    if (!this.actionData.save) return false;
    const scope = DDBDescriptions.saveScopes(this.ddbDefinition.description ?? "")
      .get(DDBDescriptions.saveKey(this.actionData.save));
    return scope ? DDBItem.WIELDER_SAVE.test(scope.sentence) : false;
  }

  /**
   * The save a weapon's hit can force, as its own activity. It deals the damage its own words name
   * (`saveRiderDamageParts`), never the weapon's: the item's damage parts start with the base die
   * and hold the on-hit extras, so Dagger of Venom's save rolled 1d4 + 2d10 and Giant Slayer's
   * prone save rolled 1d8 + 2d6. When the text cannot be read the on-hit extras stay, as before.
   */
  static #RIDER_CHARGE_COUNTS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };

  /** The charges a rider save's own paragraph spends: "expend 1 charge", "spend two charges". */
  static riderCharges(paragraph: string): number | null {
    const counted = (/\b(?:expend|spend|use|cost)(?:s|ing)?\s+(\d+|one|two|three|four|five)\s+(?:of (?:its|the [\w\s'’]+?'s) )?charges?\b/i).exec(paragraph);
    if (counted) return DDBItem.#RIDER_CHARGE_COUNTS[counted[1].toLowerCase()] ?? Number(counted[1]);
    return (/\b(?:expend|spend)(?:s|ing)?\b[^.]{0,30}\bcharges?\b/i).test(paragraph) ? 1 : null;
  }

  /** "Can't be used again until the next dawn" or "until you finish a long rest": a limit the parser reads onto the item's uses. */
  static RIDER_DAILY = /\buntil the next (?:dawn|dusk)\b|\bonce per (?:day|dawn|dusk)\b|\bonce each day\b|\buntil you finish a (?:short or )?long rest\b/i;

  /** A rider's own action cost, from its sentence or the ones before it in its paragraph. */
  static riderActivation(text: string): TActivationCost | null {
    if ((/\bbonus action\b/i).test(text)) return "bonus";
    // the wielder's reaction, not an ally's ("allowing it to immediately take a Reaction")
    if ((/\byou (?:can )?(?:use|take) (?:a|your) reaction\b|\bas a reaction\b/i).test(text)) return "reaction";
    if ((/\bmagic action\b|\bas an action\b|\buse an action\b|\btake an action\b/i).test(text)) return "action";
    return null;
  }

  static #RIDER_CONDITION_DURATIONS: [RegExp, Partial<I5eEffectData["duration"]> & { seconds?: number }][] = [
    [/\buntil the end of (?:its|their|the target's) next turn\b/i, { expiry: "targetEnd" }],
    [/\buntil the start of (?:its|their|the target's) next turn\b/i, { expiry: "targetStart" }],
    [/\buntil the end of your next turn\b/i, { expiry: "sourceEnd" }],
    [/\buntil the start of your next turn\b/i, { expiry: "sourceStart" }],
  ];

  /**
   * The conditions a rider save's failure imposes ("or have the Prone condition", "is knocked
   * prone", "is Stunned until the end of its next turn"), with the duration its words give.
   */
  static riderConditions(failure: string): { statuses: string[]; seconds: number | null; expiry: string | null } | null {
    const ids = Object.keys(CONFIG.DND5E.conditionTypes ?? {}).filter((id) => !["exhaustion", "concentrating"].includes(id));
    if (ids.length === 0) return null;
    const regex = new RegExp(`\\b(?:the|be|is|are|becomes?|falls?|knocked|knocks? it|has|have|gains?|and|or)\\s+(?:the\\s+)?(?:knocked\\s+)?(${ids.join("|")})\\b`, "gi");
    const statuses = [...new Set([...failure.matchAll(regex)].map((match) => match[1].toLowerCase()))];
    if (statuses.length === 0) return null;
    const timed = (/\bfor (\d+|one|an?) (round|minute|hour)s?\b/i).exec(failure);
    const amount = timed ? (Number(timed[1]) || 1) : null;
    const seconds = timed && amount ? amount * ({ round: 6, minute: 60, hour: 3600 } as Record<string, number>)[timed[2].toLowerCase()] : null;
    const expiry = DDBItem.#RIDER_CONDITION_DURATIONS.find(([pattern]) => pattern.test(failure))?.[1].expiry ?? null;
    return { statuses, seconds, expiry: expiry ?? null };
  }

  /**
   * The rider's status effect when the item carries none for it: the text-driven auto status
   * effect only reads "DC 15 X saving throw or have the Y condition", so prose DCs and "is knocked
   * prone" wordings arrive without one. It links to the rider by name.
   */
  #addRiderConditionEffect(failure: string) {
    // an enricher's own effect hints are added after the activities and would duplicate these
    if ((this.enricher.effects ?? []).length > 0) return;
    const conditions = DDBItem.riderConditions(failure);
    if (!conditions) return;
    const present = new Set((this.data.effects ?? []).flatMap((effect) => [...(effect.statuses ?? [])]));
    const statuses = conditions.statuses.filter((status) => !present.has(status));
    if (statuses.length === 0) return;
    const label = statuses.map((status) => utils.capitalize(status)).join(", ");
    const effect = Effects.AutoEffects.BaseEffect(this.data, `Status: ${label}`, {
      transfer: false,
      durationSeconds: conditions.expiry ? null : conditions.seconds ?? undefined,
      description: `Apply status ${label}`,
    });
    effect.statuses.push(...statuses);
    effect.img = CONFIG.DND5E.conditionTypes[statuses[0]]?.icon ?? effect.img;
    if (conditions.expiry) foundry.utils.setProperty(effect, "duration.expiry", conditions.expiry);
    foundry.utils.setProperty(effect, "flags.ddbimporter.activityMatch", "Save");
    this.data.effects ??= [];
    this.data.effects.push(effect);
  }

  #addSaveAdditionalActivity(includeBase = false) {
    const description = this.ddbDefinition.description ?? "";
    const outcome = this.actionData.save ? DDBDescriptions.saveRiderOutcome(description, this.actionData.save) : null;
    const ownDamage = this.actionData.save ? DDBDescriptions.saveRiderDamageParts(description, this.actionData.save) : null;
    const damageParts = ownDamage ?? (includeBase ? this.damageParts : this.damageParts.slice(1));
    const options: IDDBActivityBuild = {
      generateDamage: damageParts.length > 0,
      damageParts,
      includeBaseDamage: false,
    };
    if (outcome) {
      // a condition-only save still records its onSave, rather than dnd5e's "half" default
      options.generateDamage = true;
      options.onSave = outcome.half ? "half" : "none";
      // a rider spends charges only when its own paragraph says so; the item's charges usually
      // belong to another property (a spell cast, a different power)
      const charges = DDBItem.riderCharges(outcome.paragraph);
      const daily = !charges && DDBItem.RIDER_DAILY.test(outcome.paragraph)
        && "uses" in this.data.system && Boolean(this.data.system.uses?.max);
      options.consumptionTargetOverrides = charges || daily
        ? [{ type: "itemUses", target: "", value: String(charges ?? 1), scaling: { mode: "", formula: "" } }]
        : [];
      // a save that follows a hit keeps the weapon's trigger: an action named before it is a
      // preparation step ("use an action to coat the blade ... the next time you hit")
      const trigger = `${outcome.lead} ${outcome.sentence}`;
      const activation = (/\bhits?\b/i).test(trigger) ? null : DDBItem.riderActivation(trigger);
      if (activation) options.activationOverride = { type: activation, value: 1, condition: "" };
      const target = DDBActivityFactoryMixin.flatSaveTarget(
        { sentence: outcome.sentence, lead: outcome.lead ? outcome.lead.split(/(?<=\.)\s+/) : [] },
        (text) => this.#flatSaveTargetFor(text),
      );
      if (target?.template?.type) options.targetOverride = { ...target, override: true };
      this.#addRiderConditionEffect(outcome.failure);
    }
    this.additionalActivities.push({
      name: "Save",
      type: "save",
      options,
    });
  }

  #addHealAdditionalActivities() {
    this.healingParts.forEach((part, i) => {
      if (i !== 0) {
        this.additionalActivities.push({
          name: "Healing",
          type: "heal",
          options: {
            generateDamage: false,
            includeBaseDamage: false,
            generateHealing: true,
            healingPart: part,
          },
        });
      }
    });
  }

  /** @override */

  override _getActivitiesType() {
    // console.warn(`Determining activity type for ${this.name}`, {
    //   actionData: this.actionData,
    //   damageParts: this.damageParts,
    //   healingParts: this.healingParts,
    //   parsingType: this.parsingType,
    //   systemType: this.systemType,
    //   data: this.data,
    //   this: this,
    // });
    if (this.documentType === "container") return null;
    if (this.parsingType === "tool") return "check";
    // lets see if we have a save stat for things like Dragon born Breath Weapon
    // a healing-only item (Potion of Healing, Periapt of Health) leads with its first healing
    // part; #addHealAdditionalActivities only builds the extras, so returning null here would
    // leave the item with no heal at all
    if (this.healingParts.length > 0) {
      if (!this.actionData.save && !["weapon", "staff"].includes(this.parsingType ?? "") && this.damageParts.length === 0) {
        return "heal";
      }
    }
    if (["weapon", "staff"].includes(this.parsingType ?? "")) {
      // some attacks will have a save and attack
      if (this.actionData.save) {
        // on a multi-mode weapon every save already has its own named activity
        // any save the weapon forces becomes a rider, with or without extra damage (Nine Lives
        // Stealer's save-or-die has none); a save the wielder makes is a curse, not a rider. An
        // enricher that builds its own activities keeps the rider only as before (extra damage
        // parts), so its saves are not doubled and its activity ids do not shift.
        const enricherAuthors = (this.enricher.additionalActivities ?? []).length > 0 && !this.enricher.keepParsedActivities;
        if (this.multiSaveSections.length === 0 && !this.#wielderMakesSave
          && (!enricherAuthors || this.damageParts.length > 1)) {
          this.#addSaveAdditionalActivity(false);
        }
      }
      return "attack";
    }
    if (this.actionData.save) return "save";
    if (this.actionData.isFlat) return "attack";
    if (this.damageParts.length > 0) return "damage";
    if (this.actionData.activation?.type === "special"
      && (!("uses" in this.data.system) || this.data.system.uses?.max === "")
    ) {
      return null;
    }
    if (this.actionData.activation?.type
      && !["wand", "scroll"].includes(this.systemType.value ?? "")
      && this.parsingType !== "armor"
    ) return "utility";
    if (this.parsingType === "armor" && this.actionData.activation?.type && this.actionData.activation.type !== "none") return "utility";
    if (this.parsingType === "consumable" && !["wand", "scroll"].includes(this.systemType.value ?? "")) return "utility";
    if ((this.data.effects?.length ?? 0) > 0) return "utility";
    if (["cone", "radius", "sphere", "line", "cube"].includes(this.actionData.target?.template?.type ?? "")) return "utility";
    return null;
  }

}
