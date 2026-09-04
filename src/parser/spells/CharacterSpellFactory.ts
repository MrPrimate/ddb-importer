

import { utils, logger, CompendiumHelper, DDBSources, SystemHelpers } from "../../lib/_module";

// Import parsing functions
import { getSpellCastingAbility, hasSpellCastingAbility, convertSpellCastingAbilityId } from "./ability";
import DDBSpell from "./DDBSpell";
import SpellDataUtils, { IDDBSpellLookup } from "./SpellDataUtils";
import { DICTIONARY } from "../../config/_module";
import { DDBDataUtils } from "../lib/_module";
import type DDBCharacter from "../DDBCharacter";

const SPELLIST_ADDITION_MATCHES = [
  "using any spell slots you have of the appropriate level",
  "using spell slots you have of the appropriate level",
  "using any spell slots you have",
];

type ISpellFactorySpellHolder = IDDBSourceCategorized<I5eSpellItem[]>;

interface IHandleGrantedSpellsFlags {
  forceCopy?: boolean;
  flags?: {
    lookup?: TParseSpellLookup;
  };
}

const SPELL_COMPENDIUM_INDEX_FIELDS = ["name", "flags.ddbimporter.definitionId"] as const;

interface ISpellCompendiumIndexEntry {
  name: string;
  uuid: string;
  flags?: {
    ddbimporter?: {
      definitionId?: number;
    };
  };
}

/**
 * The 2024 Healer feat rerolls 1s on any die rolled to restore hit points, "with a spell or with
 * Battle Medic". dnd5e 6 has no rule-change type that can add a die modifier at roll time (only
 * `dnd5e.bonus` reaches healing rolls), so the reroll is baked onto the healing parts of the
 * character's spells at parse time instead.
 */
export function hasHealingReroll(ddb: IDDBData): boolean {
  return (ddb.character.feats ?? []).some((feat) =>
    feat.definition?.name === "Healer"
    && (feat.definition.sources ?? []).some((source) => DDBSources.is2024Source(source)),
  );
}

export default class CharacterSpellFactory {

  // dnd5e die-modifier suffix: "1d8" -> "1d8r1", rerolling a 1 once
  static HEALING_REROLL_MODIFIERS = ["r1"];

  processed: I5eSpellItem[] = [];

  spellCounts: Record<string, number> = {};

  _generated: ISpellFactorySpellHolder = {
    class: [],
    feat: [],
    race: [],
    background: [],
    item: [],
  };

  _granted: ISpellFactorySpellHolder = {
    class: [],
    feat: [],
    race: [],
    background: [],
    item: [],
  };

  ddb: IDDBData;
  ddbCharacter: DDBCharacter;
  proficiencyModifier: number;
  healingReroll: boolean;
  levelSlots: boolean;
  pactSlots: boolean;
  hasSlots: boolean;
  generateSummons: boolean;
  character: I5ePCData;
  characterAbilities: I5eAbilities | undefined;
  slots: I5eSpellSlots;

  constructor(ddbCharacter: DDBCharacter) {
    this.ddbCharacter = ddbCharacter;
    if (!ddbCharacter.source) {
      throw new Error("CharacterSpellFactory requires a DDBCharacter with loaded source data");
    }
    this.ddb = ddbCharacter.source.ddb;
    this.character = ddbCharacter.raw.character;
    this.proficiencyModifier = this.character.flags?.ddbimporter?.dndbeyond?.profBonus ?? 0;
    this.characterAbilities = this.character.flags?.ddbimporter?.dndbeyond?.effectAbilities ?? undefined;
    // AC5e applies the Healer reroll at roll time, so only one of the two channels should activate
    // (the Healer enricher's ac5eOnly effect covers the AC5e case).
    this.healingReroll = hasHealingReroll(this.ddb) && !SystemHelpers.effectModules().ac5eInstalled;
    this.slots = foundry.utils.getProperty(this.character, "system.spells") as I5eSpellSlots;
    this.levelSlots = utils.arrayRange(9, 1, 1).some((i) => {
      const slot = this.slots[`spell${i}` as keyof I5eSpellSlots];
      return slot && Number(slot.max) !== 0;
    });
    this.pactSlots = Boolean(this.slots.pact?.max && parseInt(String(this.slots.pact.max)) > 0);
    this.hasSlots = this.levelSlots || this.pactSlots;
    this.generateSummons = ddbCharacter.enableSummons;
  }

  _getAbilityModifier(spellCastingAbility: T5eAbility): number {
    const abilityValue = this.characterAbilities?.[spellCastingAbility]?.value;
    if (abilityValue === undefined) {
      logger.warn(`Unable to determine ability score for ${spellCastingAbility}, assuming modifier of 0`);
      return 0;
    }
    return utils.calculateModifier(abilityValue);
  }

  /**
   * dnd5e 6 `system.sourceItem` (`type:identifier`) for a spell granted by a feature document the
   * importer builds: species traits and feats are `feat` items and backgrounds `background` items,
   * each carrying the identifier DDBFeatureMixin stamps from its DDB name. dnd5e resolves it through
   * `Actor#identifiedItems` for the sheet's source subtitle and `SpellData#classIdentifier`.
   */
  static featureSourceItem(documentType: "feat" | "background", name: string): string {
    return `${documentType}:${utils.referenceNameString(name.toLowerCase())}`;
  }

  static getDDBSpellLookup(ddb: IDDBData, type: string, id: number | null): IDDBSpellLookup | undefined {
    return SpellDataUtils.getDDBSpellLookup(ddb, type, id);
  }

  getLookup(type: string, id: number | null) {
    return CharacterSpellFactory.getDDBSpellLookup(this.ddb, type, id);
  }

  /** Class features whose picks are spellbook spells the wizard always has prepared. */
  static MASTERED_SPELL_FEATURES = ["Spell Mastery", "Signature Spells"];

  /**
   * Spell definition ids picked for Spell Mastery / Signature Spells through the features'
   * "Choose a Spell" choices (the option id is the spell definition id).
   */
  static masteredSpellChoiceIds(ddb: IDDBData): Set<number> {
    const featureIds = new Set<number>();
    for (const klass of ddb.character?.classes ?? []) {
      for (const feature of klass.classFeatures ?? []) {
        if (CharacterSpellFactory.MASTERED_SPELL_FEATURES.includes(utils.nameString(feature.definition?.name ?? ""))) {
          featureIds.add(feature.definition.id);
        }
      }
    }
    const ids = new Set<number>();
    if (featureIds.size === 0) return ids;
    for (const choice of ddb.character?.choices?.class ?? []) {
      if (featureIds.has(choice.componentId) && typeof choice.optionValue === "number") ids.add(choice.optionValue);
    }
    return ids;
  }

  /**
   * A wizard's Spell Mastery or Signature Spells pick. DDB flags the pick on the class spell
   * list entry, or only records the choice on the feature; both are read. The pick is always
   * prepared and keeps its slot casting for higher levels; the free cast is the feature's
   * cast activity (wizard/_MasteredSpells).
   */
  static isMasteredSpell(spell: IDDBSpellEntry, choiceIds: Set<number>): boolean {
    if (spell.baseLevelAtWill === true || spell.isSignatureSpell === true || spell.atWillLimitedUseLevel !== null) return true;
    return spell.definition?.id !== undefined && choiceIds.has(spell.definition.id);
  }

  /**
   * DDB moves a Spell Mastery / Signature Spells pick off the wizard's spell list and hangs it on
   * the feature as a slot-less copy (with a 1/SR limited use for a signature spell). That copy
   * is the only one in the payload, so it is parsed as the always-prepared spellbook spell
   * instead: slot casting for higher levels, no uses.
   */
  static asMasteredSpellbookSpell(spell: IDDBSpellEntry): IDDBSpellEntry {
    return {
      ...spell,
      usesSpellSlot: true,
      alwaysPrepared: true,
      limitedUse: null,
    };
  }

  /**
   * A spell DDB attaches to a class feature listed in FEATURE_SPELLS_IGNORE is the feature's own
   * casting (no spell slot, or a limited use) and is provided by the feature's enricher as a cast
   * activity instead. Features such as Wondrous Alteration or Faithful Steed also ship a plain
   * always-prepared copy that spends a slot; that copy is the spellbook entry and is kept.
   */
  static isIgnoredFeatureSpell(featureName: string | undefined, spell: IDDBSpellEntry): boolean {
    if (!featureName) return false;
    if (!DICTIONARY.parsing.featureSpellsIgnore.includes(utils.nameString(featureName))) return false;
    return !spell.usesSpellSlot || Boolean(spell.limitedUse);
  }

  _masteredSpellChoiceIds: Set<number> | null = null;

  get masteredSpellChoiceIds(): Set<number> {
    this._masteredSpellChoiceIds ??= CharacterSpellFactory.masteredSpellChoiceIds(this.ddb);
    return this._masteredSpellChoiceIds;
  }

  _getSpellCount(name: string) {
    if (!this.spellCounts[name]) {
      this.spellCounts[name] = 0;
    }
    return ++this.spellCounts[name];
  }

  async _processClassSpell({
    classInfo,
    is2014Class,
    playerClass,
    spell,
    spellCastingAbility,
    abilityModifier,
    unPreparedCantrip = null,
  }: {
    classInfo: IDDBClass;
    is2014Class: boolean;
    playerClass: IDDBClassSpell;
    spell: IDDBSpellEntry;
    spellCastingAbility: string;
    abilityModifier: number;
    unPreparedCantrip?: boolean | null;
  }) {
    if (CharacterSpellFactory.isMasteredSpell(spell, this.masteredSpellChoiceIds)) {
      spell.alwaysPrepared = true;
      spell.usesSpellSlot = true;
    }

    // add some data for the parsing of the spells into the data structure
    const flagData: IParseSpellFlagData = {
      ddbimporter: {
        dndbeyond: {
          lookup: "classSpell",
          class: classInfo.definition.name,
          is2014Class,
          level: classInfo.level,
          characterClassId: playerClass.characterClassId,
          spellLevel: spell.definition.level,
          // spellSlots: character.system.spells,
          ability: spellCastingAbility,
          mod: abilityModifier,
          dc: 8 + this.proficiencyModifier + abilityModifier,
          overrideDC: false,
          id: spell.id ?? undefined,
          entityTypeId: spell.entityTypeId ?? undefined,
          usesSpellSlot: spell.usesSpellSlot,
          forceMaterial: classInfo.definition.name === "Artificer",
          homebrew: spell.definition.isHomebrew,
          unPreparedCantrip,
          alwaysPrepared: spell.alwaysPrepared,
        },
      },
      "spell-class-filter-for-5e": {
        parentClass: classInfo.definition.name.toLowerCase(),
      },
      "tidy5e-sheet": {
        parentClass: classInfo.definition.name.toLowerCase(),
      },
      // "spellbook-assistant-manager": {
      //   class: classInfo.definition.name.toLowerCase(),
      // }
    };

    // Check for duplicate spells, normally domain ones
    // We will import spells from a different class that are the same though
    // as they may come from with different spell casting mods
    const parsedSpell = await DDBSpell.parseSpell(spell, this.character, {
      ddbData: this.ddb,
      namePostfix: `${this._getSpellCount(spell.definition.name)}`,
      generateSummons: this.generateSummons,
      unPreparedCantrip,
      flagData,
    });
    foundry.utils.setProperty(parsedSpell, "system.sourceItem", `class:${DDBDataUtils.classIdentifierName(classInfo.definition.name)}`);
    const duplicateSpell = this._generated.class.findIndex(
      (existingSpell) => {
        const existingName = (existingSpell.flags.ddbimporter?.originalName ?? existingSpell.name);
        const parsedName = (parsedSpell.flags.ddbimporter?.originalName ?? parsedSpell.name);
        // some spells come from different classes but end up having the same ddb id
        const classIdMatch = classInfo.definition.name === existingSpell.flags.ddbimporter?.dndbeyond.class;
        const spellIdMatch = spell.id === existingSpell.flags.ddbimporter?.dndbeyond.id;
        const legacyMatch = (parsedSpell.flags.ddbimporter?.is2014 ?? true) === (existingSpell.flags.ddbimporter?.is2014 ?? true)
          || (parsedSpell.flags.ddbimporter?.is2024 ?? false) === (existingSpell.flags.ddbimporter?.is2024 ?? false);
        return existingName === parsedName && (classIdMatch || spellIdMatch) && legacyMatch;
      });
    const duplicateItem = this._generated.class[duplicateSpell];
    if (!duplicateItem) {
      this._generated.class.push(parsedSpell);
    } else if (spell.alwaysPrepared || parsedSpell.system.method === "always"
      || (spell.alwaysPrepared === duplicateItem.flags.ddbimporter?.dndbeyond.alwaysPrepared
        && parsedSpell.system.method === duplicateItem.system.method
        && parsedSpell.system.prepared === CONFIG.DND5E.spellPreparationStates.always.value
        && duplicateItem.system.prepared === CONFIG.DND5E.spellPreparationStates.unprepared.value)) {
      // if our new spell is always known we overwrite!
      // it's probably domain
      this._generated.class[duplicateSpell] = parsedSpell;
    } else {
      // we'll emit a console message if it doesn't match this case for future debugging
      logger.info(`Duplicate Spell ${spell.definition.name} detected in class ${classInfo.definition.name}.`);
    }
  }

  filterSpellsByAllowedCategories(spells: IDDBSpellEntry[]) {
    return spells.filter((s) => {
      const sourceIds = (s.definition.sources ?? []).map((sm) => sm.sourceId);
      const hasActiveCategory = CONFIG.DDB.sources.some((ddbSource) =>
        sourceIds.includes(ddbSource.id)
        && this.ddb.character.activeSourceCategories.includes(ddbSource.sourceCategoryId),
      );
      return hasActiveCategory;
    });
  }

  removeSpellsBySourceCategoryIds(spells: IDDBSpellEntry[], ids: number[] = []) {
    return spells.filter((s) => {
      const sourceIds = (s.definition.sources ?? []).map((sm) => sm.sourceId);
      const isInRestrictedCategory = CONFIG.DDB.sources.some((ddbSource) =>
        sourceIds.includes(ddbSource.id)
        && ids.includes(ddbSource.sourceCategoryId),
      );
      return !isInRestrictedCategory;
    });
  }

  async generateClassSpells() {
    for (const playerClass of this.ddb.character.classSpells) {
      const classInfo = this.ddb.character.classes.find((cls) => cls.id === playerClass.characterClassId);
      if (!classInfo) {
        logger.warn(`Unable to find class with id ${playerClass.characterClassId} for class spell parsing`);
        continue;
      }
      const spellCastingAbility = getSpellCastingAbility(classInfo);
      const abilityModifier = this._getAbilityModifier(spellCastingAbility);

      const is2014Class = (classInfo.definition.sources ?? []).some((s) => Number.isInteger(s.sourceId) && s.sourceId < 145);
      const is2024NewKnownCaster = ["Ranger", "Paladin"].includes(classInfo.definition.name);
      if (!is2014Class && is2024NewKnownCaster) {
        playerClass.spells = playerClass.spells.map((spell) => {
          if (!spell.alwaysPrepared && spell.countsAsKnownSpell) spell.prepared = true;
          return spell;
        });
      }
      logger.debug("Spell parsing, class info", classInfo);

      const rawSpells = [
        ...playerClass.spells,
        ...(playerClass.alwaysPreparedSpells ?? []),
      ];
      if (utils.getSetting<boolean>("character-update-policy-import-full-spell-list")) {
        const knownSpells = playerClass.alwaysKnownSpells ?? [];
        const filteredAlwaysKnownSpells = utils.getSetting<boolean>("character-update-policy-use-active-sources")
          ? this.filterSpellsByAllowedCategories(knownSpells)
          : knownSpells;
        rawSpells.push(...filteredAlwaysKnownSpells);
      }

      const removeIds = [];

      if (utils.getSetting<boolean>("character-update-policy-remove-2024"))
        removeIds.push(24);

      if (utils.getSetting<boolean>("character-update-policy-remove-legacy"))
        removeIds.push(23, 26);

      const targetSpells: IDDBSpellEntry[] = removeIds.length > 0
        ? this.removeSpellsBySourceCategoryIds(rawSpells, removeIds)
        : rawSpells;

      for (const spell of targetSpells) {
        if (!spell.definition) continue;
        await this._processClassSpell({
          classInfo,
          is2014Class,
          playerClass,
          spell,
          spellCastingAbility,
          abilityModifier,
        });
      }
    }
  }

  async generateUnpreparedCantrips() {
    for (const playerClass of this.ddb.character.classSpells) {
      if (!playerClass.cantrips) continue;
      if (playerClass.cantrips.length === 0) continue;
      if (!utils.getSetting<boolean>("character-update-policy-import-all-cantrips")) continue;

      const classInfo = this.ddb.character.classes.find((cls) => cls.id === playerClass.characterClassId);
      if (!classInfo) {
        logger.warn(`Unable to find class with id ${playerClass.characterClassId} for cantrip parsing`);
        continue;
      }
      const spellCastingAbility = getSpellCastingAbility(classInfo);
      const abilityModifier = this._getAbilityModifier(spellCastingAbility);

      const is2014Class = (classInfo.definition.sources ?? []).some((s) => Number.isInteger(s.sourceId) && s.sourceId < 145);
      const is2024NewKnownCaster = ["Ranger", "Paladin"].includes(classInfo.definition.name);
      if (!is2014Class && is2024NewKnownCaster) {
        playerClass.spells = playerClass.spells.map((spell) => {
          if (!spell.alwaysPrepared && spell.countsAsKnownSpell) spell.prepared = true;
          return spell;
        });
      }
      logger.debug("Spell parsing, class info", classInfo);

      const allCantrips = (playerClass.cantrips ?? []).map((cantrip) => {
        cantrip.unPreparedCantrip = true;
        return cantrip;
      });

      const filteredCantrips = utils.getSetting<boolean>("character-update-policy-use-active-sources")
        ? this.filterSpellsByAllowedCategories(allCantrips)
        : allCantrips;

      const removeIds = [];

      if (utils.getSetting<boolean>("character-update-policy-remove-2024"))
        removeIds.push(24);

      if (utils.getSetting<boolean>("character-update-policy-remove-legacy"))
        removeIds.push(23, 26);

      const targetSpells = removeIds.length > 0
        ? this.removeSpellsBySourceCategoryIds(filteredCantrips, removeIds)
        : filteredCantrips;

      for (const spell of targetSpells) {
        if (!spell.definition) continue;
        await this._processClassSpell({
          classInfo,
          is2014Class,
          playerClass,
          spell,
          spellCastingAbility,
          abilityModifier,
          unPreparedCantrip: spell.unPreparedCantrip ?? null,
        });
      }
    }
  }


  async generateSpecialClassSpells() {
    for (const rawSpell of this.ddb.character.spells.class ?? []) {
      if (!rawSpell.definition) continue;
      // If the spell has an ability attached, use that
      let spellCastingAbility: T5eAbility;
      const featureId = DDBDataUtils.determineActualFeatureId(this.ddb, rawSpell.componentId);
      const classInfo = this.getLookup("classFeature", featureId);

      const mastered = classInfo !== undefined
        && CharacterSpellFactory.MASTERED_SPELL_FEATURES.includes(utils.nameString(classInfo.name))
        && CharacterSpellFactory.isMasteredSpell(rawSpell, this.masteredSpellChoiceIds);
      const spell = mastered ? CharacterSpellFactory.asMasteredSpellbookSpell(rawSpell) : rawSpell;

      logger.debug("Class spell parsing, class info", classInfo);
      // Sometimes there are spells here which don't have an class Info
      // this seems to be part of the optional tasha's rules, lets not parse for now
      // as ddb implementation is not yet finished
      // / options.class.[].definition.id
      if (!classInfo) {
        logger.warn(`Unable to add ${spell.definition.name}`);
      }
      if (!classInfo) continue;
      let klass = DDBDataUtils.getClassFromOptionID(this.ddb, spell.componentId);

      if (!klass) klass = DDBDataUtils.findClassByFeatureId(this.ddb, spell.componentId);

      logger.debug("Class spell, class found?", klass);

      if (CharacterSpellFactory.isIgnoredFeatureSpell(classInfo.name, spell)) {
        logger.debug(`Skipping ${spell.definition.name} for ${classInfo.name} as included in feature`);
        continue;
      }

      const featureName = classInfo.data?.definition?.name ?? classInfo.data?.name;
      if (featureName && DICTIONARY.parsing.ignoreSpellsGrantedByClassFeatures.includes(featureName)) {
        logger.debug(`Skipping ${spell.definition.name} for ${classInfo.name} as included in feature ignore list`, {
          featureName,
          classInfo,
        });
        continue;
      }

      if (hasSpellCastingAbility(spell.spellCastingAbilityId)) {
        spellCastingAbility = convertSpellCastingAbilityId(spell.spellCastingAbilityId);
      } else if (klass) {
        spellCastingAbility = getSpellCastingAbility(klass);
        // force these spells to always be prepared
        spell.alwaysPrepared = true;
      } else {
        // if there is no ability on spell, we default to wis
        spellCastingAbility = "wis";
      }

      if (!spell.alwaysPrepared && !spell.prepared && !spell.countsAsKnownSpell && spell.usesSpellSlot
        && !spell.limitedUse
      ) {
        spell.alwaysPrepared = true;
      }

      const abilityModifier = this._getAbilityModifier(spellCastingAbility);

      const klassName = klass?.definition?.name;

      // add some data for the parsing of the spells into the data structure
      const flagData: IParseSpellFlagData = {
        ddbimporter: {
          dndbeyond: {
            class: klassName,
            lookup: "classFeature",
            lookupName: classInfo.name,
            lookupId: classInfo.id,
            level: this.character.flags?.ddbimporter?.dndbeyond?.totalLevels ?? undefined,
            ability: spellCastingAbility,
            mod: abilityModifier,
            dc: 8 + this.proficiencyModifier + abilityModifier,
            overrideDC: false,
            id: spell.id ?? undefined,
            entityTypeId: spell.entityTypeId ?? undefined,
            usesSpellSlot: spell.usesSpellSlot,
            forceMaterial: klass?.definition?.name === "Artificer",
            homebrew: spell.definition.isHomebrew,
            forcePact: klass?.definition?.name === "Warlock",
            alwaysPrepared: spell.alwaysPrepared,
          },
        },
        "tidy5e-sheet": {
          parentClass: (klass) ? klass.definition.name : undefined,
        },
      };

      // Check for duplicate spells, normally domain ones
      // We will import spells from a different class that are the same though
      // as they may come from with different spell casting mods
      const duplicateSpell = klass
        ? this._generated.class.findIndex((existingSpell) =>
          (existingSpell.flags.ddbimporter?.originalName ?? existingSpell.name) === spell.definition.name
          && klass.definition.name === existingSpell.flags.ddbimporter?.dndbeyond.class
          && spell.usesSpellSlot && existingSpell.flags.ddbimporter?.dndbeyond.usesSpellSlot,
        )
        : -1;
      if (!this._generated.class[duplicateSpell]) {
        const parsedSpell = await DDBSpell.parseSpell(spell, this.character, {
          ddbData: this.ddb,
          namePostfix: `${this._getSpellCount(spell.definition.name)}`,
          generateSummons: this.generateSummons,
          flagData,
        });
        if (flagData.ddbimporter.dndbeyond.class) foundry.utils.setProperty(parsedSpell, "system.sourceItem", `class:${DDBDataUtils.classIdentifierName(flagData.ddbimporter.dndbeyond.class)}`);
        this._granted.class.push(parsedSpell);

        // check for class granted spells here
        if (parsedSpell.flags.ddbimporter?.is2024
          && CharacterSpellFactory.CLASS_GRANTED_SPELLS_2024.includes(parsedSpell.flags.ddbimporter.originalName ?? "")
        ) {
          await this.handleGrantedSpells(spell, "class", flagData, {
            forceCopy: true,
            flags: {
              lookup: "classFeature",
            },
          });
        }

      } else if (spell.alwaysPrepared) {
        // if our new spell is always known we overwrite!
        // it's probably domain
        const parsedSpell = await DDBSpell.parseSpell(spell, this.character, {
          ddbData: this.ddb,
          namePostfix: `${this._getSpellCount(spell.definition.name)}`,
          generateSummons: this.generateSummons,
        });
        if (flagData.ddbimporter.dndbeyond.class)
          foundry.utils.setProperty(parsedSpell, "system.sourceItem", `class:${DDBDataUtils.classIdentifierName(flagData.ddbimporter.dndbeyond.class)}`);
        this._generated.class[duplicateSpell] = parsedSpell;
      } else {
        // we'll emit a console message if it doesn't match this case for future debugging
        logger.info(`Duplicate Spell ${spell.definition.name} detected in class ${classInfo.name}.`);
      }
    }
  }

  static CLASS_GRANTED_SPELLS_2024 = [
    "Hunter's Mark",
  ];

  canCast(spell: IDDBSpellEntry) {
    if (spell.limitedUse || spell.definition.level === 0) return true;
    if (!this.slots) return false;
    if (this.pactSlots) return true;
    const levelSlots = utils.arrayRange(9, 1, 1).some((i) => {
      if (spell.definition.level > i) return false;
      const slot = this.slots[`spell${i}` as keyof I5eSpellSlots];
      return slot && Number(slot.max) !== 0;
    });
    return levelSlots;
  }

  async handleGrantedSpells(spell: IDDBSpellEntry,
    type: keyof ISpellFactorySpellHolder,
    flagData: IParseSpellFlagData,
    { forceCopy = false, flags = {} }: IHandleGrantedSpellsFlags = {},
  ) {
    if (spell.definition.level === 0) return;
    if (!forceCopy && !spell.limitedUse) return;
    if (!forceCopy && !this.slots) return;
    const levelSlots = utils.arrayRange(9, 1, 1).some((i) => {
      if (spell.definition.level > i) return false;
      const slot = this.slots[`spell${i}` as keyof I5eSpellSlots];
      return slot && Number(slot.max) !== 0;
    });

    if (!levelSlots && !this.pactSlots) return;

    const dups = (this.ddb.character.spells[type] ?? []).filter((otherSpell) =>
      otherSpell.definition
      && otherSpell.definition.name === spell.definition.name).length > 1;

    if (dups) {
      for (const spells of Object.values(this._generated)) {
        const duplicateSpell: I5eSpellItem = spells.some(
          (existingSpell: I5eSpellItem) =>
            (existingSpell.flags.ddbimporter?.originalName ?? existingSpell.name) === spell.definition.name
            && existingSpell.flags.ddbimporter?.dndbeyond.usesSpellSlot,
        );
        if (duplicateSpell) {
          logger.debug(`Skipping duplicate granted spell ${spell.definition.name} as multiple instances exist`);
          return;
        }
      }
    }

    // also parse spell as non-limited use
    const unlimitedSpell = foundry.utils.duplicate(spell) as IDDBSpellEntry;
    const unlimitedFlags = foundry.utils.deepClone(flagData) as IParseSpellFlagData;
    unlimitedSpell.limitedUse = null;
    unlimitedSpell.usesSpellSlot = true;
    unlimitedSpell.alwaysPrepared = true;
    unlimitedFlags.ddbimporter.dndbeyond.usesSpellSlot = true;
    unlimitedFlags.ddbimporter.dndbeyond.granted = true;
    // not entirely true, might end up with a class here
    unlimitedFlags.ddbimporter.dndbeyond.lookup = flags.lookup ?? type as TParseSpellLookup;
    delete unlimitedSpell.id;
    delete unlimitedFlags.ddbimporter.dndbeyond.id;
    const parsedSpell = await DDBSpell.parseSpell(unlimitedSpell, this.character, {
      ddbData: this.ddb,
      namePrefix: `Gr`,
      namePostfix: `${this._getSpellCount(unlimitedSpell.definition.name)}`,
      generateSummons: this.generateSummons,
      flagData: unlimitedFlags,
    });

    if (parsedSpell.system.source.rules === "2014"
      && DICTIONARY.parsing.spellListGrantsIgnore["2014"].some((i) => unlimitedFlags.ddbimporter.dndbeyond.lookupName?.includes(i) ?? false)
    ) {
      logger.debug(`Ignoring 2014 granted spell as not a spell list grant ${parsedSpell.flags.ddbimporter?.originalName}`);
      return;
    }
    this._generated[type].push(parsedSpell);
  }

  async generateRaceSpells() {
    for (const spell of this.ddb.character.spells.race ?? []) {
      if (!spell.definition) continue;
      // for race spells the spell spellCastingAbilityId is on the spell
      // if there is no ability on spell, we default to wis
      let spellCastingAbility: T5eAbility = "wis";
      if (hasSpellCastingAbility(spell.spellCastingAbilityId)) {
        spellCastingAbility = convertSpellCastingAbilityId(spell.spellCastingAbilityId);
      }

      const abilityModifier = this._getAbilityModifier(spellCastingAbility);

      let raceInfo = this.getLookup("race", spell.componentId);

      if (!raceInfo) {
        // for some reason we haven't matched the race option id with the spell
        // this happens with at least the SCAG optional spells casting half elf
        raceInfo = {
          name: "Racial spell",
          id: spell.componentId,
        };
      }

      // add some data for the parsing of the spells into the data structure
      const flagData: IParseSpellFlagData = {
        ddbimporter: {
          dndbeyond: {
            lookup: "race",
            lookupName: raceInfo.name,
            lookupId: raceInfo.id,
            race: this.ddb.character.race.fullName,
            level: spell.castAtLevel ?? undefined,
            ability: spellCastingAbility,
            mod: abilityModifier,
            dc: 8 + this.proficiencyModifier + abilityModifier,
            overrideDC: false,
            id: spell.id ?? undefined,
            entityTypeId: spell.entityTypeId ?? undefined,
            usesSpellSlot: spell.usesSpellSlot,
            homebrew: spell.definition.isHomebrew,
            alwaysPrepared: spell.alwaysPrepared,
          },
        },
      };

      if ((this.ddb.character.spells.race ?? []).filter((sp) =>
        sp.definition
        && sp.definition.name === spell.definition.name).length === 1
      ) {
        await this.handleGrantedSpells(spell, "race", flagData);
      }
      if (!this.canCast(spell)) continue;
      const parsedSpell = await DDBSpell.parseSpell(spell, this.character, {
        ddbData: this.ddb,
        namePostfix: `${this._getSpellCount(spell.definition.name)}`,
        generateSummons: this.generateSummons,
        flagData,
      });
      // the granting racial trait is imported as a feat item; the fallback lookup names no document
      if (raceInfo.data) {
        foundry.utils.setProperty(parsedSpell, "system.sourceItem", CharacterSpellFactory.featureSourceItem("feat", raceInfo.name));
      }
      // this._generated.race.push(parsedSpell);
      this._granted.race.push(parsedSpell);
    }
  }

  async generateFeatSpells() {
    for (const spell of this.ddb.character.spells.feat ?? []) {
      if (!spell.definition) continue;
      // If the spell has an ability attached, use that
      // if there is no ability on spell, we default to wis
      let spellCastingAbility: T5eAbility = "wis";
      if (hasSpellCastingAbility(spell.spellCastingAbilityId)) {
        spellCastingAbility = convertSpellCastingAbilityId(spell.spellCastingAbilityId);
      }

      const abilityModifier = this._getAbilityModifier(spellCastingAbility);

      let featInfo = this.getLookup("feat", spell.componentId);

      if (!featInfo) {
        // for some reason we haven't matched the feat option id with the spell
        // we fiddle the result
        featInfo = {
          name: "Feat option spell",
          id: spell.componentId,
        };
      }

      const featName = featInfo.data?.definition?.name ?? featInfo.data?.name;
      if (featName && DICTIONARY.parsing.ignoreSpellsGrantedByFeats.includes(featName)) {
        logger.debug(`Skipping ${spell.definition.name} for ${featInfo.name} as included in feature ignore list`, {
          featName,
          featInfo,
        });
        continue;
      }

      // add some data for the parsing of the spells into the data structure
      const flagData: IParseSpellFlagData = {
        ddbimporter: {
          dndbeyond: {
            lookup: "feat",
            lookupName: featInfo.name,
            lookupId: featInfo.id,
            level: spell.castAtLevel ?? undefined,
            ability: spellCastingAbility,
            mod: abilityModifier,
            dc: 8 + this.proficiencyModifier + abilityModifier,
            overrideDC: false,
            id: spell.id ?? undefined,
            entityTypeId: spell.entityTypeId ?? undefined,
            usesSpellSlot: spell.usesSpellSlot,
            homebrew: spell.definition.isHomebrew,
            alwaysPrepared: spell.alwaysPrepared,
          },
        },
      };

      if ((this.ddb.character.spells.feat ?? []).filter((sp) =>
        sp.definition
        && sp.definition.name === spell.definition.name).length === 1
      ) {
        const forceCopy = SPELLIST_ADDITION_MATCHES.some((t) => (featInfo.data?.definition?.description ?? "").toLowerCase().includes(t));
        if (forceCopy) {
          await this.handleGrantedSpells(spell, "feat", flagData, {
            forceCopy,
          });
        }
      }
      if (!this.canCast(spell)) continue;
      const parsedSpell = await DDBSpell.parseSpell(spell, this.character, {
        ddbData: this.ddb,
        namePostfix: `${this._getSpellCount(spell.definition.name)}`,
        generateSummons: this.generateSummons,
        flagData,
      });
      if (featInfo.data) {
        foundry.utils.setProperty(parsedSpell, "system.sourceItem", CharacterSpellFactory.featureSourceItem("feat", featInfo.name));
      }
      // if (spell.definition.level === 0) {
      //   this._generated.feat.push(parsedSpell);
      // } else {
      //   this._granted.feat.push(parsedSpell);
      // }
      this._granted.feat.push(parsedSpell);
    }
  }

  async generateBackgroundSpells() {
    if (!this.ddb.character.spells.background) this.ddb.character.spells.background = [];
    for (const spell of this.ddb.character.spells.background) {
      if (!spell.definition) continue;
      // If the spell has an ability attached, use that
      // if there is no ability on spell, we default to wis
      let spellCastingAbility: T5eAbility = "wis";
      if (hasSpellCastingAbility(spell.spellCastingAbilityId)) {
        spellCastingAbility = convertSpellCastingAbilityId(spell.spellCastingAbilityId);
      }

      const abilityModifier = this._getAbilityModifier(spellCastingAbility);

      // add some data for the parsing of the spells into the data structure
      const flagData: IParseSpellFlagData = {
        ddbimporter: {
          dndbeyond: {
            lookup: "background",
            lookupName: "Background",
            level: spell.castAtLevel ?? undefined,
            ability: spellCastingAbility,
            mod: abilityModifier,
            dc: 8 + this.proficiencyModifier + abilityModifier,
            overrideDC: false,
            id: spell.id ?? undefined,
            entityTypeId: spell.entityTypeId ?? undefined,
            usesSpellSlot: spell.usesSpellSlot,
            homebrew: spell.definition.isHomebrew,
            alwaysPrepared: spell.alwaysPrepared,
          },
        },
      };

      if (this.ddb.character.spells.background.filter((sp) => sp.definition
        && sp.definition.name === spell.definition.name).length === 1
      ) {
        await this.handleGrantedSpells(spell, "background", flagData);
      }
      if (!this.canCast(spell)) continue;
      const parsedSpell = await DDBSpell.parseSpell(spell, this.character, {
        ddbData: this.ddb,
        namePostfix: `${this._getSpellCount(spell.definition.name)}`,
        generateSummons: this.generateSummons,
        flagData,
      });
      const background = this.ddb.character.background;
      const backgroundName = background?.definition?.name ?? background?.customBackground?.name;
      if (backgroundName) {
        foundry.utils.setProperty(parsedSpell, "system.sourceItem", CharacterSpellFactory.featureSourceItem("background", backgroundName));
      }
      this._generated.background.push(parsedSpell);
    }
  }

  async _setCompendiumSource() {
    const spellCompendium = CompendiumHelper.getCompendiumType("spells", false);
    if (!spellCompendium) {
      logger.warn("Unable to find spell compendium for spell compendium source linking");
      return;
    }
    await CompendiumHelper.loadCompendiumIndex("spells", {
      fields: SPELL_COMPENDIUM_INDEX_FIELDS,
    });

    // captured in a local so the narrowing above applies inside the closure
    const spellCompendiumIndex = spellCompendium.index;

    function setLink(spell: I5eSpellItem) {
      if (!spell) return;
      const lookup = spellCompendiumIndex.find((s1) => {
        const s = s1 as unknown as ISpellCompendiumIndexEntry;
        if (!s.flags?.ddbimporter?.definitionId) return false;
        if (!spell.flags?.ddbimporter?.definitionId) return false;
        return s.flags.ddbimporter.definitionId === spell.flags.ddbimporter.definitionId;
      });

      if (lookup) foundry.utils.setProperty(spell, "_stats.compendiumSource", lookup.uuid);
      else {
        logger.warn(`Spell ${spell.name} not found in compendium for spell list linking`);
      }
    }

    for (const [key, spells] of Object.entries(this._generated)) {
      for (const spell of spells) {
        setLink(spell);
      }
      this._generated[key as keyof ISpellFactorySpellHolder] = spells;
    }

    for (const [key, spells] of Object.entries(this._granted)) {
      for (const spell of spells) {
        setLink(spell);
      }
      this._granted[key as keyof ISpellFactorySpellHolder] = spells;
    }
  }

  /**
   * Bake the 2024 Healer feat's healing-die reroll onto the character's healing spells.
   * The flag lets a later import strip a reroll we added if the feat goes away or AC5e turns up.
   */
  _applyHealingRerolls() {
    for (const spell of this.processed) {
      const flagged = foundry.utils.getProperty(spell, "flags.ddbimporter.healingReroll") === true;
      if (this.healingReroll) {
        const applied = SpellDataUtils.applyHealingDieModifiers(spell, CharacterSpellFactory.HEALING_REROLL_MODIFIERS);
        if (applied) foundry.utils.setProperty(spell, "flags.ddbimporter.healingReroll", true);
      } else if (flagged) {
        SpellDataUtils.applyHealingDieModifiers(spell, CharacterSpellFactory.HEALING_REROLL_MODIFIERS, { remove: true });
        delete spell.flags.ddbimporter?.healingReroll;
      }
    }
  }

  async generateCharacterSpells() {
    // each class has an entry here, each entry has spells
    // we loop through each class and process
    await this.generateClassSpells();

    // Parse any spells granted by class features, such as Barbarian Totem
    await this.generateSpecialClassSpells();

    // unprepared cantrips
    await this.generateUnpreparedCantrips();

    // Race spells are handled slightly differently
    await this.generateRaceSpells();

    // feat spells are handled slightly differently
    await this.generateFeatSpells();

    // background spells are handled slightly differently
    await this.generateBackgroundSpells();

    await this._setCompendiumSource();

    this.processed = Object.values(this._generated).flat();

    this._applyHealingRerolls();

    return this.processed.sort((a, b) => a.name.localeCompare(b.name));
  }
}
