import { DICTIONARY, SETTINGS } from "../../config/_module.mjs";
import { utils, logger, DDBSources, DDBSimpleMacro } from "../../lib/_module.mjs";
import { DDBFeatureActivity } from "../activities/_module.mjs";
import DDBCompanionFactory from "../companions/DDBCompanionFactory.mjs";
import DDBSummonsManager from "../companions/DDBSummonsManager.mjs";
import {
  DDBGenericEnricher,
  mixins,
  Effects,
  DDBFeatEnricher,
  DDBSpeciesTraitEnricher,
  DDBClassFeatureEnricher,
  DDBBackgroundEnricher,
} from "../enrichers/_module.mjs";
import {
  DDBDataUtils,
  DDBDescriptions,
  DDBModifiers,
  DDBTable,
  DDBTemplateStrings,
  SystemHelpers,
} from "../lib/_module.mjs";

export default class DDBFeatureMixin extends mixins.DDBActivityFactoryMixin {

  static LEVEL_SCALE_EXCLUSIONS = DICTIONARY.parsing.levelScale.LEVEL_SCALE_EXCLUSIONS;

  static LEVEL_SCALE_INFUSIONS = DICTIONARY.parsing.levelScale.LEVEL_SCALE_INFUSIONS;

  static NATURAL_WEAPONS = DICTIONARY.parsing.levelScale.NATURAL_WEAPONS;

  static SPECIAL_ADVANCEMENTS = DICTIONARY.parsing.levelScale.SPECIAL_ADVANCEMENTS;

  static UTILITY_FEATURES = DICTIONARY.parsing.levelScale.UTILITY_FEATURES;

  DDB_TYPE_ENRICHERS = {
    class: DDBClassFeatureEnricher,
    race: DDBSpeciesTraitEnricher,
    feat: DDBFeatEnricher,
    other: DDBGenericEnricher,
    background: DDBBackgroundEnricher,
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
    this.excludedScale
      = DDBFeatureMixin.LEVEL_SCALE_EXCLUSIONS.includes(this.ddbDefinition.name)
      || DDBFeatureMixin.LEVEL_SCALE_EXCLUSIONS.includes(this.data.name);
    this.levelScaleInfusion
      = DDBFeatureMixin.LEVEL_SCALE_INFUSIONS.includes(this.ddbDefinition.name)
      || DDBFeatureMixin.LEVEL_SCALE_INFUSIONS.includes(this.data.name);
    this.scaleValueLink = DDBDataUtils.getScaleValueString(this.ddbData, this.ddbDefinition).value;
    this.useScaleValueLink
      = !this.excludedScale && this.scaleValueLink && this.scaleValueLink !== "{{scalevalue-unknown}}";
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
    const klassActionComponent
      = DDBDataUtils.findComponentByComponentId(this.ddbData, this.ddbDefinition.id)
      ?? DDBDataUtils.findComponentByComponentId(this.ddbData, this.ddbDefinition.componentId);
    if (klassActionComponent) {
      foundry.utils.setProperty(this.data.flags, "ddbimporter.dndbeyond.levelScale", klassActionComponent.levelScale);
      foundry.utils.setProperty(
        this.data.flags,
        "ddbimporter.dndbeyond.levelScales",
        klassActionComponent.definition?.levelScales,
      );
      foundry.utils.setProperty(
        this.data.flags,
        "ddbimporter.dndbeyond.limitedUse",
        klassActionComponent.definition?.limitedUse,
      );
    }
  }

  _generateSaveFromDescription() {
    const description = this.ddbDefinition.description ?? this.ddbDefinition.snippet ?? "";
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
      race: this.ddbData.character.actions.race.some((ddbAction) => {
        const name = DDBDataUtils.getName(this.ddbData, ddbAction, this.rawCharacter);
        return name === this.data.name;
      }),
      feat: this.ddbData.character.actions.feat.some((ddbAction) => {
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
    let parent = null;
    if (this.ddbDefinition.componentId) {
      parent = DDBDataUtils.findComponentByComponentId(this.ddbData, this.ddbDefinition.componentId);
      if (parent) return parent;
      const choiceElement = this.ddbData.character.choices[this.type]?.find(
        (c) => c.optionValue === this.ddbDefinition.componentId,
      );
      if (choiceElement) {
        parent = DDBDataUtils.findComponentByComponentId(this.ddbData, choiceElement.componentId);
      }
    }
    return parent;
  }

  _checkSummons() {
    this.isCompanionFeature = this._isCompanionFeature();
    this.isCompanionFeatureOption = this._isCompanionFeatureOption();

    const isCompanionFeature = this.isCompanionFeature || this.isCompanionFeatureOption;
    this.isCompanionFeature2014 = this.is2014 && isCompanionFeature;
    this.isCompanionFeature2024 = !this.is2014 && isCompanionFeature;
    this.isCRSummonFeature2014
      = this.is2014 && DICTIONARY.companions.CR_SUMMONING_FEATURES_2014.includes(this.originalName);
    this.isCRSummonFeature2024
      = !this.is2014 && DICTIONARY.companions.CR_SUMMONING_FEATURES_2024.includes(this.originalName);

    this.isSummons
      = this.isCompanionFeature2014
      || this.isCompanionFeature2024
      || this.isCRSummonFeature2014
      || this.isCRSummonFeature2024;
  }

  _getRules() {
    const sources = this.ddbDefinition.sources ?? this._parent?.definition?.sources ?? [];
    const sourceIds = sources.map((sm) => sm.sourceId);
    this.legacy = CONFIG.DDB.sources.some(
      (ddbSource) =>
        sourceIds.includes(ddbSource.id) && DICTIONARY.sourceCategories.legacy.includes(ddbSource.sourceCategoryId),
    );
    this.is2014 = sources.every((s) => DDBSources.is2014Source(s));
    this.is2024 = !this.is2014;
  }

  constructor({
    ddbData,
    ddbDefinition,
    type,
    source,
    documentType = "feat",
    rawCharacter = null,
    activityType = null,
    extraFlags = {},
    enricher = null,
    ddbCharacter = null,
    fallbackEnricher = null,
    usesOnActivity = false,
    isMuncher = false,
  } = {}) {
    const addEffects = isMuncher
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
    this.isMuncher = isMuncher || this.isMuncher || this.ddbCharacter?.isMuncher;
    this._init();
    this.snippet = "";
    this.description = "";
    this.resourceCharges = null;
    this.activityType = activityType;

    this.klass = this.extraFlags.ddbimporter?.class ?? this.extraFlags.class;
    this.subKlass = this.extraFlags.ddbimporter?.subClass ?? this.extraFlags.subClass;
    this.species = this.extraFlags.ddbimporter?.species ?? this.extraFlags.species;

    // this._attacksAsFeatures = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-actions-as-features");

    this._parent = this._getActionParent();
    this._getRules();
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

    const localSource
      = this.source && utils.isObject(this.source) ? this.source : DDBSources.parseSource(this.ddbDefinition);

    this.data.system.source = localSource;
    this.data.system.source.rules = this.is2014 ? "2014" : "2024";

    this.fallbackEnricher = fallbackEnricher;

    this.enricher
      = enricher
      ?? new this.DDB_TYPE_ENRICHERS[type]({
        activityGenerator: DDBFeatureActivity,
        fallbackEnricher: this.fallbackEnricher,
      });
  }

  hasClassFeature({ featureName, className = null, subClassName = null } = {}) {
    return DDBDataUtils.hasClassFeature({
      ddbData: this.ddbData,
      featureName,
      className,
      subClassName,
    });
  }

  _getClassFeatureDescription(nameMatch = false) {
    if (!this.ddbData) return "";
    const componentId = this.ddbDefinition.componentId;
    const componentTypeId = this.ddbDefinition.componentTypeId;

    const findFeatureKlass = this.ddbData.character.classes.find((cls) =>
      cls.classFeatures.find(
        (feature) => feature.definition.id == componentId && feature.definition.entityTypeId == componentTypeId,
      ),
    );

    if (findFeatureKlass) {
      const feature = findFeatureKlass.classFeatures.find(
        (feature) =>
          feature.definition.id == componentId
          && feature.definition.entityTypeId == componentTypeId
          && (!nameMatch || (nameMatch && feature.definition.name == this.originalName)),
      );
      if (feature) {
        return DDBTemplateStrings.parse(
          this.ddbData,
          this.rawCharacter,
          feature.definition.description,
          this.ddbFeature,
        ).text;
      }
    }
    return "";
  }

  _getRaceFeatureDescription() {
    const componentId = this.ddbDefinition.componentId;
    const componentTypeId = this.ddbDefinition.componentTypeId;

    const feature = this.ddbData.character.race.racialTraits.find(
      (trait) => trait.definition.id == componentId && trait.definition.entityTypeId == componentTypeId,
    );

    if (feature) {
      return DDBTemplateStrings.parse(this.ddbData, this.rawCharacter, feature.definition.description, this.ddbFeature)
        .text;
    }
    return "";
  }

  getParsedActionType() {
    const description
      = this.ddbDefinition.description && this.ddbDefinition.description !== ""
        ? this.ddbDefinition.description
        : this.ddbDefinition.snippet && this.ddbDefinition.snippet !== ""
          ? this.ddbDefinition.snippet
          : null;

    if (!description) return undefined;
    // pcs don't have mythic
    const actionAction = description.match(/(?:as|spend|use) (?:a|an|your) action/gi);
    if (actionAction) return "action";
    const bonusAction = description.match(/(?:as|use|spend) (?:a|an|your) bonus action/gi);
    if (bonusAction) return "bonus";
    const reAction = description.match(/(?:as|use|spend) (?:a|an|your) reaction/gi);
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

    this.snippet
      = this.ddbDefinition.snippet && this.ddbDefinition.snippet !== ""
        ? DDBTemplateStrings.parse(this.ddbData, this.rawCharacter, this.ddbDefinition.snippet, this.ddbFeature).text
        : "";
    const rawSnippet = this.ddbDefinition.snippet ? this.snippet : "";

    this.description
      = this.ddbDefinition.description && this.ddbDefinition.description !== ""
        ? DDBTemplateStrings.parse(this.ddbData, this.rawCharacter, this.ddbDefinition.description, this.ddbFeature)
          .text
        : !useCombinedSetting || forceFull
          ? this.type === "race"
            ? this._getRaceFeatureDescription()
            : this._getClassFeatureDescription(!(useCombinedSetting || forceFull))
          : "";

    const extraDescription
      = extra && extra !== ""
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

    const repeatableRegex = /<strong>Repeatable\.<\/strong>/i;
    if (repeatableRegex.test(this.data.system.description.value)) {
      this.data.system.prerequisites.repeatable = true;
    }
  }

  // eslint-disable-next-line complexity
  _generateLimitedUse() {
    const uses = DDBDataUtils.getLimitedUses({
      data: this.ddbDefinition.limitedUse,
      description: this.ddbDefinition.description ?? "",
      scaleValue: this.useUsesScaleValueLink && this.scaleValueUsesLink ? this.scaleValueUsesLink : null,
    });

    if (uses) {
      this._generatedUses = uses;
      this.data.system.uses = uses;
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
      return this.ddbData.character.classes.some((k) =>
        k.classFeatures.some((feature) => feature.definition.name === "Martial Arts"),
      );
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
        const profBonus = CONFIG.DDB.levelProficiencyBonuses.find(
          (b) => b.level === this.ddbData.character.classes.reduce((p, c) => p + c.level, 0),
        )?.bonus;
        const replaceProf
          = this.ddbDefinition.snippet?.includes("{{proficiency#signed}}")
          && Number.parseInt(die.fixedValue) === Number.parseInt(profBonus);
        const diceString = replaceProf ? die.diceString.replace(`+ ${profBonus}`, "") : die.diceString;
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
            const scaleString
              = scaleValueLink && scaleValueLink !== "{{scalevalue-unknown}}" ? scaleValueLink : levelScaleDie.diceString;
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

      const empowered = this.hasClassFeature({ featureName: "Empowered Strike", className: "Monk" });
      // handle 2024 empowered strike adding force damage to unarmed strikes
      if (this.is2024 && this.originalName === "Unarmed Strike" && empowered) {
        damage.types.push("force");
      }
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
  static getFeatureSubtype(name, type, includePartial = true, categories = null) {
    if (type === "class") {
      if (name === "Ki") return "ki";
      // many ki abilities do not start with ki
      else if (name === "Channel Divinity") return "channelDivinity";
      else if (name === "Artificer Infusion") return "artificerInfusion";
      else if (name === "Invocation") return "eldritchInvocation";
      else if (name === "Fighting Style") return "fightingStyle";
      else if (name === "Additional Fighting Style") return "fightingStyle";
      else if (name === "Maneuver") return "maneuver";
      else if (name === "Maneuver Options") return "maneuver";
      else if (name === "Battle Master Maneuver") return "maneuver";
      else if (name === "Metamagic") return "metamagic";
      else if (name.startsWith("Pact of the")) return "pact";
      else if (name.startsWith("Pact Boon")) return "pact";
      else if (name === "Rune Carver") return "rune";
      else if (name === "Psionic Power") return "psionicPower";
      else if (name === "Hunter's Prey") return "huntersPrey";
      else if (name === "Defensive Tactics") return "defensiveTactic";
      else if (name === "Superior Hunter's Defense") return "superiorHuntersDefense";
      else if (name === "Arcane Shot Options") return "arcaneShot";
      else if (name === "Elemental Disciplines") return "elementalDiscipline";
      else if (name === "Eldritch Invocations") return "eldritchInvocation";

      if (includePartial) {
        if (name.startsWith("Ki:")) return "ki";
        // many ki abilities do not start with ki
        else if (name.startsWith("Channel Divinity")) return "channelDivinity";
        else if (name.startsWith("Artificer Infusion:")) return "artificerInfusion";
        else if (name.startsWith("Invocation:")) return "eldritchInvocation";
        else if (name.startsWith("Fighting Style:")) return "fightingStyle";
        else if (name.startsWith("Additional Fighting Style:")) return "fightingStyle";
        else if (name.startsWith("Maneuver:")) return "maneuver";
        else if (name.startsWith("Maneuvers:")) return "maneuver";
        else if (name.startsWith("Maneuver Options:")) return "maneuver";
        else if (name.startsWith("Battle Master Maneuver:")) return "maneuver";
        else if (["Metamagic:", "Metamagic - "].some((s) => name.startsWith(s))) return "metamagic";
        else if (name.startsWith("Pact of the")) return "pact";
        else if (name.startsWith("Rune Carver:")) return "rune";
        else if (name.startsWith("Psionic Power")) return "psionicPower";
        else if (name.startsWith("Hunter's Prey:")) return "huntersPrey";
        else if (name.startsWith("Defensive Tactics:")) return "defensiveTactic";
        else if (name.startsWith("Superior Hunter's Defense:")) return "superiorHuntersDefense";
        else if (name.startsWith("Arcane Shot Options:")) return "arcaneShot";
        else if (name.startsWith("Elemental Disciplines:")) return "elementalDiscipline";
        else if (name.startsWith("Eldritch Invocations:")) return "eldritchInvocation";
      }
    } else if (type === "feat" && categories) {
      if (categories.some((c) => c.tagName === "Origin")) return "origin";
      else if (categories.some((c) => c.tagName === "Fighting Style")) return "fightingStyle";
      else if (categories.some((c) => c.tagName === "Epic Boon")) return "epicBoon";
      else return "general";
    }
    return null;
  }

  // eslint-disable-next-line complexity
  _generateSystemSubType() {
    let subType = DDBFeatureMixin.getFeatureSubtype(this.data.name, this.type, true, this.ddbDefinition.categories);
    if (subType) {
      foundry.utils.setProperty(this.data, "system.type.subtype", subType);
      foundry.utils.setProperty(this.data, "flags.ddbimporter.subType", subType);
    }
  }

  _generateWeaponType() {
    if (this.documentType !== "weapon") return;

    const entry = this.naturalWeapon
      ? "natural"
      : DICTIONARY.actions.attackTypes.find((type) => type.attackSubtype === this.ddbDefinition.attackSubtype)?.value;
    const range = DICTIONARY.weapon.weaponRange.find((type) => type.attackType === this.ddbDefinition.attackTypeRange);
    this.data.system.type.value = entry ? entry : range ? `simple${range.value}` : "simpleM";
  }

  _generateSystemType() {
    if (this.documentType === "weapon") {
      this._generateWeaponType();
    } else {
      foundry.utils.setProperty(this.data, "system.type.value", this.type);
    }
  }

  _isCompanionFeature() {
    return (
      DICTIONARY.companions.COMPANION_FEATURES.includes(this.originalName)
      // only run this on class features
      && this.ddbData.character.classes.some((k) => k.classFeatures.some((f) => f.definition.name == this.originalName))
    );
  }

  _isCompanionFeatureOption() {
    for (const [parentFeature, childNames] of Object.entries(DICTIONARY.companions.COMPANION_OPTIONS)) {
      for (const childName of childNames) {
        if (this.originalName === parentFeature || this.originalName === `${parentFeature}: ${childName}`) {
          this.companionFeatureOption = {
            parentFeature,
            childName,
          };
          return true;
        }
      }
    }
    return foundry.utils.hasProperty(this, "companionFeatureOption.childName");
  }

  _getFullSummonsDescription() {
    if (this.isCompanionFeatureOption) {
      const ddbOption = this.ddbData.character.options.class.find(
        (o) => o.definition.name == this.companionFeatureOption.childName,
      );
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
    const description = this.ddbDefinition.description ?? this.ddbDefinition.snippet ?? "";
    const creature
      = /You touch (?:a|one) (?:willing |living )?creature|affecting one creature|creature you touch|a creature you|creature( that)? you can see|interrupt a creature|would strike a creature|creature of your choice|creature or object within range|cause a creature|creature must be within range|a creature in range|each creature within/gi;
    const creaturesRange
      = /(humanoid|monster|creature|target|beast)(s)? (or loose object )?(of your choice )?(that )?(you can see )?within range/gi;
    const targets = /attack against the target|at a target in range/gi;
    return description.match(creature) || description.match(creaturesRange) || description.match(targets);
  }

  /** @override */
  _getActivitiesType() {
    if (this.isSummons) return "summon";
    // lets see if we have a save stat for things like Dragon born Breath Weapon
    if (typeof this.ddbDefinition.saveStatId === "number" || this._descriptionSave) return "save";
    if (this.ddbDefinition.actionType === 1) return "attack";
    if (this.ddbDefinition.rangeId && this.ddbDefinition.rangeId === 1) return "attack";
    if (this.ddbDefinition.rangeId && this.ddbDefinition.rangeId === 2) return "attack";
    if (this.isAction && this.getDamageDie()) return "damage";
    if (this.data.system.uses?.max && this.data.system.uses.max !== "0") return "utility";
    if (this.data.effects.length > 0 || this.enricher.effects?.length > 0) return "utility";
    if (DDBFeatureMixin.UTILITY_FEATURES.some((f) => this.originalName.startsWith(f))) return "utility";
    if (this.isForceResourceLinked()) return "utility";
    if (this.getParsedActionType()) return "utility";
    if (this.isAction) return "utility";
    return null;
  }

  /** @override */
  async _generateActivity(
    { hintsOnly = false, statusEffects = true, name = null, nameIdPostfix = null, typeOverride = null } = {},
    optionsOverride = {},
  ) {
    if (this.enricher.activity?.type === "none") return undefined;

    if (statusEffects) {
      const statusEffect = Effects.AutoEffects.getStatusEffect({
        ddbDefinition: this.ddbDefinition,
        foundryItem: this.data,
      });
      if (statusEffect) this.data.effects.push(statusEffect);
    }

    if (hintsOnly && !this.enricher.activity) {
      await this.enricher.customFunction({
        name,
      });
      return undefined;
    }

    const activity = await super._generateActivity(
      {
        hintsOnly,
        name,
        nameIdPostfix,
        typeOverride: typeOverride ?? this.enricher.type ?? this.enricher.activity?.type ?? this.activityType,
      },
      optionsOverride,
    );

    await this.enricher.customFunction({
      name,
      activity,
    });

    if (!activity) return undefined;

    const activityData = foundry.utils.getProperty(this.data, `system.activities.${activity}`);
    if (activityData?.type === "summon") {
      if (this.isCompanionFeature2014 || this.isCompanionFeature2024) {
        await this.ddbCompanionFactory.addCompanionsToDocuments([], activityData, this.enricher.activity);
      } else if (this.isCRSummonFeature2024 || this.isCRSummonFeature2014) {
        await this.ddbCompanionFactory.addCRSummoning(activityData);
      }
    }

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
    if (this.enricher.generateSummons) {
      const summons = await this.enricher.summonsFunction({
        ddbParser: this,
        document: this.data,
        raw: this.ddbDefinition.description,
        text: this.data.system.description,
      });

      await DDBSummonsManager.addGeneratedSummons(summons);
    }
  }

  createCompanionFactory() {
    const createOrUpdate
      = this.isMuncher
      || game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-create-companions")
      || this.ddbCharacter.enableCompanions;
    this.ddbCompanionFactory = new DDBCompanionFactory(this.ddbDefinition.description, {
      type: "feature",
      originDocument: this.data,
      is2014: this.is2014,
      notifier: this.notifier,
      folderHint: foundry.utils.getProperty(this.data, "flags.ddbimporter.summons.folder"),
      createCompanions: createOrUpdate,
      updateCompanions: createOrUpdate,
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
    await this.ddbCompanionFactory.updateOrCreateCompanions();

    logger.debug(`parsed companions for ${this.data.name}`, {
      factory: this.ddbCompanionFactory,
      parsed: this.ddbCompanionFactory.companions,
    });
  }
}
