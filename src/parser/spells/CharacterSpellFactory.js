/* eslint-disable no-continue */
import { utils, logger } from "../../lib/_module.mjs";

// Import parsing functions
import { getLookups } from "./metadata.js";
import { getSpellCastingAbility, hasSpellCastingAbility, convertSpellCastingAbilityId } from "./ability.js";
import DDBSpell from "./DDBSpell.js";
import { SETTINGS } from "../../config/_module.mjs";
import { DDBDataUtils, DDBModifiers } from "../lib/_module.mjs";

export default class CharacterSpellFactory {

  constructor(ddbCharacter) {
    this.ddbCharacter = ddbCharacter;
    this.ddb = ddbCharacter.source.ddb;
    this.character = ddbCharacter.raw.character;

    this.processed = [];

    this.proficiencyModifier = this.character.system.attributes.prof;
    this.lookups = getLookups(this.ddb);

    logger.debug("Character spell lookups", this.lookups);
    this.characterAbilities = this.character.flags.ddbimporter.dndbeyond.effectAbilities;

    this.healingBoost = DDBModifiers.filterBaseModifiers(this.ddb, "bonus", { subType: "spell-group-healing" }).reduce((a, b) => a + b.value, 0);

    this.spellCounts = {

    };

    this.slots = foundry.utils.getProperty(this.character, "system.spells");
    this.levelSlots = utils.arrayRange(9, 1, 1).some((i) => {
      return this.slots[`spell${i}`] && this.slots[`spell${i}`].max !== 0;
    });
    this.pactSlots = this.slots.pact?.max && this.slots.pact.max > 0;
    this.hasSlots = this.levelSlots || this.pactSlots;
    this.generateSummons = ddbCharacter.generateSummons;
  }

  _getSpellCount(name) {
    if (!this.spellCounts[name]) {
      this.spellCounts[name] = 0;
    }
    return ++this.spellCounts[name];
  }

  async _processClassSpell({
    classInfo,
    playerClass,
    spell,
    spellCastingAbility,
    abilityModifier,
    cantripBoost,
  }) {
    // add some data for the parsing of the spells into the data structure
    spell.flags = {
      ddbimporter: {
        dndbeyond: {
          lookup: "classSpell",
          class: classInfo.definition.name,
          level: classInfo.level,
          characterClassId: playerClass.characterClassId,
          spellLevel: spell.definition.level,
          // spellSlots: character.system.spells,
          ability: spellCastingAbility,
          mod: abilityModifier,
          dc: 8 + this.proficiencyModifier + abilityModifier,
          cantripBoost,
          overrideDC: false,
          id: spell.id,
          entityTypeId: spell.entityTypeId,
          healingBoost: this.healingBoost,
          usesSpellSlot: spell.usesSpellSlot,
          forceMaterial: classInfo.definition.name === "Artificer",
          homebrew: spell.definition.isHomebrew,
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
    });
    foundry.utils.setProperty(parsedSpell, "system.sourceClass", classInfo.definition.name.toLowerCase());
    const duplicateSpell = this.processed.findIndex(
      (existingSpell) => {
        const existingName = (existingSpell.flags.ddbimporter.originalName ? existingSpell.flags.ddbimporter.originalName : existingSpell.name);
        const parsedName = (parsedSpell.flags.ddbimporter.originalName ? parsedSpell.flags.ddbimporter.originalName : parsedSpell.name);
        // some spells come from different classes but end up having the same ddb id
        const classIdMatch = (classInfo.definition.name === existingSpell.flags.ddbimporter.dndbeyond.class || spell.id === existingSpell.flags.ddbimporter.dndbeyond.id);
        const legacyMatch = (parsedSpell.flags.ddbimporter.is2014 ?? true) === (existingSpell.flags.ddbimporter.is2014 ?? true)
          || (parsedSpell.flags.ddbimporter.is2024 ?? false) === (existingSpell.flags.ddbimporter.is2024 ?? false);
        return existingName === parsedName && classIdMatch && legacyMatch;
      });
    const duplicateItem = this.processed[duplicateSpell];
    if (!duplicateItem) {
      this.processed.push(parsedSpell);
    } else if (spell.alwaysPrepared || parsedSpell.system.preparation.mode === "always"
      || (spell.alwaysPrepared === duplicateItem.alwaysPrepared && parsedSpell.system.preparation.mode === duplicateItem.system.preparation.mode && parsedSpell.prepared && !duplicateItem.prepared)) {
      // if our new spell is always known we overwrite!
      // it's probably domain
      this.processed[duplicateSpell] = parsedSpell;
    } else {
      // we'll emit a console message if it doesn't match this case for future debugging
      logger.info(`Duplicate Spell ${spell.definition.name} detected in class ${classInfo.definition.name}.`);
    }
  }

  filterSpellsByAllowedCategories(spells) {
    return spells.filter((s) => {
      const sourceIds = s.definition.sources.map((sm) => sm.sourceId);
      const hasActiveCategory = CONFIG.DDB.sources.some((ddbSource) =>
        sourceIds.includes(ddbSource.id)
        && this.ddb.character.activeSourceCategories.includes(ddbSource.sourceCategoryId),
      );
      return hasActiveCategory;
    });
  }

  // eslint-disable-next-line class-methods-use-this
  removeSpellsBySourceCategoryIds(spells, ids = []) {
    return spells.filter((s) => {
      const sourceIds = s.definition.sources.map((sm) => sm.sourceId);
      const isInRestrictedCategory = CONFIG.DDB.sources.some((ddbSource) =>
        sourceIds.includes(ddbSource.id)
        && ids.includes(ddbSource.sourceCategoryId),
      );
      return !isInRestrictedCategory;
    });
  }

  async getClassSpells() {
    for (const playerClass of this.ddb.character.classSpells) {
      const classInfo = this.ddb.character.classes.find((cls) => cls.id === playerClass.characterClassId);
      const spellCastingAbility = getSpellCastingAbility(classInfo);
      const abilityModifier = utils.calculateModifier(this.characterAbilities[spellCastingAbility].value);

      const is2014Class = classInfo.definition.sources.some((s) => Number.isInteger(s.sourceId) && s.sourceId < 145);
      const is2024NewKnownCaster = ["Ranger", "Paladin"].includes(classInfo.definition.name);
      if (!is2014Class && is2024NewKnownCaster) {
        playerClass.spells = playerClass.spells.map((spell) => {
          if (!spell.alwaysPrepared && spell.countsAsKnownSpell) spell.prepared = true;
          return spell;
        });
      }
      logger.debug("Spell parsing, class info", classInfo);

      const cantripBoost
        = DDBModifiers.getChosenClassModifiers(this.ddb).filter(
          (mod) =>
            mod.type === "bonus"
            && mod.subType === `${classInfo.definition.name.toLowerCase()}-cantrip-damage`
            && (mod.restriction === null || mod.restriction === ""),
        ).length > 0;

      const rawSpells = [
        ...playerClass.spells,
        ...(playerClass.alwaysPreparedSpells ?? []),
      ];
      if (game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-import-full-spell-list")) {
        const knownSpells = playerClass.alwaysKnownSpells ?? [];
        const filteredAlwaysKnownSpells = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-active-sources")
          ? this.filterSpellsByAllowedCategories(knownSpells)
          : knownSpells;
        rawSpells.push(...filteredAlwaysKnownSpells);
      }

      const removeIds = [];

      if (game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-remove-2024"))
        removeIds.push(24);

      if (game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-remove-legacy"))
        removeIds.push(23, 26);

      const targetSpells = removeIds.length > 0
        ? this.removeSpellsBySourceCategoryIds(rawSpells, removeIds)
        : rawSpells;

      for (const spell of targetSpells) {
        if (!spell.definition) continue;
        await this._processClassSpell({
          classInfo,
          playerClass,
          spell,
          spellCastingAbility,
          abilityModifier,
          cantripBoost,
        });
      }
    }

  }

  // eslint-disable-next-line complexity
  async getSpecialClassSpells() {
    for (const spell of this.ddb.character.spells.class) {
      if (!spell.definition) continue;
      // If the spell has an ability attached, use that
      let spellCastingAbility = undefined;
      const featureId = DDBDataUtils.determineActualFeatureId(this.ddb, spell.componentId);
      const classInfo = this.lookups.classFeature.find((clsFeature) => clsFeature.id == featureId);

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

      const abilityModifier = utils.calculateModifier(this.characterAbilities[spellCastingAbility].value);

      const klassName = klass?.definition?.name;
      const cantripBoost
        = DDBModifiers.getChosenClassModifiers(this.ddb).filter(
          (mod) =>
            mod.type === "bonus"
            && mod.subType === `${klassName.toLowerCase()}-cantrip-damage`
            && (mod.restriction === null || mod.restriction === ""),
        ).length > 0;

      // add some data for the parsing of the spells into the data structure
      spell.flags = {
        ddbimporter: {
          dndbeyond: {
            class: klassName,
            lookup: "classFeature",
            lookupName: classInfo.name,
            lookupId: classInfo.id,
            level: this.character.flags.ddbimporter.dndbeyond.totalLevels,
            ability: spellCastingAbility,
            mod: abilityModifier,
            dc: 8 + this.proficiencyModifier + abilityModifier,
            overrideDC: false,
            id: spell.id,
            entityTypeId: spell.entityTypeId,
            healingBoost: this.healingBoost,
            cantripBoost,
            usesSpellSlot: spell.usesSpellSlot,
            forceMaterial: klass?.definition?.name === "Artificer",
            homebrew: spell.definition.isHomebrew,
            forcePact: klass?.definition?.name === "Warlock",
          },
        },
        "tidy5e-sheet": {
          parentClass: (klass) ? klass.definition.name : undefined,
        },
      };

      // Check for duplicate spells, normally domain ones
      // We will import spells from a different class that are the same though
      // as they may come from with different spell casting mods
      const duplicateSpell = this.processed.findIndex(
        (existingSpell) =>
          (existingSpell.flags.ddbimporter.originalName ? existingSpell.flags.ddbimporter.originalName : existingSpell.name) === spell.definition.name
          && klass
          && klass.definition.name === existingSpell.flags.ddbimporter.dndbeyond.class
          && spell.usesSpellSlot && existingSpell.flags.ddbimporter.dndbeyond.usesSpellSlot,
      );
      if (!this.processed[duplicateSpell]) {
        const parsedSpell = await DDBSpell.parseSpell(spell, this.character, {
          ddbData: this.ddb,
          namePostfix: `${this._getSpellCount(spell.definition.name)}`,
          generateSummons: this.generateSummons,
        });
        if (spell.flags.ddbimporter.dndbeyond.class) foundry.utils.setProperty(parsedSpell, "system.sourceClass", spell.flags.ddbimporter.dndbeyond.class.toLowerCase());
        this.processed.push(parsedSpell);

        // console.warn({
        //   spell,
        //   parsedSpell,
        //   bool: parsedSpell.flags.ddbimporter.is2024
        //   && CharacterSpellFactory.CLASS_GRANTED_SPELLS_2024.includes(parsedSpell.flags.ddbimporter.originalName),
        // });
        // check for class granted spells here
        if (parsedSpell.flags.ddbimporter.is2024
          && CharacterSpellFactory.CLASS_GRANTED_SPELLS_2024.includes(parsedSpell.flags.ddbimporter.originalName)
        ) {
          // console.warn(`Adding non duplicate spell, ${parsedSpell.flags.ddbimporter.originalName} to class granted spells`, {
          //   spell: deepClone(spell),
          //   parsedSpell: deepClone(parsedSpell),
          // });
          this.handleGrantedSpells(spell, "class", {
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
        // console.warn(`Overwriting duplicate spell, ${parsedSpell.flags.ddbimporter.originalName} to class granted spells`, {
        //   spell,
        //   parsedSpell,
        // });
        if (spell.flags.ddbimporter.dndbeyond.class) foundry.utils.setProperty(parsedSpell, "system.sourceClass", spell.flags.ddbimporter.dndbeyond.class.toLowerCase());
        this.processed[duplicateSpell] = parsedSpell;
      } else {
        // we'll emit a console message if it doesn't match this case for future debugging
        logger.info(`Duplicate Spell ${spell.definition.name} detected in class ${classInfo.name}.`);
      }
    }
  }

  static CLASS_GRANTED_SPELLS_2024 = [
    "Hunter's Mark",
  ];

  canCast(spell) {
    if (spell.limitedUse || spell.definition.level === 0) return true;
    if (!this.slots) return false;
    if (this.pactSlots) return true;
    const levelSlots = utils.arrayRange(9, 1, 1).some((i) => {
      if (spell.definition.level > i) return false;
      return this.slots[`spell${i}`] && this.slots[`spell${i}`].max !== 0;
    });
    return levelSlots;
  }

  async handleGrantedSpells(spell, type, { forceCopy = false, flags = {} } = {}) {
    if (!forceCopy && (!spell.limitedUse || spell.definition.level === 0)) return;
    if (!forceCopy && !this.slots) return;
    const levelSlots = utils.arrayRange(9, 1, 1).some((i) => {
      if (spell.definition.level > i) return false;
      return this.slots[`spell${i}`] && this.slots[`spell${i}`].max !== 0;
    });

    if (!levelSlots && !this.pactSlots) return;

    const dups = this.ddb.character.spells[type].filter((otherSpell) => otherSpell.definition && otherSpell.definition.name === spell.definition.name).length > 1;
    const duplicateSpell = this.processed.findIndex(
      (existingSpell) =>
        (existingSpell.flags.ddbimporter.originalName ? existingSpell.flags.ddbimporter.originalName : existingSpell.name) === spell.definition.name
        && existingSpell.flags.ddbimporter.dndbeyond.usesSpellSlot,
    );

    if (dups && this.processed[duplicateSpell]) return;

    // also parse spell as non-limited use
    let unlimitedSpell = foundry.utils.duplicate(spell);
    unlimitedSpell.limitedUse = null;
    unlimitedSpell.usesSpellSlot = true;
    unlimitedSpell.alwaysPrepared = true;
    unlimitedSpell.flags.ddbimporter.dndbeyond.usesSpellSlot = true;
    unlimitedSpell.flags.ddbimporter.dndbeyond.granted = true;
    unlimitedSpell.flags.ddbimporter.dndbeyond.lookup = flags.lookup ?? type;
    delete unlimitedSpell.id;
    delete unlimitedSpell.flags.ddbimporter.dndbeyond.id;
    const parsedSpell = await DDBSpell.parseSpell(unlimitedSpell, this.character, {
      ddbData: this.ddb,
      namePrefix: `Gr`,
      namePostfix: `${this._getSpellCount(unlimitedSpell.definition.name)}`,
      generateSummons: this.generateSummons,
    });
    // console.warn(`Granted Spell`, {
    //   spell: deepClone(spell),
    //   parsedSpell: deepClone(parsedSpell),
    //   unlimitedSpell: deepClone(unlimitedSpell),
    // });
    this.processed.push(parsedSpell);
  }

  async getRaceSpells() {
    for (const spell of this.ddb.character.spells.race) {
      if (!spell.definition) continue;
      // for race spells the spell spellCastingAbilityId is on the spell
      // if there is no ability on spell, we default to wis
      let spellCastingAbility = "wis";
      if (hasSpellCastingAbility(spell.spellCastingAbilityId)) {
        spellCastingAbility = convertSpellCastingAbilityId(spell.spellCastingAbilityId);
      }

      const abilityModifier = utils.calculateModifier(this.characterAbilities[spellCastingAbility].value);

      let raceInfo = this.lookups.race.find((rc) => rc.id === spell.componentId);

      if (!raceInfo) {
        // for some reason we haven't matched the race option id with the spell
        // this happens with at least the SCAG optional spells casting half elf
        raceInfo = {
          name: "Racial spell",
          id: spell.componentId,
        };
      }

      // add some data for the parsing of the spells into the data structure
      spell.flags = {
        ddbimporter: {
          dndbeyond: {
            lookup: "race",
            lookupName: raceInfo.name,
            lookupId: raceInfo.id,
            race: this.ddb.character.race.fullName,
            level: spell.castAtLevel,
            ability: spellCastingAbility,
            mod: abilityModifier,
            dc: 8 + this.proficiencyModifier + abilityModifier,
            overrideDC: false,
            id: spell.id,
            entityTypeId: spell.entityTypeId,
            healingBoost: this.healingBoost,
            usesSpellSlot: spell.usesSpellSlot,
            homebrew: spell.definition.isHomebrew,
          },
        },
      };

      if (this.ddb.character.spells.race.filter((sp) =>
        sp.definition
        && sp.definition.name === spell.definition.name).length === 1
      ) {
        this.handleGrantedSpells(spell, "race");
      }
      if (!this.canCast(spell)) continue;
      const parsedSpell = await DDBSpell.parseSpell(spell, this.character, {
        ddbData: this.ddb,
        namePostfix: `${this._getSpellCount(spell.definition.name)}`,
        generateSummons: this.generateSummons,
      });
      this.processed.push(parsedSpell);
    }
  }

  async getFeatSpells() {
    for (const spell of this.ddb.character.spells.feat) {
      if (!spell.definition) continue;
      // If the spell has an ability attached, use that
      // if there is no ability on spell, we default to wis
      let spellCastingAbility = "wis";
      if (hasSpellCastingAbility(spell.spellCastingAbilityId)) {
        spellCastingAbility = convertSpellCastingAbilityId(spell.spellCastingAbilityId);
      }

      const abilityModifier = utils.calculateModifier(this.characterAbilities[spellCastingAbility].value);

      let featInfo = this.lookups.feat.find((ft) => ft.id === spell.componentId);

      if (!featInfo) {
        // for some reason we haven't matched the feat option id with the spell
        // we fiddle the result
        featInfo = {
          name: "Feat option spell",
          id: spell.componentId,
        };
      }

      // add some data for the parsing of the spells into the data structure
      spell.flags = {
        ddbimporter: {
          dndbeyond: {
            lookup: "feat",
            lookupName: featInfo.name,
            lookupId: featInfo.id,
            level: spell.castAtLevel,
            ability: spellCastingAbility,
            mod: abilityModifier,
            dc: 8 + this.proficiencyModifier + abilityModifier,
            overrideDC: false,
            id: spell.id,
            entityTypeId: spell.entityTypeId,
            healingBoost: this.healingBoost,
            usesSpellSlot: spell.usesSpellSlot,
            homebrew: spell.definition.isHomebrew,
          },
        },
      };

      if (this.ddb.character.spells.feat.filter((sp) =>
        sp.definition
        && sp.definition.name === spell.definition.name).length === 1
      ) {
        this.handleGrantedSpells(spell, "feat");
      }
      if (!this.canCast(spell)) continue;
      const parsedSpell = await DDBSpell.parseSpell(spell, this.character, {
        ddbData: this.ddb,
        namePostfix: `${this._getSpellCount(spell.definition.name)}`,
        generateSummons: this.generateSummons,
      });
      this.processed.push(parsedSpell);
    }
  }

  async getBackgroundSpells() {
    if (!this.ddb.character.spells.background) this.ddb.character.spells.background = [];
    for (const spell of this.ddb.character.spells.background) {
      if (!spell.definition) continue;
      // If the spell has an ability attached, use that
      // if there is no ability on spell, we default to wis
      let spellCastingAbility = "wis";
      if (hasSpellCastingAbility(spell.spellCastingAbilityId)) {
        spellCastingAbility = convertSpellCastingAbilityId(spell.spellCastingAbilityId);
      }

      const abilityModifier = utils.calculateModifier(this.characterAbilities[spellCastingAbility].value);

      // add some data for the parsing of the spells into the data structure
      spell.flags = {
        ddbimporter: {
          dndbeyond: {
            lookup: "background",
            lookupName: "Background",
            level: spell.castAtLevel,
            ability: spellCastingAbility,
            mod: abilityModifier,
            dc: 8 + this.proficiencyModifier + abilityModifier,
            overrideDC: false,
            id: spell.id,
            entityTypeId: spell.entityTypeId,
            healingBoost: this.healingBoost,
            usesSpellSlot: spell.usesSpellSlot,
            homebrew: spell.definition.isHomebrew,
          },
        },
      };

      if (this.ddb.character.spells.background.filter((sp) => sp.definition
        && sp.definition.name === spell.definition.name).length === 1
      ) {
        this.handleGrantedSpells(spell, "background");
      }
      if (!this.canCast(spell)) continue;
      const parsedSpell = await DDBSpell.parseSpell(spell, this.character, {
        ddbData: this.ddb,
        namePostfix: `${this._getSpellCount(spell.definition.name)}`,
        generateSummons: this.generateSummons,
      });
      this.processed.push(parsedSpell);
    }
  }

  async getCharacterSpells() {
    // each class has an entry here, each entry has spells
    // we loop through each class and process
    await this.getClassSpells();

    // Parse any spells granted by class features, such as Barbarian Totem
    await this.getSpecialClassSpells();

    // Race spells are handled slightly differently
    await this.getRaceSpells();

    // feat spells are handled slightly differently
    await this.getFeatSpells();

    // background spells are handled slightly differently
    await this.getBackgroundSpells();

    return this.processed.sort((a, b) => a.name.localeCompare(b.name));
  }
}
