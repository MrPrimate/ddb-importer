/* eslint-disable no-continue */
import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";

// Import parsing functions
import { getLookups } from "./metadata.js";
import { fixSpells } from "./special.js";
import { parseSpell } from "./parseSpell.js";
import { getSpellCastingAbility, hasSpellCastingAbility, convertSpellCastingAbilityId } from "./ability.js";
import logger from "../../logger.js";

export default class CharacterSpellFactory {

  constructor(ddb, character) {
    this.ddb = ddb;
    this.character = character;

    this.items = [];

    this.proficiencyModifier = character.system.attributes.prof;
    this.lookups = getLookups(ddb.character);

    logger.debug("Character spell lookups", this.lookups);
    this.characterAbilities = character.flags.ddbimporter.dndbeyond.effectAbilities;

    this.healingBoost = DDBHelper.filterBaseModifiers(ddb, "bonus", { subType: "spell-group-healing" }).reduce((a, b) => a + b.value, 0);

  }

  async getClassSpells() {
    for (const playerClass of this.ddb.character.classSpells) {
      const classInfo = this.ddb.character.classes.find((cls) => cls.id === playerClass.characterClassId);
      const spellCastingAbility = getSpellCastingAbility(classInfo);
      const abilityModifier = utils.calculateModifier(this.characterAbilities[spellCastingAbility].value);

      logger.debug("Spell parsing, class info", classInfo);

      const cantripBoost
        = DDBHelper.getChosenClassModifiers(this.ddb).filter(
          (mod) =>
            mod.type === "bonus"
            && mod.subType === `${classInfo.definition.name.toLowerCase()}-cantrip-damage`
            && (mod.restriction === null || mod.restriction === "")
        ).length > 0;

      // parse spells chosen as spellcasting (playerClass.spells)
      for (const spell of playerClass.spells) {
        if (!spell.definition) continue;
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
              cantripBoost: cantripBoost,
              overrideDC: false,
              id: spell.id,
              entityTypeId: spell.entityTypeId,
              healingBoost: this.healingBoost,
              usesSpellSlot: spell.usesSpellSlot,
              forceMaterial: classInfo.definition.name === "Artificer",
            },
          },
          "spell-class-filter-for-5e": {
            parentClass: classInfo.definition.name.toLowerCase(),
          },
          "tidy5e-sheet-kgar": {
            parentClass: classInfo.definition.name.toLowerCase(),
          },
          // "spellbook-assistant-manager": {
          //   class: classInfo.definition.name.toLowerCase(),
          // }
        };

        // Check for duplicate spells, normally domain ones
        // We will import spells from a different class that are the same though
        // as they may come from with different spell casting mods
        // eslint-disable-next-line no-await-in-loop
        const parsedSpell = await parseSpell(spell, this.character);
        const duplicateSpell = this.items.findIndex(
          (existingSpell) => {
            const existingName = (existingSpell.flags.ddbimporter.originalName ? existingSpell.flags.ddbimporter.originalName : existingSpell.name);
            const parsedName = (parsedSpell.flags.ddbimporter.originalName ? parsedSpell.flags.ddbimporter.originalName : parsedSpell.name);
            // some spells come from different classes but end up having the same ddb id
            const classIdMatch = (classInfo.definition.name === existingSpell.flags.ddbimporter.dndbeyond.class || spell.id === existingSpell.flags.ddbimporter.dndbeyond.id);
            return existingName === parsedName && classIdMatch;
          });
        const duplicateItem = this.items[duplicateSpell];
        if (!duplicateItem) {
          this.items.push(parsedSpell);
        } else if (spell.alwaysPrepared || parsedSpell.system.preparation.mode === "always"
          || (spell.alwaysPrepared === duplicateItem.alwaysPrepared && parsedSpell.system.preparation.mode === duplicateItem.system.preparation.mode && parsedSpell.prepared && !duplicateItem.prepared)) {
          // if our new spell is always known we overwrite!
          // it's probably domain
          this.items[duplicateSpell] = parsedSpell;
        } else {
          // we'll emit a console message if it doesn't match this case for future debugging
          logger.info(`Duplicate Spell ${spell.definition.name} detected in class ${classInfo.definition.name}.`);
        }
      }
    }

  }

  async getSpecialClassSpells() {
    for (const spell of this.ddb.character.spells.class) {
      if (!spell.definition) continue;
      // If the spell has an ability attached, use that
      let spellCastingAbility = undefined;
      const featureId = DDBHelper.determineActualFeatureId(this.ddb, spell.componentId);
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
      let klass = DDBHelper.getClassFromOptionID(this.ddb, spell.componentId);

      if (!klass) klass = DDBHelper.findClassByFeatureId(this.ddb, spell.componentId);

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

      const abilityModifier = utils.calculateModifier(this.characterAbilities[spellCastingAbility].value);

      // add some data for the parsing of the spells into the data structure
      spell.flags = {
        ddbimporter: {
          dndbeyond: {
            class: (klass) ? klass.definition.name : undefined,
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
            usesSpellSlot: spell.usesSpellSlot,
            forceMaterial: klass?.definition?.name === "Artificer",
          },
        },
        "tidy5e-sheet-kgar": {
          parentClass: (klass) ? klass.definition.name : undefined,
        },
      };

      // Check for duplicate spells, normally domain ones
      // We will import spells from a different class that are the same though
      // as they may come from with different spell casting mods
      const duplicateSpell = this.items.findIndex(
        (existingSpell) =>
          (existingSpell.flags.ddbimporter.originalName ? existingSpell.flags.ddbimporter.originalName : existingSpell.name) === spell.definition.name
          && klass
          && klass.definition.name === existingSpell.flags.ddbimporter.dndbeyond.class
          && spell.usesSpellSlot && existingSpell.flags.ddbimporter.dndbeyond.usesSpellSlot
      );
      if (!this.items[duplicateSpell]) {
        // eslint-disable-next-line no-await-in-loop
        const parsedSpell = await parseSpell(spell, this.character);
        this.items.push(parsedSpell);
      } else if (spell.alwaysPrepared) {
        // if our new spell is always known we overwrite!
        // it's probably domain
        // eslint-disable-next-line no-await-in-loop
        const parsedSpell = await parseSpell(spell, this.character);
        this.items[duplicateSpell] = parsedSpell;
      } else {
        // we'll emit a console message if it doesn't match this case for future debugging
        logger.info(`Duplicate Spell ${spell.definition.name} detected in class ${classInfo.name}.`);
      }
    }
  }

  async handleGrantedSpells(spell, type) {
    if (spell.limitedUse && spell.definition.level !== 0) {
      const dups = this.ddb.character.spells[type].filter((otherSpell) => otherSpell.definition.name === spell.definition.name).length > 1;
      const duplicateSpell = this.items.findIndex(
        (existingSpell) =>
          (existingSpell.flags.ddbimporter.originalName ? existingSpell.flags.ddbimporter.originalName : existingSpell.name) === spell.definition.name
          && existingSpell.flags.ddbimporter.dndbeyond.usesSpellSlot
      );
      if (!dups && !this.items[duplicateSpell]) {
        // also parse spell as non-limited use
        let unlimitedSpell = foundry.utils.duplicate(spell);
        unlimitedSpell.limitedUse = null;
        unlimitedSpell.usesSpellSlot = true;
        unlimitedSpell.alwaysPrepared = true;
        unlimitedSpell.flags.ddbimporter.dndbeyond.usesSpellSlot = true;
        unlimitedSpell.flags.ddbimporter.dndbeyond.granted = true;
        unlimitedSpell.flags.ddbimporter.dndbeyond.lookup = type;
        delete unlimitedSpell.id;
        delete unlimitedSpell.flags.ddbimporter.dndbeyond.id;
        // eslint-disable-next-line no-await-in-loop
        const parsedSpell = await parseSpell(unlimitedSpell, this.character);
        this.items.push(parsedSpell);
      }
    }
  }

  async getRaceSpells() {
    for (const spell of this.ddb.character.spells.race) {
      if (!spell.definition)
        continue;
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
          },
        },
      };

      this.handleGrantedSpells(spell, "race");

      // eslint-disable-next-line no-await-in-loop
      const parsedSpell = await parseSpell(spell, this.character);
      this.items.push(parsedSpell);
    }
  }

  async getFeatSpells() {
    for (const spell of this.ddb.character.spells.feat) {
      if (!spell.definition)
        continue;
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
          },
        },
      };

      this.handleGrantedSpells(spell, "feat");

      // eslint-disable-next-line no-await-in-loop
      const parsedSpell = await parseSpell(spell, this.character);
      this.items.push(parsedSpell);
    }
  }

  async getBackgroundSpells() {
    if (!this.ddb.character.spells.background) this.ddb.character.spells.background = [];
    for (const spell of this.ddb.character.spells.background) {
      if (!spell.definition)
        continue;
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
          },
        },
      };

      this.handleGrantedSpells(spell, "background");

      // eslint-disable-next-line no-await-in-loop
      const parsedSpell = await parseSpell(spell, this.character);
      this.items.push(parsedSpell);
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

    fixSpells(this.ddb, this.items);

    return this.items.sort((a, b) => a.name.localeCompare(b.name));
  }
}
