import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import parseTemplateString from "../../lib/DDBTemplateStrings.js";
import { generateEffects } from "../../effects/effects.js";
import DDBSimpleMacro from "../../effects/DDBSimpleMacro.js";
import DDBFeatureActivity from "./DDBFeatureActivity.js";
import DDDFeatureEnricher from "../enrichers/DDBFeatureEnricher.js";
import DDBBasicActivity from "../enrichers/DDBBasicActivity.js";
import SETTINGS from "../../settings.js";

export default class DDBBaseFeature {

  static LEVEL_SCALE_EXCLUSION = [
    "Fire Rune",
    "Cloud Rune",
    "Stone Rune",
    "Frost Rune",
    "Hill Rune",
    "Storm Rune",
    "Drake Companion: Summon",
    "Drake Companion: Command",
    "Drake Companion",
  ];

  static LEVEL_SCALE_INFUSIONS = [
    "Unarmed Strike",
    "Arms of the Astral Self (WIS)",
    "Arms of the Astral Self (DEX)",
    "Arms of the Astral Self (DEX/STR)",
    "Body of the Astral Self",
    "Starry Form: Archer",
    "Sneak Attack",
  ];

  static NATURAL_WEAPONS = [
    "Bite",
    "Claw",
    "Claws",
    "Claws",
    "Fangs",
    "Gore",
    "Sting",
    "Talon",
    "Talons",
    "Trunk",
  ];

  _init() {
    logger.debug(`Generating Base Feature ${this.ddbDefinition.name}`);
  }

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: DDBHelper.getName(this.ddbData, this.ddbDefinition, this.rawCharacter),
      type: this.documentType,
      system: utils.getTemplate(this.documentType),
      flags: {
        ddbimporter: {
          id: this.ddbDefinition.id,
          entityTypeId: this.ddbDefinition.entityTypeId,
          action: this.isAction,
          componentId: this.ddbDefinition.componentId,
          componentTypeId: this.ddbDefinition.componentTypeId,
          originalName: this.originalName,
          type: this.tagType,
          isCustomAction: this.ddbDefinition.isCustomAction,
          is2014: this.is2014,
          is2024: !this.is2014,
        },
        infusions: { infused: false },
        obsidian: {
          source: {
            type: this.tagType,
          },
        },
      },
    };
    // Spells will still have activation/duration/range/target,
    // weapons will still have range & damage (1 base part & 1 versatile part),
    // and all items will still have limited uses (but no consumption)
    this.data.system.identifier = this.identifier;
  }

  _prepare() {
    if (this.ddbDefinition.infusionFlags) {
      foundry.utils.setProperty(this.data, "flags.infusions", this.ddbDefinition.infusionFlags);
    }

    this.excludedScale = DDBBaseFeature.LEVEL_SCALE_EXCLUSION.includes(this.ddbDefinition.name)
      || DDBBaseFeature.LEVEL_SCALE_EXCLUSION.includes(this.data.name);
    this.levelScaleInfusion = DDBBaseFeature.LEVEL_SCALE_INFUSIONS.includes(this.ddbDefinition.name)
      || DDBBaseFeature.LEVEL_SCALE_INFUSIONS.includes(this.data.name);
    this.scaleValueLink = DDBHelper.getScaleValueString(this.ddbData, this.ddbDefinition).value;
    this.useScaleValueLink = !this.excludedScale
      && this.scaleValueLink
      && this.scaleValueLink !== "{{scalevalue-unknown}}";
  }

  constructor({
    ddbData, ddbDefinition, type, source, documentType = "feat", rawCharacter = null, noMods = false, activityType = null,
  } = {}) {
    this.ddbData = ddbData;
    this.rawCharacter = rawCharacter;
    this.ddbFeature = ddbDefinition;
    this.ddbDefinition = ddbDefinition.definition ?? ddbDefinition;
    this.name = utils.nameString(this.ddbDefinition.name);
    this.originalName = this.ddbData
      ? DDBHelper.getName(this.ddbData, this.ddbDefinition, this.rawCharacter, false)
      : utils.nameString(this.ddbDefinition.name);
    this.identifier = utils.referenceNameString(`${this.name.toLowerCase()}${this.is2014 ? " - legacy" : ""}`);
    this.type = type;
    this.source = source;
    this.isAction = false;
    this.excludedScale = false;
    this.levelScaleInfusion = false;
    this.scaleValueLink = "";
    this.useScaleValueLink = false;
    this.documentType = documentType;
    this.tagType = "other";
    this.activities = [];
    this.data = {};
    this.noMods = noMods;
    this._init();
    this.snippet = "";
    this.description = "";
    this.resourceCharges = null;
    this.activityType = activityType;

    // this._attacksAsFeatures = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-actions-as-features");

    this._generateDataStub();

    // Grim Hollow puts points in names. WHY
    const namePointRegex = /(.*) \((\d) points?\)/i;
    const nameMatch = this.name.match(namePointRegex);
    if (nameMatch) {
      this.data.name = nameMatch[1];
      this.resourceCharges = Number.parseInt(nameMatch[2]);
    }

    this._prepare();
    this.data.system.source = this.source;

    this.enricher = new DDDFeatureEnricher({
      ddbParser: this,
    });

    this.naturalWeapon = DDBBaseFeature.NATURAL_WEAPONS.includes(this.originalName);

    this.isCompanionFeature = this._isCompanionFeature();
    this.isCompanionFeatureOption = this._isCompanionFeatureOption();

    this.is2014 = this.ddbDefinition.isLegacy
      && this.ddbDefinition.sources.some((s) => Number.isInteger(s.sourceId) && s.sourceId < 145);
  }

  _getClassFeatureDescription() {
    if (!this.ddbData) return "";
    const componentId = this.ddbDefinition.componentId;
    const componentTypeId = this.ddbDefinition.componentTypeId;

    const findFeatureKlass = this.ddbData.character.classes
      .find((cls) => cls.classFeatures.find((feature) =>
        feature.definition.id == componentId
        && feature.definition.entityTypeId == componentTypeId,
      ));

    if (findFeatureKlass) {
      const feature = findFeatureKlass.classFeatures
        .find((feature) =>
          feature.definition.id == componentId
          && feature.definition.entityTypeId == componentTypeId,
        );
      if (feature) {
        return parseTemplateString(this.ddbData, this.rawCharacter, feature.definition.description, this.ddbFeature).text;
      }
    }
    return "";
  }

  _getRaceFeatureDescription() {
    const componentId = this.ddbDefinition.componentId;
    const componentTypeId = this.ddbDefinition.componentTypeId;

    const feature = this.ddbData.character.race.racialTraits
      .find((trait) =>
        trait.definition.id == componentId
        && trait.definition.entityTypeId == componentTypeId,
      );

    if (feature) {
      return parseTemplateString(this.ddbData, this.rawCharacter, feature.definition.description, this.ddbFeature).text;
    }
    return "";

  }

  static getParsedAction(description) {
    // pcs don't have mythic
    const actionAction = description.match(/(?:as|spend|use) (?:a|an|your) action/ig);
    if (actionAction) return "action";
    const bonusAction = description.match(/(?:as|use|spend) (?:a|an|your) bonus action/ig);
    if (bonusAction) return "bonus";
    const reAction = description.match(/(?:as|use|spend) (?:a|an|your) reaction/ig);
    if (reAction) return "reaction";

    return undefined;
  }

  static buildFullDescription(main, summary, title) {
    let result = "";

    if (summary && !utils.stringKindaEqual(main, summary) && summary.trim() !== "" && main.trim() !== "") {
      result += summary.trim();
      result += `<br>
  <details>
    <summary>
      ${title ? title : "More Details"}
    </summary>
    <p>
      ${main.trim()}
    </p>
  </details>`;
    } else if (summary && main.trim() === "") {
      result += summary.trim();
    } else {
      result += main.trim();
    }

    return result;
  }

  getDescription({ forceFull = false, extra = "" } = {}) {
    // for now none actions probably always want the full text
    const useCombinedSetting = game.settings.get("ddb-importer", "character-update-policy-use-combined-description");
    const chatAdd = game.settings.get("ddb-importer", "add-description-to-chat");

    this.snippet = this.ddbDefinition.snippet && this.ddbDefinition.snippet !== ""
      ? parseTemplateString(this.ddbData, this.rawCharacter, this.ddbDefinition.snippet, this.ddbFeature).text
      : "";
    const rawSnippet = this.ddbDefinition.snippet
      ? this.snippet
      : "";

    this.description = this.ddbDefinition.description && this.ddbDefinition.description !== ""
      ? parseTemplateString(this.ddbData, this.rawCharacter, this.ddbDefinition.description, this.ddbFeature).text
      : this.type === "race"
        ? this._getRaceFeatureDescription()
        : this._getClassFeatureDescription();

    const extraDescription = extra && extra !== ""
      ? parseTemplateString(this.ddbData, this.rawCharacter, extra, this.ddbFeature).text
      : "";

    const macroHelper = DDBSimpleMacro.getDescriptionAddition(this.originalName, "feat");
    if (!chatAdd) {
      const snippet = utils.stringKindaEqual(this.description, rawSnippet) ? "" : rawSnippet;
      const descriptionSnippet = !useCombinedSetting || forceFull ? null : snippet;
      const fullDescription = DDBBaseFeature.buildFullDescription(this.description, descriptionSnippet);

      return {
        value: fullDescription + extraDescription + macroHelper,
        chat: chatAdd ? snippet + macroHelper : "",
      };
    } else {
      const snippet = this.description !== "" && utils.stringKindaEqual(this.description, rawSnippet) ? "" : rawSnippet;

      return {
        value: this.description + extraDescription + macroHelper,
        chat: snippet + macroHelper,
      };
    }
  }

  _generateDescription({ forceFull = false, extra = "" } = {}) {
    this.data.system.description = this.getDescription({ forceFull, extra });
  }

  // eslint-disable-next-line complexity
  _generateLimitedUse() {
    if (
      this.ddbDefinition.limitedUse
      && (this.ddbDefinition.limitedUse.maxUses || this.ddbDefinition.limitedUse.statModifierUsesId || this.ddbDefinition.limitedUse.useProficiencyBonus)
    ) {
      const resetType = DICTIONARY.resets.find((type) => type.id === this.ddbDefinition.limitedUse.resetType);
      let maxUses = (this.ddbDefinition.limitedUse.maxUses && this.ddbDefinition.limitedUse.maxUses !== -1) ? this.ddbDefinition.limitedUse.maxUses : 0;
      const statModifierUsesId = foundry.utils.getProperty(this.ddbDefinition, "limitedUse.statModifierUsesId");
      if (statModifierUsesId) {
        const ability = DICTIONARY.character.abilities.find((ability) => ability.id === statModifierUsesId).value;

        if (maxUses === 0) {
          maxUses = `@abilities.${ability}.mod`;
        } else {
          switch (this.ddbDefinition.limitedUse.operator) {
            case 2:
              maxUses = `${maxUses} * @abilities.${ability}.mod`;
              break;
            case 1:
            default:
              maxUses = `${maxUses} + @abilities.${ability}.mod`;
          }
        }
      }

      const useProficiencyBonus = foundry.utils.getProperty(this.ddbDefinition, "limitedUse.useProficiencyBonus");
      if (useProficiencyBonus) {
        if (maxUses === 0) {
          maxUses = `@prof`;
        } else {
          switch (this.ddbDefinition.limitedUse.proficiencyBonusOperator) {
            case 2:
              maxUses = `${maxUses} * @prof`;
              break;
            case 1:
            default:
              maxUses = `${maxUses} + @prof`;
          }
        }
      }

      const finalMaxUses = (maxUses)
        ? Number.isInteger(maxUses)
          ? parseInt(maxUses)
          : maxUses
        : null;

      // TODO: revist to check recovery type
      this.data.system.uses = {
        spent: this.ddbDefinition.limitedUse.numberUsed ?? null,
        max: (finalMaxUses != 0) ? finalMaxUses : null,
        recovery: [
          { period: resetType ? resetType.value : "", type: 'recoverAll', formula: undefined },
        ],
      };
    }
  }

  // weapons still have range
  _generateRange() {
    if (this.documentType !== "weapon") return;
    if (this.ddbDefinition.range && this.ddbDefinition.range.aoeType && this.ddbDefinition.range.aoeSize) {
      this.data.system.range = { value: null, units: "self", long: "" };
      this.data.system.target = {
        value: this.ddbDefinition.range.aoeSize,
        type: DICTIONARY.actions.aoeType.find((type) => type.id === this.ddbDefinition.range.aoeType)?.value,
        units: "ft",
        reach: null,
      };
    } else if (this.ddbDefinition.range && this.ddbDefinition.range.range) {
      this.data.system.range = {
        value: this.ddbDefinition.range.range,
        units: "ft",
        long: this.ddbDefinition.range.long || "",
        reach: null,
      };
    } else {
      this.data.system.range = { value: 5, units: "ft", long: "" };
    }
  }

  isMartialArtist(klass = null) {
    if (klass) {
      return klass.classFeatures.some((feature) => feature.definition.name === "Martial Arts");
    } else {
      return this.ddbData.character.classes.some((k) => k.classFeatures.some((feature) => feature.definition.name === "Martial Arts"));
    }

  }

  getDamageType() {
    return this.ddbDefinition.damageTypeId
      ? DICTIONARY.actions.damageType.find((type) => type.id === this.ddbDefinition.damageTypeId).name
      : null;
  }

  getDamageDie() {
    return this.ddbDefinition.dice
      ? this.ddbDefinition.dice
      : this.ddbDefinition.die
        ? this.ddbDefinition.die
        : undefined;
  }

  getDamage(bonuses = []) {
    const damageType = this.getDamageType();
    const damage = {
      number: null,
      denomination: null,
      bonus: "",
      types: damageType ? [damageType] : [],
      custom: {
        enabled: false,
        formula: "",
      },
      scaling: {
        mode: "whole",
        number: null,
        formula: "",
      },
    };
    const die = this.getDamageDie();
    const fixedBonus = die?.fixedValue
      ? (this.ddbDefinition.snippet ?? this.ddbDefinition.description ?? "").includes("{{proficiency#signed}}")
        ? " + @prof"
        : ` + ${die.fixedValue}`
      : "";

    const bonusString = bonuses.join(" ");

    if (die || this.useScaleValueLink) {
      if (this.useScaleValueLink) {
        DDBBasicActivity.parseBasicDamageFormula(damage, `${this.scaleValueLink}${bonusString}${fixedBonus}`);
      } else if (die.diceString) {
        const profBonus = CONFIG.DDB.levelProficiencyBonuses.find((b) => b.level === this.ddbData.character.classes.reduce((p, c) => p + c.level, 0))?.bonus;
        const replaceProf = this.ddbDefinition.snippet?.includes("{{proficiency#signed}}")
          && Number.parseInt(die.fixedValue) === Number.parseInt(profBonus);
        const diceString = replaceProf
          ? die.diceString.replace(`+ ${profBonus}`, "")
          : die.diceString;
        const mods = replaceProf ? `${bonusString} + @prof` : bonusString;
        const damageString = utils.parseDiceString(diceString, mods).diceString;
        DDBBasicActivity.parseBasicDamageFormula(damage, damageString);
      } else if (fixedBonus) {
        DDBBasicActivity.parseBasicDamageFormula(damage, fixedBonus + bonusString);
      }
    }

    return damage;

  }

  _generateDamage() {
    if (this.documentType !== "weapon") return;
    const damage = this.getDamage();
    if (!damage) return;
    this.data.system.damage = {
      base: damage,
      versatile: "",
    };
  }

  getMartialArtsDamage(bonuses = []) {
    const damageType = this.getDamageType();
    const actionDie = this.ddbDefinition.dice
      ? this.ddbDefinition.dice
      : this.ddbDefinition.die
        ? this.ddbDefinition.die
        : undefined;
    const bonusString = bonuses.join(" ");

    const damage = {
      number: null,
      denomination: null,
      bonus: "",
      types: damageType ? [damageType] : [],
      custom: {
        enabled: false,
        formula: "",
      },
      scaling: {
        mode: "whole",
        number: null,
        formula: "",
      },
    };

    // are we dealing with martial artist (rather than just the feature being martial arts)
    if (this.isMartialArtist()) {
      const dies = this.ddbData.character.classes
        .filter((klass) => this.isMartialArtist(klass))
        .map((klass) => {
          const feature = klass.classFeatures.find((feature) => feature.definition.name === "Martial Arts");
          const levelScaleDie = feature?.levelScale?.dice
            ? feature.levelScale.dice
            : feature?.levelScale.die
              ? feature.levelScale.die
              : undefined;

          if (levelScaleDie?.diceString) {
            const scaleValueLink = DDBHelper.getScaleValueLink(this.ddbData, feature);
            const scaleString = scaleValueLink && scaleValueLink !== "{{scalevalue-unknown}}"
              ? scaleValueLink
              : levelScaleDie.diceString;
            if (actionDie?.diceValue > levelScaleDie.diceValue) {
              return actionDie.diceString;
            }
            return scaleString;
          } else if (actionDie !== null && actionDie !== undefined) {
            // On some races bite is considered a martial art, damage
            // is different and on the action itself
            return actionDie.diceString;
          } else {
            return "1";
          }
        });
      const die = dies.length > 0 ? dies[0] : "";

      const damageString = die.includes("@")
        ? `${die}${bonusString} + @mod`
        : utils.parseDiceString(die, `${bonusString} + @mod`).diceString;

      // set the weapon damage
      DDBBasicActivity.parseBasicDamageFormula(damage, damageString);
    } else if (actionDie !== null && actionDie !== undefined) {
      // The Lizardfolk jaws have a different base damage, its' detailed in
      // dice so lets capture that for actions if it exists
      const damageString = utils.parseDiceString(actionDie.diceString, `${bonusString} + @mod`).diceString;
      DDBBasicActivity.parseBasicDamageFormula(damage, damageString);
    } else {
      // default to basics
      DDBBasicActivity.parseBasicDamageFormula(damage, `1${bonusString} + @mod`);
    }

    return damage;
  }

  _generateResourceFlags() {
    const linkItems = game.modules.get("link-item-resource-5e")?.active;
    const resourceType = foundry.utils.getProperty(this.rawCharacter, "flags.ddbimporter.resources.type");
    if (resourceType !== "disable" && linkItems) {
      const hasResourceLink = foundry.utils.getProperty(this.data.flags, "link-item-resource-5e.resource-link");
      Object.keys(this.rawCharacter.system.resources).forEach((resource) => {
        const detail = this.rawCharacter.system.resources[resource];
        if (this.ddbDefinition.name === detail.label) {
          foundry.utils.setProperty(this.data.flags, "link-item-resource-5e.resource-link", resource);
          this.rawCharacter.system.resources[resource] = { value: 0, max: 0, sr: false, lr: false, label: "" };
        } else if (hasResourceLink === resource) {
          foundry.utils.setProperty(this.data.flags, "link-item-resource-5e.resource-link", undefined);
        }
      });
    }
  }

  _getFeatModifierItem(choice, type) {
    if (this.ddbDefinition.grantedModifiers) return this.ddbDefinition;
    let modifierItem = foundry.utils.duplicate(this.ddbDefinition);
    const modifiers = [
      DDBHelper.getChosenClassModifiers(this.ddbData, { includeExcludedEffects: true, effectOnly: true }),
      DDBHelper.getModifiers(this.ddbData, "race", true, true),
      DDBHelper.getModifiers(this.ddbData, "background", true, true),
      DDBHelper.getModifiers(this.ddbData, "feat", true, true),
    ].flat();

    if (!modifierItem.definition) modifierItem.definition = {};
    modifierItem.definition.grantedModifiers = modifiers.filter((mod) => {
      if (mod.componentId === this.ddbDefinition?.id && mod.componentTypeId === this.ddbDefinition?.entityTypeId)
        return true;
      if (choice && this.ddbData.character.options[type]?.length > 0) {
        // if it is a choice option, try and see if the mod matches
        const choiceMatch = this.ddbData.character.options[type].some(
          (option) =>
            // id match
            choice.componentId == option.componentId // the choice id matches the option componentID
            && option.definition.id == mod.componentId // option id and mod id match
            && (choice.componentTypeId == option.componentTypeId // either the choice componenttype and optiontype match or
              || choice.componentTypeId == option.definition.entityTypeId) // the choice componentID matches the option definition entitytypeid
            && option.definition.entityTypeId == mod.componentTypeId // mod componentId matches option entity type id
            && choice.id == mod.componentId, // choice id and mod id match
        );
        // console.log(`choiceMatch ${choiceMatch}`);
        if (choiceMatch) return true;
      } else if (choice) {
        // && choice.parentChoiceId
        const choiceIdSplit = choice.choiceId.split("-").pop();
        if (mod.id == choiceIdSplit) return true;
      }

      if (mod.componentId === this.ddbDefinition.id) {
        if (type === "class") {
          // logger.log("Class check - feature effect parsing");
          const classFeatureMatch = this.ddbData.character.classes.some((klass) =>
            klass.classFeatures.some(
              (f) => f.definition.entityTypeId == mod.componentTypeId && f.definition.id == this.ddbDefinition.id,
            ),
          );
          if (classFeatureMatch) return true;
        } else if (type === "feat") {
          const featMatch = this.ddbData.character.feats.some(
            (f) => f.definition.entityTypeId == mod.componentTypeId && f.definition.id == this.ddbDefinition.id,
          );
          if (featMatch) return true;
        } else if (type === "race") {
          const traitMatch = this.ddbData.character.race.racialTraits.some(
            (t) =>
              t.definition.entityTypeId == mod.componentTypeId
              && t.definition.id == mod.componentId
              && t.definition.id == this.ddbDefinition.id,
          );
          if (traitMatch) return true;
        }
      }
      return false;
    });
    // console.warn("Modifier Item", modifierItem);
    return modifierItem;
  }

  _addEffects(choice, type) {
    // can we apply any auto-generated effects to this feature
    const compendiumItem = this.rawCharacter.flags.ddbimporter.compendium;
    const modifierItem = this._getFeatModifierItem(choice, type);
    this.data = generateEffects({
      ddb: this.ddbData,
      character: this.rawCharacter,
      ddbItem: modifierItem,
      foundryItem: this.data,
      isCompendiumItem: compendiumItem,
      type: "feat",
      description: this.snippet !== "" ? this.snippet : this.description,
    });

    let effect = this.enricher.createEffect();
    if (effect) {
      this.data.effects.push(effect);
    }
  }


  _addCustomValues() {
    DDBHelper.addCustomValues(this.ddbData, this.data);
  }

  _generateSystemSubType() {
    let subType = null;

    if (this.type === "class") {
      let subType = null;
      if (this.data.name.startsWith("Ki:")) subType = "Ki";
      // many ki abilities do not start with ki
      else if (this.data.name.startsWith("Channel Divinity:")) subType = "channelDivinity";
      else if (this.data.name.startsWith("Artificer Infusion:")) subType = "artificerInfusion";
      else if (this.data.name.startsWith("Invocation:")) subType = "eldritchInvocation";
      else if (this.data.name.startsWith("Fighting Style:")) subType = "fightingStyle";
      else if (this.data.name.startsWith("Battle Master Maneuver:")) subType = "maneuver";
      else if (this.data.name.startsWith("Metamagic:")) subType = "metamagic";
      else if (this.data.name.startsWith("Pact of the")) subType = "pact";
      else if (this.data.name.startsWith("Rune Carver:")) subType = "rune";
      else if (this.data.name.startsWith("Psionic Power:")) subType = "psionicPower";
      else if (this.data.name.startsWith("Hunter's Prey:")) subType = "huntersPrey";
      else if (this.data.name.startsWith("Defensive Tactics:")) subType = "defensiveTactic";
      else if (this.data.name.startsWith("Superior Hunter's Defense:")) subType = "superiorHuntersDefense";
      else if (this.data.name.startsWith("Arcane Shot Options:")) subType = "arcaneShot";
      else if (this.data.name.startsWith("Elemental Disciplines:")) subType = "elementalDiscipline";
      // missing: Arcane Shot : arcaneShot
      // missing: multiattack


    } else if (this.type === "feat") {
    // TODO: feat subtypes
    // for 2024 now have for feats
    // subtypes: {
    //   general: "DND5E.Feature.Feat.General",
    //   origin: "DND5E.Feature.Feat.Origin",
    //   fightingStyle: "DND5E.Feature.Feat.FightingStyle",
    //   epicBoon: "DND5E.Feature.Feat.EpicBoon"
    // }

    }

    if (subType) foundry.utils.setProperty(this.data, "system.type.subtype", subType);
  }

  _generateWeaponType() {
    if (this.documentType !== "weapon") return;

    const entry = this.naturalWeapon
      ? "natural"
      : DICTIONARY.actions.attackTypes.find((type) => type.attackSubtype === this.ddbDefinition.attackSubtype)?.value;
    const range = DICTIONARY.weapon.weaponRange.find((type) => type.attackType === this.ddbDefinition.attackTypeRange);
    this.data.system.type.value = entry
      ? entry
      : range
        ? `simple${range.value}`
        : "simpleM";
  }

  _generateSystemType() {
    if (this.documentType === "weapon") {
      this._generateWeaponType();
    } else {
      foundry.utils.setProperty(this.data, "system.type.value", this.type);
    }
  }

  _getSaveActivity() {
    this._generateDamage();

    const saveActivity = new DDBFeatureActivity({
      type: "save",
      ddbParent: this,
    });

    saveActivity.build({
      generateSave: true,
      generateRange: this.documentType !== "weapon",
      generateDamage: this.documentType !== "weapon",
    });

    return saveActivity;
  }

  _getAttackActivity() {
    this._generateDamage();

    const attackActivity = new DDBFeatureActivity({
      type: "attack",
      ddbParent: this,
    });

    attackActivity.build({
      generateAttack: true,
      generateRange: this.documentType !== "weapon",
      generateDamage: this.documentType !== "weapon",
    });
    return attackActivity;
  }

  _getUtilityActivity() {
    this._generateDamage();

    const utilityActivity = new DDBFeatureActivity({
      type: "utility",
      ddbParent: this,
    });

    utilityActivity.build({
      generateActivation: true,
      generateRange: this.documentType !== "weapon",
      generateDamage: this.documentType !== "weapon",
    });

    return utilityActivity;
  }

  _getHealActivity() {
    const healActivity = new DDBFeatureActivity({
      type: "heal",
      ddbParent: this,
    });

    healActivity.build({
      generateActivation: true,
      generateDamage: false,
      generateHealing: true,
      generateRange: true,
    });

    return healActivity;
  }

  _getDamageActivity() {
    this._generateDamage();

    const damageActivity = new DDBFeatureActivity({
      type: "damage",
      ddbParent: this,
    });

    damageActivity.build({
      generateAttack: false,
      generateRange: this.documentType !== "weapon",
      generateDamage: this.documentType !== "weapon",
    });
    return damageActivity;
  }

  _getEnchantActivity() {
    this._generateDamage();

    const enchantActivity = new DDBFeatureActivity({
      type: "enchant",
      ddbParent: this,
    });

    enchantActivity.build({
      generateAttack: false,
      generateRange: true,
      generateDamage: false,
    });
    return enchantActivity;
  }

  _getSummonActivity() {
    const summonActivity = new DDBFeatureActivity({
      type: "summon",
      ddbParent: this,
    });

    summonActivity.build({
      generateAttack: false,
      generateRange: true,
      generateDamage: false,
    });
    return summonActivity;
  }

  _isCompanionFeature() {
    return SETTINGS.COMPANIONS.COMPANION_FEATURES.includes(this.originalName)
      // only run this on class features
      && this.ddbData.character.classes
        .some((k) => k.classFeatures.some((f) => f.definition.name == this.originalName));
  }

  _isCompanionFeatureOption() {
    for (const [parentFeature, childNames] of Object.entries(SETTINGS.COMPANIONS.COMPANION_OPTIONS)) {
      for (const childName of childNames) {
        if (this.originalName === parentFeature
          || this.originalName === `${parentFeature}: ${childName}`) {
          this.companionFeatureOption = {
            parentFeature,
            childName,
          };
          return true;
        }
      }
    }
    return false;
  }

  _getSummonsDescription() {
    if (this.isCompanionFeatureOption) {
      const ddbOption = this.ddbData.character.options.class.find((o) => o.definition.name == this.companionFeatureOption.childName);
      if (!ddbOption) return null;
      return ddbOption.definition.description;
    } else {
      return this.spellDefinition.description;
    }
  }

  _getActivitiesType() {
    if (this.isCompanionFeature || this._isCompanionFeatureOption()) {
      return "summon";
    } else if (typeof this.ddbDefinition.saveStatId === "number") {
      // lets see if we have a save stat for things like Dragon born Breath Weapon
      return "save";
    } else if (this.ddbDefinition.actionType === 1) {
      return "attack";
    } else if (this.ddbDefinition.rangeId && this.ddbDefinition.rangeId === 1) {
      return "attack";
    } else if (this.ddbDefinition.rangeId && this.ddbDefinition.rangeId === 2) {
      return "attack";
    }
    // TODO: can we determine if utility, heal or damage?
    return null;
  }

  getActivity({ typeOverride = null, typeFallback = null } = {}) {
    const type = typeOverride ?? this._getActivitiesType();
    switch (type) {
      case "save":
        return this._getSaveActivity();
      case "attack":
        return this._getAttackActivity();
      case "damage":
        return this._getDamageActivity();
      case "heal":
        return this._getHealActivity();
      case "utility":
        return this._getUtilityActivity();
      case "enchant":
        return this._getEnchantActivity();
      case "summon":
        return this._getSummonActivity();
      default:
        if (typeFallback) return this.getActivity({ typeOverride: typeFallback });
        return undefined;
    }
  }

  _generateActivity({ hintsOnly = false } = {}) {
    if (hintsOnly && !this.enricher.activity) return undefined;

    const activity = this.getActivity({
      typeOverride: this.enricher.activity?.type ?? this.activityType,
    });

    console.warn(`Feature Activity Check for ${this.data.name}`, {
      this: this,
      activity,
      activityType: this.enricher.activity?.type ?? this.activityType,
    });

    if (!activity) return undefined;

    this.enricher.applyActivityOverride(activity.data);
    this.activities.push(activity);
    foundry.utils.setProperty(this.data, `system.activities.${activity.data._id}`, activity.data);

    return activity.data._id;
  }

  // eslint-disable-next-line class-methods-use-this
  build() {
    // override this feature
    return false;
  }

}
