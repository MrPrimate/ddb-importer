import { DICTIONARY, SETTINGS } from "../../config/_module.mjs";
import { utils, logger, DDBSources, DDBSimpleMacro } from "../../lib/_module.mjs";
import { DDBFeatureActivity } from "../activities/_module.mjs";
import DDBCompanionFactory from "../companions/DDBCompanionFactory.mjs";
import DDBSummonsManager from "../companions/DDBSummonsManager.mjs";
import { DDBGenericEnricher, mixins, Effects, DDBFeatEnricher, DDBSpeciesTraitEnricher, DDBClassFeatureEnricher, DDBBackgroundEnricher } from "../enrichers/_module.mjs";
import { DDBDataUtils, DDBDescriptions, DDBModifiers, DDBTable, DDBTemplateStrings, SystemHelpers } from "../lib/_module.mjs";

export default class DDBFeatureMixin extends mixins.DDBActivityFactoryMixin {

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
    "Arms of the Astral Self",
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

  static SPECIAL_ADVANCEMENTS = {};

  static UTILITY_FEATURES = [
    "Channel Divinity:",
    "Maneuver:",
  ];

  DDB_TYPE_ENRICHERS = {
    "class": DDBClassFeatureEnricher,
    "race": DDBSpeciesTraitEnricher,
    "feat": DDBFeatEnricher,
    "other": DDBGenericEnricher,
    "background": DDBBackgroundEnricher,
  };

  _init() {
    logger.debug(`Generating Base Feature ${this.ddbDefinition.name}`);
  }


  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: DDBDataUtils.getName(this.ddbData, this.ddbDefinition, this.rawCharacter),
      type: this.documentType,
      system: SystemHelpers.getTemplate(this.documentType),
      effects: [],
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
          legacy: this.legacy,
        },
        infusions: { infused: false },
      },
    };
    // Spells will still have activation/duration/range/target,
    // weapons will still have range & damage (1 base part & 1 versatile part),
    // and all items will still have limited uses (but no consumption)
  }

  _generateLevelScale() {
    this.excludedScale = DDBFeatureMixin.LEVEL_SCALE_EXCLUSION.includes(this.ddbDefinition.name)
      || DDBFeatureMixin.LEVEL_SCALE_EXCLUSION.includes(this.data.name);
    this.levelScaleInfusion = DDBFeatureMixin.LEVEL_SCALE_INFUSIONS.includes(this.ddbDefinition.name)
      || DDBFeatureMixin.LEVEL_SCALE_INFUSIONS.includes(this.data.name);
    this.scaleValueLink = DDBDataUtils.getScaleValueString(this.ddbData, this.ddbDefinition).value;
    this.useScaleValueLink = !this.excludedScale
      && this.scaleValueLink
      && this.scaleValueLink !== "{{scalevalue-unknown}}";
  }

  _generateFlagHints() {
    this.data.flags = foundry.utils.mergeObject(this.data.flags, this.extraFlags);

    if (this._actionType.class) {
      const klass = DDBDataUtils.findClassByFeatureId(this.ddbData, this._actionType.class.componentId);
      this.klass = klass.definition.name;
      foundry.utils.setProperty(this.data.flags, "ddbimporter.type", "class");
      foundry.utils.setProperty(this.data.flags, "ddbimporter.class", klass.definition.name);
      foundry.utils.setProperty(this.data.flags, "ddbimporter.classId", klass.definition.id);
      const subKlass = DDBDataUtils.findSubClassByFeatureId(this.ddbData, this._actionType.class.componentId);
      this.subKlass = subKlass?.definition.name;
      const subClass = foundry.utils.getProperty(subKlass, "subclassDefinition");
      foundry.utils.setProperty(this.data.flags, "ddbimporter.subClass", subClass?.name);
      foundry.utils.setProperty(this.data.flags, "ddbimporter.subClassId", subClass?.id);
    } else if (this._actionType.race) {
      foundry.utils.setProperty(this.data.flags, "ddbimporter.type", "race");
      foundry.utils.setProperty(this.data, "flags.ddbimporter.fullRaceName", this.ddbCharacter?._ddbRace.fullName);
      foundry.utils.setProperty(this.data, "flags.ddbimporter.groupName", this.ddbCharacter?._ddbRace.groupName);
    } else if (this._actionType.feat) {
      foundry.utils.setProperty(this.data.flags, "ddbimporter.type", "feat");
    }

    // scaling details
    const klassActionComponent = DDBDataUtils.findComponentByComponentId(this.ddbData, this.ddbDefinition.id)
      ?? DDBDataUtils.findComponentByComponentId(this.ddbData, this.ddbDefinition.componentId);
    if (klassActionComponent) {
      foundry.utils.setProperty(this.data.flags, "ddbimporter.dndbeyond.levelScale", klassActionComponent.levelScale);
      foundry.utils.setProperty(this.data.flags, "ddbimporter.dndbeyond.levelScales", klassActionComponent.definition?.levelScales);
      foundry.utils.setProperty(this.data.flags, "ddbimporter.dndbeyond.limitedUse", klassActionComponent.definition?.limitedUse);
    }
  }

  _generateSaveFromDescription() {
    const description = (this.ddbDefinition.description ?? this.ddbDefinition.snippet ?? "");
    const textMatch = DDBDescriptions.dcParser({ text: description });
    if (textMatch.match) {
      this._descriptionSave = textMatch.save;
    } else {
      this._descriptionSave = null;
    }
  }

  _generateActionTypes() {
    this._generateSaveFromDescription();
    this._actionType = {
      class: this.ddbData.character.actions.class
        .filter((ddbAction) => DDBDataUtils.findClassByFeatureId(this.ddbData, ddbAction.componentId))
        .find((ddbAction) => {
          const name = DDBDataUtils.getName(this.ddbData, ddbAction, this.rawCharacter);
          return name === this.data.name;
        }),
      race: this.ddbData.character.actions.race
        .some((ddbAction) => {
          const name = DDBDataUtils.getName(this.ddbData, ddbAction, this.rawCharacter);
          return name === this.data.name;
        }),
      feat: this.ddbData.character.actions.feat
        .some((ddbAction) => {
          const name = DDBDataUtils.getName(this.ddbData, ddbAction, this.rawCharacter);
          return name === this.data.name;
        }),
    };
  }

  _prepare() {
    if (this.ddbDefinition.infusionFlags) {
      foundry.utils.setProperty(this.data, "flags.infusions", this.ddbDefinition.infusionFlags);
    }

    this._generateLevelScale();
    this._generateActionTypes();
    this._generateFlagHints();
  }

  _getActionParent() {
    if (this.ddbDefinition.componentId)
      return DDBDataUtils.findComponentByComponentId(this.ddbData, this.ddbDefinition.componentId);
    else
      return null;
  }

  _checkSummons() {
    this.isCompanionFeature = this._isCompanionFeature();
    this.isCompanionFeatureOption = this._isCompanionFeatureOption();

    const isCompanionFeature = (this.isCompanionFeature || this.isCompanionFeatureOption);
    this.isCompanionFeature2014 = this.is2014 && isCompanionFeature;
    this.isCompanionFeature2024 = !this.is2014 && isCompanionFeature;
    this.isCRSummonFeature2014 = this.is2014
      && DICTIONARY.companions.CR_SUMMONING_FEATURES_2014.includes(this.originalName);
    this.isCRSummonFeature2024 = !this.is2014
      && DICTIONARY.companions.CR_SUMMONING_FEATURES_2024.includes(this.originalName);

    this.isSummons = this.isCompanionFeature2014
      || this.isCompanionFeature2024
      || this.isCRSummonFeature2014
      || this.isCRSummonFeature2024;
  }

  constructor({
    ddbData, ddbDefinition, type, source, documentType = "feat", rawCharacter = null, isGeneric = false, activityType = null,
    extraFlags = {}, enricher = null, ddbCharacter = null, fallbackEnricher = null, usesOnActivity = false,
  } = {}) {

    const addEffects = isGeneric
      ? game.settings.get("ddb-importer", "munching-policy-add-midi-effects")
      : game.settings.get("ddb-importer", "character-update-policy-add-midi-effects");

    super({
      enricher,
      activityGenerator: DDBFeatureActivity,
      documentType,
      useMidiAutomations: addEffects,
      usesOnActivity,
    });

    this.ddbCharacter = ddbCharacter;
    this.ddbData = ddbData;
    this.rawCharacter = rawCharacter;
    this.ddbFeature = ddbDefinition;
    this.extraFlags = extraFlags;
    this.ddbDefinition = ddbDefinition.definition ?? ddbDefinition;
    this.name = utils.nameString(this.ddbDefinition.name);
    this.originalName = this.ddbData
      ? DDBDataUtils.getName(this.ddbData, this.ddbDefinition, this.rawCharacter, false)
      : utils.nameString(this.ddbDefinition.name);
    this.type = type;
    this.source = source;
    this.isAction = false;
    this.excludedScale = false;
    this.levelScaleInfusion = false;
    this.scaleValueLink = "";
    this.useScaleValueLink = false;
    this.excludedScaleUses = false;
    this.scaleValueUsesLink = "";
    this.useUsesScaleValueLink = false;
    this.tagType = "other";
    this.activities = [];
    this.data = {};
    this.isGeneric = isGeneric;
    this._init();
    this.snippet = "";
    this.description = "";
    this.resourceCharges = null;
    this.activityType = activityType;

    this.klass = this.extraFlags.ddbimporter?.class;
    this.subKlass = this.extraFlags.ddbimporter?.subClass;

    // this._attacksAsFeatures = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-actions-as-features");

    this._parent = this._getActionParent();

    const sources = (this.ddbDefinition.sources ?? this._parent?.definition?.sources ?? []);
    const sourceIds = sources.map((sm) => sm.sourceId);
    this.legacy = CONFIG.DDB.sources.some((ddbSource) =>
      sourceIds.includes(ddbSource.id)
      && DICTIONARY.sourceCategories.legacy.includes(ddbSource.sourceCategoryId),
    );
    this.is2014 = sources.some((s) => Number.isInteger(s.sourceId) && s.sourceId < 145);

    this._generateDataStub();

    const intMatch = /^(\d+: )(.*)$/;
    const intNameMatch = intMatch.exec(this.data.name);
    if (intNameMatch) {
      this.name = intNameMatch[2].trim();
      this.data.name = intNameMatch[2].trim();
    }

    // Grim Hollow puts points in names. WHY
    const namePointRegex = /(.*) \((\d) points?\)/i;
    const nameMatch = namePointRegex.exec(this.name.match);
    if (nameMatch) {
      this.data.name = nameMatch[1];
      this.resourceCharges = Number.parseInt(nameMatch[2]);
    }

    this._prepare();

    this.naturalWeapon = DDBFeatureMixin.NATURAL_WEAPONS.includes(this.originalName);

    this._checkSummons();

    const localSource = this.source && utils.isObject(this.source)
      ? this.source
      : DDBSources.parseSource(this.ddbDefinition);

    this.data.system.source = localSource;
    this.data.system.source.rules = this.is2014 ? "2014" : "2024";

    this.fallbackEnricher = fallbackEnricher;

    this.enricher = enricher ?? new this.DDB_TYPE_ENRICHERS[type]({
      activityGenerator: DDBFeatureActivity,
      fallbackEnricher: this.fallbackEnricher,
    });
  }

  _getClassFeatureDescription(nameMatch = false) {
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
          && feature.definition.entityTypeId == componentTypeId
          && (!nameMatch
            || (nameMatch && feature.definition.name == this.originalName)
          ),
        );
      if (feature) {
        return DDBTemplateStrings.parse(this.ddbData, this.rawCharacter, feature.definition.description, this.ddbFeature).text;
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
      return DDBTemplateStrings.parse(this.ddbData, this.rawCharacter, feature.definition.description, this.ddbFeature).text;
    }
    return "";

  }

  getParsedActionType() {
    const description = this.ddbDefinition.description && this.ddbDefinition.description !== ""
      ? this.ddbDefinition.description
      : this.ddbDefinition.snippet && this.ddbDefinition.snippet !== ""
        ? this.ddbDefinition.snippet
        : null;

    if (!description) return undefined;
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
      ? DDBTemplateStrings.parse(this.ddbData, this.rawCharacter, this.ddbDefinition.snippet, this.ddbFeature).text
      : "";
    const rawSnippet = this.ddbDefinition.snippet
      ? this.snippet
      : "";

    this.description = this.ddbDefinition.description && this.ddbDefinition.description !== ""
      ? DDBTemplateStrings.parse(this.ddbData, this.rawCharacter, this.ddbDefinition.description, this.ddbFeature).text
      : !useCombinedSetting || forceFull
        ? this.type === "race"
          ? this._getRaceFeatureDescription()
          : this._getClassFeatureDescription(!(useCombinedSetting || forceFull))
        : "";

    const extraDescription = extra && extra !== ""
      ? DDBTemplateStrings.parse(this.ddbData, this.rawCharacter, extra, this.ddbFeature).text
      : "";

    const macroHelper = DDBSimpleMacro.getDescriptionAddition(this.originalName, "feat");
    if (!chatAdd) {
      const snippet = utils.stringKindaEqual(this.description, rawSnippet) ? "" : rawSnippet;
      const descriptionSnippet = (!useCombinedSetting || forceFull) && this.description !== "" ? null : snippet;
      const fullDescription = DDBFeatureMixin.buildFullDescription(this.description, descriptionSnippet);

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
    let resetType = DICTIONARY.resets.find((type) => type.id === this.ddbDefinition.limitedUse?.resetType);

    if (!resetType) {
      const resetTypeRegex = /(?:(Short) or )?(Long) Rest/ig;
      const match = resetTypeRegex.exec(this.ddbDefinition.description);
      if (match && match[1]) {
        resetType = DICTIONARY.resets.find((type) => type.id === match[1]);
      } else if (match && match[2]) {
        resetType = DICTIONARY.resets.find((type) => type.id === match[2]);
      }
    }
    if (
      this.ddbDefinition.limitedUse
      && (this.ddbDefinition.limitedUse.maxUses || this.ddbDefinition.limitedUse.statModifierUsesId || this.ddbDefinition.limitedUse.useProficiencyBonus)
    ) {
      let maxUses = (this.ddbDefinition.limitedUse.maxUses && this.ddbDefinition.limitedUse.maxUses !== -1) ? this.ddbDefinition.limitedUse.maxUses : 0;
      const statModifierUsesId = foundry.utils.getProperty(this.ddbDefinition, "limitedUse.statModifierUsesId");
      if (statModifierUsesId) {
        const ability = DICTIONARY.actor.abilities.find((ability) => ability.id === statModifierUsesId).value;

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

      if (this.useUsesScaleValueLink && this.scaleValueUsesLink) {
        maxUses = this.scaleValueUsesLink;
      }

      const finalMaxUses = (maxUses)
        ? Number.isInteger(maxUses)
          ? parseInt(maxUses)
          : maxUses
        : null;

      this.data.system.uses = {
        spent: this.ddbDefinition.limitedUse.numberUsed ?? null,
        max: (finalMaxUses != 0) ? `${finalMaxUses}` : null,
        recovery: [
          { period: resetType ? resetType.value : "", type: 'recoverAll', formula: undefined },
        ],
      };
    } else if (this.useUsesScaleValueLink && this.scaleValueUsesLink) {
      let maxUses = this.scaleValueUsesLink;

      this.data.system.uses = {
        spent: this.ddbDefinition.limitedUse.numberUsed ?? null,
        max: (maxUses !== "") ? maxUses : null,
        recovery: [
          { period: resetType ? resetType.value : "", type: 'recoverAll', formula: undefined },
        ],
      };
    } else if (foundry.utils.hasProperty(this.ddbDefinition, "limitedUse.value")) {
      this.data.system.uses = {
        spent: this.ddbDefinition.limitedUse.numberUsed ?? null,
        max: this.ddbDefinition.limitedUse.value,
        recovery: [
          { period: resetType ? resetType.value : "", type: 'recoverAll', formula: undefined },
        ],
      };
    } else if (this.enricher?.activityNameMatchFeature) {
      this.data.system.uses = foundry.utils.deepClone(this.enricher.activityNameMatchFeature.system.uses);
    } else if (this.enricher?.defaultActionFeatures && Object.keys(this.enricher.defaultActionFeatures).length > 0) {
      const features = Object.values(this.enricher.defaultActionFeatures).flat();
      const featureMatch = features.find((feature) => feature.system.uses.max && feature.system.uses.max !== "");
      if (featureMatch) {
        this.data.system.uses = foundry.utils.deepClone(featureMatch.system.uses);
      }
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
        SystemHelpers.parseBasicDamageFormula(damage, `${this.scaleValueLink}${bonusString}${fixedBonus}`);
      } else if (die.diceString) {
        const profBonus = CONFIG.DDB.levelProficiencyBonuses.find((b) => b.level === this.ddbData.character.classes.reduce((p, c) => p + c.level, 0))?.bonus;
        const replaceProf = this.ddbDefinition.snippet?.includes("{{proficiency#signed}}")
          && Number.parseInt(die.fixedValue) === Number.parseInt(profBonus);
        const diceString = replaceProf
          ? die.diceString.replace(`+ ${profBonus}`, "")
          : die.diceString;
        const mods = replaceProf ? `${bonusString} + @prof` : bonusString;
        const damageString = utils.parseDiceString(diceString, mods).diceString;
        SystemHelpers.parseBasicDamageFormula(damage, damageString);
      } else if (fixedBonus) {
        SystemHelpers.parseBasicDamageFormula(damage, fixedBonus + bonusString);
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
            const scaleValueLink = DDBDataUtils.getScaleValueLink(this.ddbData, feature);
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
      SystemHelpers.parseBasicDamageFormula(damage, damageString);
    } else if (actionDie !== null && actionDie !== undefined) {
      // The Lizardfolk jaws have a different base damage, its' detailed in
      // dice so lets capture that for actions if it exists
      const damageString = utils.parseDiceString(actionDie.diceString, `${bonusString} + @mod`).diceString;
      SystemHelpers.parseBasicDamageFormula(damage, damageString);
    } else {
      // default to basics
      SystemHelpers.parseBasicDamageFormula(damage, `1${bonusString} + @mod`);
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

  // eslint-disable-next-line class-methods-use-this
  getActionAttackAbility() {
    return "";
  }

  _getFeatModifierItem(choice, type) {
    if (this.ddbDefinition.grantedModifiers) return this.ddbDefinition;
    let modifierItem = foundry.utils.duplicate(this.ddbDefinition);
    const modifiers = [
      DDBModifiers.getChosenClassModifiers(this.ddbData, { includeExcludedEffects: true, effectOnly: true }),
      DDBModifiers.getModifiers(this.ddbData, "race", true, true),
      DDBModifiers.getModifiers(this.ddbData, "background", true, true),
      DDBModifiers.getModifiers(this.ddbData, "feat", true, true),
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

    return modifierItem;
  }

  async _addEffects(choice, type) {
    // can we apply any auto-generated effects to this feature
    const compendiumItem = this.rawCharacter.flags.ddbimporter.compendium;
    const modifierItem = this._getFeatModifierItem(choice, type);
    this.data = Effects.EffectGenerator.generateEffects({
      ddb: this.ddbData,
      character: this.rawCharacter,
      ddbItem: modifierItem,
      document: this.data,
      isCompendiumItem: compendiumItem,
      type: "feat",
      description: this.snippet !== "" ? this.snippet : this.description,
    });

    if (this.enricher.clearAutoEffects) this.data.effects = [];
    const effects = await this.enricher.createEffects();
    this.data.effects.push(...effects);
    this.enricher.createDefaultEffects();
    this._activityEffectLinking();
  }


  _addCustomValues() {
    DDBDataUtils.addCustomValues(this.ddbData, this.data);
  }

  // eslint-disable-next-line complexity
  _generateSystemSubType() {
    let subType = null;

    if (this.type === "class") {
      if (this.data.name.startsWith("Ki:")) subType = "Ki";
      // many ki abilities do not start with ki
      else if (this.data.name.startsWith("Channel Divinity")) subType = "channelDivinity";
      else if (this.data.name.startsWith("Artificer Infusion:")) subType = "artificerInfusion";
      else if (this.data.name.startsWith("Invocation:")) subType = "eldritchInvocation";
      else if (this.data.name.startsWith("Fighting Style:")) subType = "fightingStyle";
      else if (this.data.name.startsWith("Maneuver:")) subType = "maneuver";
      else if (this.data.name.startsWith("Battle Master Maneuver:")) subType = "maneuver";
      else if (["Metamagic:", "Metamagic - "].some((s) => this.data.name.startsWith(s))) subType = "metamagic";
      else if (this.data.name.startsWith("Pact of the")) subType = "pact";
      else if (this.data.name.startsWith("Rune Carver:")) subType = "rune";
      else if (this.data.name.startsWith("Psionic Power")) subType = "psionicPower";
      else if (this.data.name.startsWith("Hunter's Prey:")) subType = "huntersPrey";
      else if (this.data.name.startsWith("Defensive Tactics:")) subType = "defensiveTactic";
      else if (this.data.name.startsWith("Superior Hunter's Defense:")) subType = "superiorHuntersDefense";
      else if (this.data.name.startsWith("Arcane Shot Options:")) subType = "arcaneShot";
      else if (this.data.name.startsWith("Elemental Disciplines:")) subType = "elementalDiscipline";
      // missing: Arcane Shot : arcaneShot
      // missing: multiattack


    } else if (this.type === "feat" && this.ddbDefinition.categories) {
      if (this.ddbDefinition.categories.some((c) => c.tagName === "Origin"))
        subType = "origin";
      else if (this.ddbDefinition.categories.some((c) => c.tagName === "Fighting Style"))
        subType = "fightingStyle";
      else if (this.ddbDefinition.categories.some((c) => c.tagName === "Epic Boon"))
        subType = "epicBoon";
      else
        subType = "general";
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

  _isCompanionFeature() {
    return DICTIONARY.companions.COMPANION_FEATURES.includes(this.originalName)
      // only run this on class features
      && this.ddbData.character.classes
        .some((k) => k.classFeatures.some((f) => f.definition.name == this.originalName));
  }

  _isCompanionFeatureOption() {
    for (const [parentFeature, childNames] of Object.entries(DICTIONARY.companions.COMPANION_OPTIONS)) {
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

  _getFullSummonsDescription() {
    if (this.isCompanionFeatureOption) {
      const ddbOption = this.ddbData.character.options.class.find((o) => o.definition.name == this.companionFeatureOption.childName);
      if (!ddbOption) return null;
      return ddbOption.definition.description;
    } else {
      return this.ddbDefinition.description;
    }
  }

  isForceResourceLinked() {
    for (const linkedFeatures of Object.values(DICTIONARY.CONSUMPTION_LINKS)) {
      if (linkedFeatures.some((child) => this.originalName.startsWith(child))) {
        return true;
      }
    }
    return false;
  }

  targetsCreature() {
    const description = (this.ddbDefinition.description ?? this.ddbDefinition.snippet ?? "");
    const creature = /You touch (?:a|one) (?:willing |living )?creature|affecting one creature|creature you touch|a creature you|creature( that)? you can see|interrupt a creature|would strike a creature|creature of your choice|creature or object within range|cause a creature|creature must be within range|a creature in range|each creature within/gi;
    const creaturesRange = /(humanoid|monster|creature|target|beast)(s)? (or loose object )?(of your choice )?(that )?(you can see )?within range/gi;
    const targets = /attack against the target|at a target in range/gi;
    return description.match(creature)
      || description.match(creaturesRange)
      || description.match(targets);
  }

  /** @override */
  _getActivitiesType() {
    if (this.isSummons) return "summon";
    // lets see if we have a save stat for things like Dragon born Breath Weapon
    if (typeof this.ddbDefinition.saveStatId === "number" || this._descriptionSave) return "save";
    if (this.ddbDefinition.actionType === 1) return "attack";
    if (this.ddbDefinition.rangeId && this.ddbDefinition.rangeId === 1) return "attack";
    if (this.ddbDefinition.rangeId && this.ddbDefinition.rangeId === 2) return "attack";
    if (this.data.system.uses?.max && this.data.system.uses.max !== "0") return "utility";
    if (this.data.effects.length > 0 || this.enricher.effects?.length > 0) return "utility";
    if (DDBFeatureMixin.UTILITY_FEATURES.some((f) => this.originalName.startsWith(f))) return "utility";
    if (this.isForceResourceLinked()) return "utility";
    if (this.getParsedActionType()) return "utility";
    if (this.isAction) return "utility";
    return null;
  }

  /** @override */
  async _generateActivity({ hintsOnly = false, statusEffects = true, name = null, nameIdPostfix = null,
    typeOverride = null } = {}, optionsOverride = {},
  ) {

    if (this.enricher.activity?.type === "none") return undefined;

    if (statusEffects) {
      const statusEffect = Effects.AutoEffects.getStatusEffect({ ddbDefinition: this.ddbDefinition, foundryItem: this.data });
      if (statusEffect) this.data.effects.push(statusEffect);
    }

    if (hintsOnly && !this.enricher.activity) return undefined;

    const activity = await super._generateActivity({
      hintsOnly,
      name,
      nameIdPostfix,
      typeOverride: typeOverride ?? this.enricher.type ?? this.enricher.activity?.type ?? this.activityType,
    }, optionsOverride);


    if (!activity) return undefined;
    const activityData = foundry.utils.getProperty(this.data, `system.activities.${activity}`);
    if (activityData.type !== "summon") return activity;
    if (this.isCompanionFeature2014 || this.isCompanionFeature2024)
      await this.ddbCompanionFactory.addCompanionsToDocuments([], activityData);
    else if (this.isCRSummonFeature2024 || this.isCRSummonFeature2014)
      await this.ddbCompanionFactory.addCRSummoning(activityData);

    logger.verbose("Generated Activity", {
      activity: foundry.utils.deepClone(activity),
      this: this,
    });
    return activity;
  }

  // eslint-disable-next-line class-methods-use-this
  build() {
    // override this feature
    return false;
  }

  static async finalFixes(feature) {
    const tableDescription = await DDBTable.generateTable({
      parentName: feature.name,
      html: feature.system.description.value,
      updateExisting: true,
      type: feature.type,
      notifier: this.notifier,
    });
    // eslint-disable-next-line require-atomic-updates
    feature.system.description.value = tableDescription;
  }

  async _generateSummons() {
    if (this.enricher.activity?.generateSummons) {
      const summons = await this.enricher.activity.summonsFunction({
        ddbParser: this,
        document: this.data,
        raw: this.ddbDefinition.description,
        text: this.data.system.description,
      });

      await DDBSummonsManager.addGeneratedSummons(summons);
    }
  }

  createCompanionFactory() {
    this.ddbCompanionFactory = new DDBCompanionFactory(this.ddbDefinition.description, {
      type: "feature",
      originDocument: this.data,
      is2014: this.is2014,
      notifier: this.notifier,
      folderHint: foundry.utils.getProperty(this.data, "flags.ddbimporter.summons.folder"),
    });
  }

  async _generateCompanions() {
    if (!this.isSummons) return;
    // console.warn(`Parsing Companion for ${this.data.name}`, {
    //   this: this,
    //   dataCLone: deepClone(this.data),
    //   ddbDef: `${this.ddbDefinition.description}`,
    // });
    if (!this.ddbCompanionFactory) this.createCompanionFactory();
    await this.ddbCompanionFactory.parse();

    // always update compendium imports, but respect player import disable
    const addCompendium = this.isGeneric || game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-create-companions");
    if (addCompendium) {
      await this.ddbCompanionFactory.updateOrCreateCompanions();
    }

    logger.debug(`parsed companions for ${this.data.name}`, {
      factory: this.ddbCompanionFactory,
      parsed: this.ddbCompanionFactory.companions,
    });
  }

}
