import { DICTIONARY, SETTINGS } from "../../config/_module.mjs";
import { logger, utils, CompendiumHelper, DDBSources } from "../../lib/_module.mjs";
import { baseSpellEffect, spellEffectAdjustment } from "../../effects/specialSpells.js";
import DDBCompanionFactory from "../companions/DDBCompanionFactory.mjs";
import { DDBSpellActivity } from "../activities/_module.mjs";
import { DDBSpellEnricher, mixins } from "../enrichers/_module.mjs";
import DDBSummonsManager from "../companions/DDBSummonsManager.mjs";
import { DDBTable, DDBReferenceLinker, DDBModifiers, DDBDataUtils, SystemHelpers } from "../lib/_module.mjs";
import { ChangeHelper } from "../enrichers/effects/_module.mjs";

export default class DDBSpell extends mixins.DDBActivityFactoryMixin {

  _generateDataStub() {
    this.data = {
      _id: utils.namedIDStub(this.name, { prefix: this.namePrefix, postfix: this.namePostfix }),
      type: "spell",
      system: SystemHelpers.getTemplate("spell"),
      effects: [],
      name: this.name,
      flags: {
        ddbimporter: {
          id: this.spellData.id,
          definitionId: this.ddbDefinition.id,
          entityTypeId: this.spellData.entityTypeId,
          dndbeyond: this.spellData.flags.ddbimporter.dndbeyond,
          originalName: this.originalName,
          sources: this.ddbDefinition.sources,
          tags: this.ddbDefinition.tags,
          version: CONFIG.DDBI.version,
          is2014: this.is2014,
          is2024: !this.is2014,
          addSpellEffects: this.addSpellEffects,
          legacy: this.legacy,
        },
        "midi-qol": {
          removeAttackDamageButtons: "default",
        },
        midiProperties: {
          confirmTargets: "default",
          magicdam: true,
          magiceffect: true,
        },
        "spell-class-filter-for-5e": this.spellData.flags["spell-class-filter-for-5e"],
        "tidy5e-sheet": this.spellData.flags["tidy5e-sheet"],
      },
    };

    if (this.legacyPostfix && this.is2014) {
      this.data.name += " (Legacy)";
    }
  }

  getCustomName(data) {
    if (!this.rawCharacter
      || (this.rawCharacter && !foundry.utils.hasProperty(this.rawCharacter, "flags.ddbimporter.dndbeyond.characterValues"))
    ) return null;
    const characterValues = this.rawCharacter.flags.ddbimporter.dndbeyond.characterValues;
    const customValue = characterValues.filter((value) => value.valueId == data.id && value.valueTypeId == data.entityTypeId);

    if (customValue) {
      const customName = customValue.find((value) => value.typeId == 8);

      if (customName) {
        data.name = customName.vale;
        return customName.value;
      }
      if (customName) return customName.value;
    }
    return null;
  }


  getName() {
    // spell name
    const customName = this.getCustomName(this.spellData);
    if (customName) {
      return utils.nameString(customName);
    } else if (this.nameOverride) {
      return utils.nameString(this.nameOverride);
    } else {
      return utils.nameString(this.ddbDefinition.name);
    }
  }

  async init() {
    await this.loadEnricher();
    if (this.itemCompendium) {
      await this.itemCompendium.getIndex({
        fields: [
          "name",
          "system.rarity",
          "system.type.value",
        ],
      });
    }
  }

  // eslint-disable-next-line complexity
  constructor({
    ddbData, spellData, rawCharacter = null, namePrefix = null, namePostfix = null, isGeneric = null, updateExisting = null,
    limitedUse = null, forceMaterial = null, klass = null, lookup = null, lookupName = null, ability = null,
    spellClass = null, dc = null, overrideDC = null, nameOverride = null, isHomebrew = null, enricher = null,
    generateSummons = null, notifier = null, healingBoost = null, cantripBoost = null,
  } = {}) {
    super({
      enricher,
      activityGenerator: DDBSpellActivity,
      documentType: "spell",
      notifier,
    });

    this.notifier = notifier;
    this.ddbData = ddbData;
    this.spellData = spellData;
    this.ddbDefinition = spellData.definition;
    this.rawCharacter = rawCharacter;
    this.namePrefix = namePrefix;
    this.namePostfix = namePostfix;
    this.nameOverride = nameOverride ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.nameOverride");
    this.originalName = utils.nameString(this.ddbDefinition.name);
    this.name = this.getName(this.spellData, this.rawCharacter);
    this.data = {};
    this.activities = [];
    this.activityTypes = [];
    this.activityType = null;
    this.additionalActivities = [];
    this.healingParts = [];

    this.isGeneric = isGeneric ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.generic");
    this.addSpellEffects = this.isGeneric
      ? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-spell-effects")
      : game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-add-spell-effects");

    this.legacyPostfix = this.isGeneric
      ? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-legacy-postfix")
      : !game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-remove-2024");
    this.updateExisting = updateExisting ?? this.isGeneric
      ? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing")
      : false;
    this.pactSpellsPrepared = game.settings.get("ddb-importer", "pact-spells-prepared");
    this.limitedUse = limitedUse ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.limitedUse");
    this.forceMaterial = forceMaterial ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.forceMaterial");
    this.forcePact = foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.forcePact");
    this.spellClass = klass ?? spellClass ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.class");
    this.lookup = lookup ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.lookup");
    this.lookupName = lookupName ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.lookupName");
    this.ability = ability ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.ability");
    this.school = DICTIONARY.spell.schools.find((s) => s.name === this.ddbDefinition.school.toLowerCase());
    this.dc = dc ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.dc");
    this.overrideDC = overrideDC ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.overrideDC");
    this.isHomebrew = isHomebrew ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.homebrew");

    this.onlyPactMagic = this.ddbData?.character?.classes?.length === 1
      && this.ddbData.character.classes[0].definition.name === "Warlock";

    const sourceIds = this.ddbDefinition.sources.map((sm) => sm.sourceId);
    this.legacy = CONFIG.DDB.sources.some((ddbSource) =>
      sourceIds.includes(ddbSource.id)
      && DICTIONARY.sourceCategories.legacy.includes(ddbSource.sourceCategoryId),
    );
    this.is2014 = this.ddbDefinition.isLegacy
      && this.ddbDefinition.sources.some((s) => Number.isInteger(s.sourceId) && s.sourceId < 145);

    this._generateDataStub();

    this.itemCompendium = CompendiumHelper.getCompendiumType("item", false);
    this.enricher = enricher ?? new DDBSpellEnricher({ activityGenerator: DDBSpellActivity, notifier: this.notifier });
    this.isCompanionSpell = DICTIONARY.companions.COMPANION_SPELLS.includes(this.originalName);
    this.isCRSummonSpell = DICTIONARY.companions.CR_SUMMONING_SPELLS.includes(this.originalName);
    this.isSummons = this.isCompanionSpell || this.isCRSummonSpell;
    this.generateSummons = this.isGeneric
      || (generateSummons ?? game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-create-companions"));
    this.DDBCompanionFactory = null; // lazy init

    this.isCantrip = this.ddbDefinition.level === 0;
    const boost = cantripBoost ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.cantripBoost");
    this.cantripBoost = this.isCantrip && boost;

    const boostHeal = healingBoost ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.healingBoost");
    this.healingBonus = boostHeal ? ` + ${boostHeal} + @item.level` : "";

  }


  _generateProperties() {
    if (this.ddbDefinition.components.includes(1)) this.data.system.properties.push("vocal");
    if (this.ddbDefinition.components.includes(2)) this.data.system.properties.push("somatic");
    if (this.ddbDefinition.components.includes(3) || this.forceMaterial) {
      this.data.system.properties.push("material");
    }
    if (this.ddbDefinition.ritual) this.data.system.properties.push("ritual");
    if (this.ddbDefinition.concentration) this.data.system.properties.push("concentration");
  }

  _generateMaterials() {
    // this is mainly guessing
    if (this.ddbDefinition.componentsDescription && this.ddbDefinition.componentsDescription.length > 0) {
      let cost = 0;
      let matches = (/([\d.,]+)\s*gp/i).exec(this.ddbDefinition.componentsDescription);
      if (matches) {
        cost = parseInt(matches[1].replace(/,|\./g, ""));
      }

      this.data.system.materials = {
        value: this.ddbDefinition.componentsDescription,
        consumed: this.ddbDefinition.componentsDescription.toLowerCase().indexOf("consume") !== -1,
        cost: cost,
        supply: 0,
      };
    } else {
      this.data.system.materials = {
        value: "",
        consumed: false,
        cost: 0,
        supply: 0,
      };
    }
  }

  _generateClassPreparationMode() {
    const classPrepMode = utils.findByProperty(
      DICTIONARY.spell.preparationModes,
      "name",
      this.spellClass,
    );

    if (this.spellData.restriction === "As Ritual Only"
      || this.spellData.castOnlyAsRitual
      || (this.spellData.ritualCastingType !== null && this.spellClass !== "Warlock" && !this.is2014)
    ) {
      this.data.system.preparation.mode = "ritual";
      this.data.system.preparation.prepared = false;
    } else if (!this.spellData.usesSpellSlot && this.ddbDefinition.level !== 0) {
      // some class features such as druid circle of stars grants x uses of a spell
      // at the lowest level. for these we add as an innate.
      this.data.system.preparation.mode = "innate";
    } else if (this.spellData.alwaysPrepared) {
      this.data.system.preparation.mode = this.forcePact ? "pact" : "always";
    } else if (this.data.system.preparation.mode && classPrepMode) {
      this.data.system.preparation.mode = classPrepMode.value;
    }
    // Warlocks should use Pact spells
    // but lets mark level 0 as regular spells so they show up as cantrips
    if (this.data.system.preparation.mode === "pact" && this.isCantrip) {
      this.data.system.preparation.mode = "prepared";
      this.data.system.preparation.prepared = true;
    } else if (this.data.system.preparation.mode === "pact" && this.pactSpellsPrepared) {
      this.data.system.preparation.prepared = true;
    }
  }

  // eslint-disable-next-line complexity
  _generateSpellPreparationMode() {
    // default values
    this.data.system.preparation = {
      mode: "prepared",
      // If always prepared mark as such, if not then check to see if prepared, mark cantrips as prepared
      prepared: this.spellData.alwaysPrepared || this.spellData.prepared || this.isCantrip,
    };

    // handle classSpells
    const featureClass = this.lookup === "classFeature"
      && this.spellClass;

    if (this.lookup === "classSpell" || featureClass) {
      this._generateClassPreparationMode();
    } else if (this.lookup === "race" && this.ddbDefinition.level !== 0) {
      // set race spells as innate
      this.data.system.preparation.mode = "innate";
      if (this.spellData.usesSpellSlot) {
        // some racial spells allow the spell to also be added to spell lists
        this.data.system.preparation.mode = this.onlyPactMagic ? "pact" : "always";
      }
    } else if (
      // Warlock Mystic Arcanum are passed in as Features
      this.lookupName.startsWith("Mystic Arcanum")
    ) {
      // these have limited uses (set with getUses())
      this.data.system.preparation.mode = "pact";
      this.data.system.preparation.prepared = false;
    } else if (this.lookup === "item " && this.ddbDefinition.level !== 0) {
      this.data.system.preparation.mode = "prepared";
      this.data.system.preparation.prepared = false;
    } else {
      // If spell doesn't use a spell slot and is not a cantrip, mark as always preped
      let always = !this.spellData.usesSpellSlot && this.ddbDefinition.level !== 0;
      let ritualOnly = this.spellData.ritualCastingType !== null || this.spellData.castOnlyAsRitual; // e.g. Book of ancient secrets & totem barb
      if (always && ritualOnly) {
        // in this case we want the spell to appear in the spell list unprepared
        this.data.system.preparation.mode = "ritual";
        this.data.system.preparation.prepared = false;
      } else if (always) {
        // these spells are always prepared, and have a limited use that's
        // picked up by getUses() later
        // this was changed to "atwill"
        this.data.system.preparation.mode = "atwill";
        this.data.system.preparation.prepared = true;
      }
      if (["classFeature", "subclassFeature", "feat"].includes(this.lookup)) {
        if (this.spellData.alwaysPrepared) {
          this.data.system.preparation.mode = "always";
        }
      }
    }
  }

  async _generateDescription() {
    let description = await DDBTable.generateTable({
      parentName: this.data.name,
      html: this.ddbDefinition.description,
      updateExisting: this.updateExisting,
      notifier: this.notifier,
    });
    this.data.system.description = {
      value: DDBReferenceLinker.parseTags(description),
      chat: "",
    };
  }

  _generateActivation() {
    // for newer override spells, activation is at higher level
    const activation = this.spellData.activation ?? this.ddbDefinition.activation;
    const activationType = DICTIONARY.spell.activationTypes.find(
      (type) => type.activationType === activation.activationType,
    );
    if (activationType && activation.activationTime) {
      this.data.system.activation = {
        type: activationType.value,
        value: activation.activationTime,
        condition: this.ddbDefinition.castingTimeDescription ?? "",
      };
    } else {
      this.data.system.activation = {
        type: "action",
        value: 1,
        condition: this.ddbDefinition.castingTimeDescription ?? "",
      };
    }
  }

  _generateDuration() {
    if (this.ddbDefinition.duration) {
      let units = "";
      if (this.ddbDefinition.duration.durationUnit !== null) {
        units = this.ddbDefinition.duration.durationUnit.toLowerCase();
      } else {
        units = this.ddbDefinition.duration.durationType.toLowerCase().substring(0, 4);
      }
      this.data.system.duration = {
        concentration: this.ddbDefinition.concentration,
        value: this.ddbDefinition.duration.durationInterval ?? "",
        units: units,
      };
    }
  }

  /**
   * Check if the spell targets creatures.
   * @returns {boolean} true if the spell targets creatures, false otherwise.
   */
  targetsCreature() {
    const creature = /You touch (?:a|one) (?:willing |living )?creature|affecting one creature|creature you touch|a creature you|creature( that)? you can see|interrupt a creature|would strike a creature|creature of your choice|creature or object within range|cause a creature|creature must be within range|a creature in range/gi;
    const creaturesRange = /(humanoid|monster|creature|target|beast)(s)? (or loose object )?(of your choice )?(that )?(you can see )?within range/gi;
    const targets = /spell attack against the target|at a target in range/gi;
    return this.ddbDefinition.description.match(creature)
      || this.ddbDefinition.description.match(creaturesRange)
      || this.ddbDefinition.description.match(targets);
  }

  /**
   * Uses regex magic to try and determine the number of creatures affected
   * @returns {number|null} The maximum number of creatures affected, or null if no valid number is found
   */
  _getTargetValue() {
    const numCreatures = /(?!At Higher Levels.*)(\w*) (?:falling )?(?:willing )?(?:Bloodied )?(creature(?:s)?|target|monster|celestial|fiend|fey|corpse(?:s)? of|humanoid)(?!.*you have animated)/gim;
    const targets = [...this.ddbDefinition.description.matchAll(numCreatures)];
    const targetValues = targets
      .filter((target) => {
        return DICTIONARY.numbers.some((n) => n.natural === target[1].toLowerCase());
      })
      .map((target) => DICTIONARY.numbers.find((n) => n.natural === target[1].toLowerCase()).num);

    if (targetValues.length > 0) {
      return Math.max(...targetValues);
    } else {
      return null;
    }
  }


  /**
   * Generates the target details for the spell.
   * @private
   */
  // eslint-disable-next-line complexity
  _generateTarget() {
    let target = {
      prompt: true,
      affects: {
        count: "",
        type: "",
        choice: false,
        special: "",
      },
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
    };

    const thickReg = new RegExp(/ (\d*)(?:[ -])foot(?:[ -])(thick|wide)/);
    const thickMatch = thickReg.exec(this.ddbDefinition.description);
    if (thickMatch && thickMatch[1] > 5) {
      target.template.width = parseInt(thickMatch[1]);
    }

    const heightReg = new RegExp(/ (\d*)(?:[ -])foot(?:[ -])(tall|high)/);
    const heightMatch = heightReg.exec(this.ddbDefinition.description);
    if (heightMatch && heightMatch[1] > 5) {
      target.template.height = parseInt(heightMatch[1]);
    }

    // if spell is an AOE effect get some details
    if (this.ddbDefinition.range.aoeType && this.ddbDefinition.range.aoeValue) {
      const type = this.ddbDefinition.range.aoeType.toLowerCase();
      target.template.size = parseInt(this.ddbDefinition.range.aoeValue);
      target.template.type = type === "emanation" ? "radius" : type;
      this.data.system.target = target;
      return;
    }

    // does the spell target a creature?
    const targetsCreatures = this.targetsCreature();

    if (targetsCreatures) {
      const count = this._getTargetValue();
      target.affects.count = count ? `${count}` : "";
    }

    const rangeValue = foundry.utils.getProperty(this.ddbDefinition, "range.rangeValue");

    switch (this.ddbDefinition.range.origin) {
      case "Touch":
        if (targetsCreatures) {
          target.affects.count = "1";
          target.affects.type = "creature";
        }
        break;
      case "Self": {
        const dmgSpell = this.ddbDefinition.modifiers.some((mod) => mod.type === "damage");
        if (dmgSpell && rangeValue) {
          this.data.system.range.value = rangeValue;
          this.data.system.range.units = "ft";
          target.template.type = "radius";
        } else if (dmgSpell) {
          target.affects.type = "creature";
        } else {
          target.affects.type = "self";
        }
        break;
      }
      case "None":
        target.affects.type = "none";
        break;
      case "Ranged":
        if (targetsCreatures) target.affects.type = "creature";
        break;
      case "Feet":
        if (targetsCreatures) target.affects.type = "creature";
        break;
      case "Miles":
        if (targetsCreatures) target.affects.type = "creature";
        break;
      case "Sight":
      case "Special":
        this.data.system.range.units = "spec";
        break;
      case "Any":
        this.data.system.range.units = "any";
        break;
      case undefined:
        target.affects.type = "";
        break;
      // no default
    }

    // wall type spell?
    if (this.ddbDefinition.name.includes("Wall")) {
      target.template.type = "wall";
      target.template.units = "ft";

      if (this.ddbDefinition.description.includes("ten 10-foot-")) {
        target.template.size = 100;
      } else {
        const wallReg = new RegExp(/ (\d*) feet long/);
        const matches = wallReg.exec(this.ddbDefinition.description);
        if (matches) {
          target.template.size = parseInt(matches[1]);
        }
      }
    }

    this.data.system.target = target;
  }

  #specialRange() {
    if (this.isGeneric || !this.spellClass || !this.rawCharacter) return;

    // Improved Illusions - at the time of this implemented, this was not handled
    // automatically by DDB. This may change in the future, and this will need to be removed.
    // if range 10+ then illusion range increases by 60
    const hasIllusionSavant = DDBDataUtils.hasClassFeature({
      ddbData: this.ddbData,
      featureName: "Improved Illusions",
      className: "Wizard",
      subClassName: "Illusionist",
    });
    if (hasIllusionSavant && this.school.id === "ill" && Number.parseInt(this.data.system.range.value) >= 10) {
      this.data.system.range.value = Number.parseInt(this.data.system.range.value) + 60;
    }

  }

  _generateRange() {
    let value = this.ddbDefinition.range.rangeValue ?? null;
    let units = "ft";

    switch (this.ddbDefinition.range.origin) {
      case "Touch":
        value = null;
        units = "touch";
        break;
      case "Self":
        value = null;
        units = "self";
        break;
      case "None":
        units = "none";
        break;
      case "Ranged":
        units = "ft";
        break;
      case "Feet":
        units = "ft";
        break;
      case "Miles":
        units = "ml";
        break;
      case "Sight":
      case "Special":
        units = "spec";
        break;
      case "Any":
        units = "any";
        break;
      case undefined:
        units = null;
        break;
      // no default
    }

    this.data.system.range = {
      value: value,
      units: units,
    };

    this.#specialRange();
  }

  _generateUses() {
    this.data.system.uses = {
      spent: null,
      max: "",
      recovery: [],
    };

    // we check this, as things like items have useage attached to the item, not spell
    const limitedUse = this.limitedUse ?? this.spellData.limitedUse;

    if (!limitedUse) return;
    const resetType = DICTIONARY.resets.find((reset) => reset.id == limitedUse.resetType);
    if (!resetType) {
      logger.warn("Unknown reset type", {
        resetType: limitedUse.resetType,
        spell: this,
      });
      return;
    }

    if (limitedUse.maxUses || limitedUse.statModifierUsesId || limitedUse.useProficiencyBonus) {
      let maxUses = (limitedUse.maxUses && limitedUse.maxUses !== -1) ? limitedUse.maxUses : "";

      if (limitedUse.statModifierUsesId) {
        const ability = DICTIONARY.actor.abilities.find(
          (ability) => ability.id === limitedUse.statModifierUsesId,
        ).value;

        switch (limitedUse.operator) {
          case 2: {
            // maxUses *= character.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
            maxUses = `${maxUses} * @abilities.${ability}.mod`;
            break;
          }
          case 1:
          default:
            // maxUses += character.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
            maxUses = `${maxUses} + @abilities.${ability}.mod`;
        }
      }

      if (limitedUse.useProficiencyBonus) {
        switch (limitedUse.proficiencyBonusOperator) {
          case 2: {
            // maxUses *= character.system.attributes.prof;
            maxUses = `${maxUses} * @prof`;
            break;
          }
          case 1:
          default:
            // maxUses += character.system.attributes.prof;
            maxUses = `${maxUses} + @prof`;
        }
      }

      const finalMaxUses = (maxUses !== "") ? maxUses : null;

      this.data.system.uses = {
        spent: limitedUse.numberUsed ?? null,
        max: `${finalMaxUses}`,
        recovery: resetType
          ? [{
            // KNOWN_ISSUE_4_0: if charges returned here maybe don't?
            period: resetType.value,
            type: 'recoverAll',
          }]
          : [],
      };
    }
  }

  #generateHealingParts() {
    const activityParser = new DDBSpellActivity({
      type: "heal",
      ddbParent: this,
      healingBoost: this.healingBoost,
      cantripBoost: this.cantripBoost,
    });

    const heals = this.ddbDefinition.modifiers.filter((mod) =>
      mod.type === "bonus"
      && ["temporary-hit-points", "hit-points"].includes(mod.subType),
    );

    heals.forEach((heal) => {
      let healingPart = {
        part: null,
        chatFlavor: null,
      };
      const restrictionText = heal.restriction && heal.restriction !== "" ? heal.restriction : "";
      if (restrictionText !== "") {
        healingPart.chatFlavor = `Restriction: ${restrictionText}`;
      }

      const healValue = (heal.die.diceString) ? heal.die.diceString : heal.die.fixedValue;
      const diceString = heal.usePrimaryStat
        ? `${healValue} + @mod${this.healingBonus}`
        : `${healValue}${this.healingBonus}`;
      if (diceString && diceString.trim() !== "" && diceString.trim() !== "null") {
        const damage = activityParser.buildDamagePart({
          damageString: diceString,
          type: heal.subType === "hit-points" ? "healing" : "temphp",
        });
        healingPart.part = damage;
        this.healingParts.push(healingPart);
      }
    });
  }

  async #generateSummons() {
    if (this.enricher.activity?.generateSummons) {
      const summons = await this.enricher.activity.summonsFunction({
        ddbParser: this,
        document: this.data,
        raw: this.ddbDefinition.description,
        text: this.data.system.description,
      });

      await DDBSummonsManager.addGeneratedSummons(summons);
    }

    if (!this.isSummons) return;
    this.ddbCompanionFactory = new DDBCompanionFactory(this.ddbDefinition.description, {
      type: "spell",
      originDocument: this.data,
      is2014: this.is2014,
      notifier: this.notifier,
    });
    await this.ddbCompanionFactory.parse();
    // always update compendium imports, but respect player import disable
    if (this.isGeneric || game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-create-companions")) {
      await this.ddbCompanionFactory.updateOrCreateCompanions();
    }

    logger.debug(`parsed companions for ${this.data.name}`, {
      factory: this.ddbCompanionFactory,
      parsed: this.ddbCompanionFactory.companions,
    });
  }

  /** @override */
  _getAttackActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const itemOptions = foundry.utils.mergeObject({
      modRestrictionFilterExcludes: this.ddbDefinition.requiresSavingThrow ? "Save" : null,
    }, options);

    return super._getAttackActivity({ name, nameIdPostfix }, itemOptions);
  }

  /** @override */
  _getActivitiesType() {
    if (this.isSummons) {
      return "summon";
    }
    if (this.ddbDefinition.requiresSavingThrow && !this.ddbDefinition.requiresAttackRoll) {
      return "save";
    } else if ((this.ddbDefinition.tags.includes("Damage") && this.ddbDefinition.requiresAttackRoll)
      || this.ddbDefinition.attackType !== null
    ) {
      if (this.ddbDefinition.requiresSavingThrow) {
        this.additionalActivities.push({
          type: "save",
          options: {
            generateDamage: true,
            includeBaseDamage: false,
            modRestrictionFilter: "Save",
          },
        });
      }
      return "attack";
    } else if (this.ddbDefinition.tags.includes("Damage")) {
      return "damage";
    } else if (this.ddbDefinition.tags.includes("Healing") && this.healingParts.length === 0) {
      return "utility"; // e.g. things like lesser restoration
    } else if (this.ddbDefinition.tags.includes("Buff")) {
      return "utility";
    } else if (this.ddbDefinition.modifiers.some((mod) => mod.type === "damage")) {
      return "damage";
    } else if (this.healingParts.length > 0) {
      return "heal";
    } else if (this.enricher.effects?.length > 0) {
      return "utility";
    }
    // KNOWN_ISSUE_4_0: Enchants like for magic weapon etc
    // KNOWN_ISSUE_4_0: Summoning
    return undefined;
  }

  /** @override */
  async _generateActivity({ hintsOnly = false, name = null, nameIdPostfix = null, typeOverride = null, typeFallback = "utility" } = {},
    optionsOverride = {},
  ) {

    const activity = super._generateActivity({
      hintsOnly,
      name,
      nameIdPostfix,
      typeOverride,
      typeFallback, // spells should always generate an activity
    }, optionsOverride);

    if (!activity) return undefined;
    const activityData = foundry.utils.getProperty(this.data, `system.activities.${activity}`);

    if (activityData.type !== "summon") return activity;
    if (this.isCompanionSpell)
      await this.ddbCompanionFactory.addCompanionsToDocuments([], activityData);
    else if (DICTIONARY.companions.CR_SUMMONING_SPELLS.includes(this.originalName))
      await this.ddbCompanionFactory.addCRSummoning(activityData);
    return activity;
  }

  #addConditionEffects() {
    if ((this.ddbDefinition.conditions ?? []).length === 0) return;

    for (const data of this.ddbDefinition.conditions.filter((c) => c.type === 1)) {
      const condition = DICTIONARY.actor.damageAdjustments
        .filter((type) => type.type === 4)
        .find((type) => type.id === data.conditionId);
      if (condition) {
        let effect = baseSpellEffect(this.data, `${this.data.name}: ${condition.name}`);
        effect._id = foundry.utils.randomID();

        // KNOWN_ISSUE_4_0: add duration
        ChangeHelper.addStatusEffectChange({ effect, statusName: condition.foundryValue });
        this.data.effects.push(effect);
      }
    }
  }

  async _applyEffects() {
    // KNOWN_ISSUE_4_0: once spell effects adjusted
    await spellEffectAdjustment(this.data, this.addSpellEffects);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.effectsApplied", true);

    if (this.data.effects.length === 0) this.#addConditionEffects();
    if (this.enricher.clearAutoEffects) this.data.effects = [];
    const effects = await this.enricher.createEffects();
    this.data.effects.push(...effects);
    this.enricher.createDefaultEffects();
    this._activityEffectLinking();
  }

  #addHealAdditionalActivities() {
    const healingParts = this.activityType === "heal"
      ? foundry.utils.deepClone(this.healingParts).slice(1)
      : foundry.utils.deepClone(this.healingParts);
    for (const part of healingParts) {
      this.additionalActivities.push({
        type: "heal",
        options: {
          generateDamage: false,
          includeBaseDamage: false,
          generateHealing: true,
          healingPart: part,
        },
      });
    }
  }

  async _generateAdditionalActivities() {
    if (this.additionalActivities.length === 0) return;
    logger.debug(`Additional Spell Activities for ${this.data.name}`, this.additionalActivities);
    let i = 0;
    for (const activityData of this.additionalActivities) {
      i++;
      const id = await this._generateActivity({
        hintsOnly: false,
        name: activityData.name,
        nameIdPostfix: i,
        typeOverride: activityData.type,
      }, activityData.options);
      logger.debug(`Generated additional Activity with id ${id}`, {
        this: this,
        activityData,
        id,
      });
    }
  }

  getRangeAdjustmentMultiplier() {
    if (!this.ddbParser?.ddbData) return 1;
    const rangeAdjustmentMods = DDBModifiers.filterBaseModifiers(this.ddbParser.ddbData, "bonus", { subType: "spell-attack-range-multiplier" }).filter((modifier) => modifier.isGranted);

    const multiplier = rangeAdjustmentMods.reduce((current, mod) => {
      if (Number.isInteger(mod.fixedValue) && mod.fixedValue > current) {
        current = mod.fixedValue;
      } else if (Number.isInteger(mod.value) && mod.value > current) {
        current = mod.value;
      }
      return current;
    }, 1);

    return multiplier;
  }

  adjustRange(multiplier, spell) {
    // this needs to be adjusted and implemented for 2024 and 2014, not currently called
    if (this.data.spell.system.actionType === "rsak" && Number.isInteger(spell.system.range?.value)) {
      foundry.utils.setProperty(spell, "system.range.value", spell.system.range.value * multiplier);
    }
    return spell;
  }

  async parse() {
    this.data.system.level = this.ddbDefinition.level;
    this.data.system.school = (this.school) ? this.school.id : null;
    this.data.system.source = DDBSources.parseSource(this.ddbDefinition);
    this.data.system.source.rules = this.is2014 ? "2014" : "2024";

    if (this.spellClass) {
      this.data.system.sourceClass = this.spellClass;
    }
    this._generateProperties();
    this._generateMaterials();
    this._generateSpellPreparationMode();
    await this._generateDescription();
    this._generateActivation();
    this._generateDuration();
    this._generateRange();
    this._generateTarget();
    this._generateUses();
    this.#generateHealingParts(); // used in activity

    await this.#generateSummons();

    if (!this.enricher.documentStub?.stopDefaultActivity)
      await this._generateActivity();

    if (!this.enricher.activity?.stopHealSpellActivity)
      this.#addHealAdditionalActivities();
    if (!this.enricher.documentStub?.stopSpellAutoAdditionalActivities)
      await this._generateAdditionalActivities();
    await this.enricher.addAdditionalActivities(this);

    // TO DO: activities
    // this.data.system.save = getSave(this.spellData);

    await this._applyEffects();

    // ensure the spell ability id is correct for the spell
    // this.data.system.spellcasting = {
    // progression: spellProgression.value,
    // ability: spellCastingAbility,
    if (this.rawCharacter && !this.spellClass) {
      this.data.system.ability = [this.ability];
      // if (this.data.system.save.scaling == "spell") {
      //   this.data.system.save.scaling = this.ability;
      // }
    }

    if (this.ddbData) {
      DDBDataUtils.addCustomValues(this.ddbData, this.data);
    }

    this.enricher.addDocumentOverride();
    this.data.system.identifier = utils.referenceNameString(`${this.data.name.toLowerCase()}${this.is2014 ? " - legacy" : ""}`);
  }

  static async parseSpell(data, character,
    { namePrefix = null, namePostfix = null, ddbData = null, enricher = null, generateSummons = null, notifier = null } = {},
  ) {
    const spell = new DDBSpell({
      ddbData,
      spellData: data,
      rawCharacter: character,
      namePrefix,
      namePostfix,
      enricher,
      generateSummons,
      notifier,
    });
    await spell.init();
    await spell.parse();

    return spell.data;
  }

  /** @override */
  _getHealActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const spellOptions = foundry.utils.mergeObject({
      healingPart: this.healingParts[0],
    }, options);

    return super._getHealActivity({ name, nameIdPostfix }, spellOptions);
  }

}
