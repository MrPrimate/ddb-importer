import DDBFeature from "./DDBFeature.js";
import { utils, logger } from "../../lib/_module.mjs";
import { DICTIONARY } from "../../config/_module.mjs";
import { DDBDataUtils } from "../lib/_module.mjs";

export default class DDBChoiceFeature extends DDBFeature {

  static KEEP_CHOICE_FEATURE = DICTIONARY.parsing.choiceFeatures.KEEP_CHOICE_FEATURE;

  static KEEP_CHOICE_FEATURE_NAME = DICTIONARY.parsing.choiceFeatures.KEEP_CHOICE_FEATURE_NAME;

  static KEEP_CHOICE_FEATURE_NAME_STARTSWITH = DICTIONARY.parsing.choiceFeatures.KEEP_CHOICE_FEATURE_NAME_STARTSWITH;

  static NO_FEATURE_PREFIX_NAME = DICTIONARY.parsing.choiceFeatures.NO_FEATURE_PREFIX_NAME;

  static NO_CHOICE_BUILD = DICTIONARY.parsing.choiceFeatures.NO_CHOICE_BUILD;

  static NO_CHOICE_ACTIVITY = DICTIONARY.parsing.choiceFeatures.NO_CHOICE_ACTIVITY;

  static OVERRIDE_CHOICE_FEATURE = DICTIONARY.parsing.choiceFeatures.OVERRIDE_CHOICE_FEATURE;

  _prepare() {
    this._levelScale = null;
    this._levelScales = null;
    this._limitedUse = null;
    this._classOption = null;

    this._classFeatureComponent = DDBDataUtils.findComponentByComponentId(this.ddbData, this.ddbDefinition.id);

    if (!this._classFeatureComponent) {
      this._classOption = [
        this.ddbData.character.options.race,
        this.ddbData.character.options.class,
        this.ddbData.character.options.feat,
      ]
        .flat()
        .find((option) => option.definition.id === this.ddbDefinition.componentId);
      if (this._classOption) {
        this._classFeatureComponent = DDBDataUtils.findComponentByComponentId(this.ddbData, this._classOption.componentId);
      }
    }

    if (this._classFeatureComponent) {
      this._levelScale = this._classFeatureComponent.levelScale;
      this._levelScales = this._classFeatureComponent.definition?.levelScales;
      this._limitedUse = this._classFeatureComponent.definition?.limitedUse;
    }

    this.data.flags = foundry.utils.mergeObject(this.data.flags, this.extraFlags);

  }

  async build(choice) {
    try {
      this._generateSystemType();

      logger.debug(`Adding choice ${choice.label} to ${this.data.name}`);
      const originalName = `${this.data.name}`;

      if (this.data.name === choice.label) {
        this._generateSystemSubType();
        return;
      }

      const replaceRegex = new RegExp(`${this.data.name}(?:\\s*)- `);
      this.data.name = !DDBChoiceFeature.KEEP_CHOICE_FEATURE_NAME.includes(this.ddbDefinition.name)
        && !DDBChoiceFeature.KEEP_CHOICE_FEATURE_NAME_STARTSWITH.some((prefix) => this.ddbDefinition.name.startsWith(prefix))
        && choice.label
        ? choice.label.startsWith(this.data.name.trim())
          ? choice.label.replace(replaceRegex, `${this.data.name}: `)
          : `${this.data.name}: ${choice.label}`
        : this.data.name;
      if (DDBChoiceFeature.NO_FEATURE_PREFIX_NAME.includes(this.ddbDefinition.name)) {
        const replace2Regex = new RegExp(`(${this.ddbDefinition.name}(?:[\\s:-]*))`);
        this.data.name = `${this.data.name}`.replace(replace2Regex, "");
      }

      this.data.name = utils.nameString(this.data.name);
      const intMatch = /^(\d+: )(.*)$/;
      const intNameMatch = intMatch.exec(this.data.name);
      if (intNameMatch) {
        this.data.name = intNameMatch[2].trim();
      }
      const namePointRegex = /(.*) \((\d) points?\)/i;
      const nameMatch = this.data.name.match(namePointRegex);
      if (nameMatch) {
        this.data.name = nameMatch[1];
        this.resourceCharges = Number.parseInt(nameMatch[2]);
      }
      this.originalName = `${this.data.name}`;
      foundry.utils.setProperty(this.data, "flags.ddbimporter.originalName", this.originalName);
      await this.loadEnricher();
      this._generateSystemSubType();

      // get description for chris premades
      this.ddbDefinition.description = choice.description;
      this.ddbDefinition.snippet = choice.snippet ? choice.snippet : "";
      this._generateDescription({ forceFull: true });
      foundry.utils.setProperty(this.data, "flags.ddbimporter.initialFeature", foundry.utils.deepClone(this.data.system.description));
      foundry.utils.setProperty(this.ddbDefinition, "flags.ddbimporter.dndbeyond.choice", choice);

      this._checkSummons();
      await this._generateSummons();
      await this._generateCompanions();
      if (!this.enricher.stopDefaultActivity)
        await this._generateActivity();
      await this.enricher.addAdditionalActivities(this);

      this._generateLimitedUse();
      this._generateDescription({ forceFull: false });

      this.data.flags.ddbimporter.dndbeyond.choice = {
        parentName: originalName,
        label: choice.label,
        choiceId: choice.choiceId,
        componentId: choice.componentId,
        componentTypeId: choice.componentTypeId,
        parentChoiceId: choice.parentChoiceId,
        subType: choice.subType,
        wasOption: choice.wasOption,
        entityTypeId: choice.entityTypeId,
        type: choice.type,
      };

      this.data._id = foundry.utils.randomID();

      this.cleanup();
      await this.enricher.addDocumentOverride();
      await this._addEffects(choice, this.type);
      this.data.system.identifier = utils.referenceNameString(`${this.data.name.toLowerCase()}`); // ${this.is2014 ? " - legacy" : ""}`);

    } catch (err) {
      logger.warn(
        `Unable to Generate Choice Action: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension",
      );
      logger.error("Error", err);
    }
  }

  static NEVER_CHOICES = [
    "Strength",
    "Dexterity",
    "Constitution",
    "Intelligence",
    "Wisdom",
    "Charisma",
    "Strength Score",
    "Dexterity Score",
    "Constitution Score",
    "Intelligence Score",
    "Wisdom Score",
    "Charisma Score",
  ];

  static _copyFlags = [
    "class",
    "classId",
    "baseName",
    "fullRaceName",
    "groupName",
    "isLineage",
    "optionalFeature",
    "subClass",
    "subClassId",
  ];

  // eslint-disable-next-line complexity
  static async buildChoiceFeatures(ddbFeature, allFeatures = false) {
    const features = [];
    if (DDBChoiceFeature.NO_CHOICE_BUILD.includes(ddbFeature.originalName)) return features;
    const parseAllFeatures = ddbFeature.enricher.parseAllChoiceFeatures || allFeatures;
    const choices = (parseAllFeatures ? ddbFeature._parentOnlyChoices : ddbFeature._parentOnlyChosen)
      .filter((c) => !DDBChoiceFeature.NEVER_CHOICES.includes(c.label)); ;
    logger.debug(`Processing Choice Features ${choices.map((c) => c.label).join(",")}`, {
      _choices: ddbFeature._choices,
      _parentOnlyChoices: ddbFeature._parentOnlyChoices,
      _parentOnlyChosen: ddbFeature._parentOnlyChosen,
      choices,
      _chosen: ddbFeature._chosen,
      feature: ddbFeature,
      allFeatures,
    });

    const extraFlags = {
      ddbimporter: {
        summons: {
          folder: ddbFeature.originalName,
        },
      },
    };

    for (const flag of DDBChoiceFeature._copyFlags) {
      const realFlag = foundry.utils.getProperty(ddbFeature.data.flags, `ddbimporter.${flag}`);
      if (realFlag) {
        foundry.utils.setProperty(extraFlags, `ddbimporter.${flag}`, realFlag);
      }
    }
    for (const choice of choices) {
      const choiceFeature = new DDBChoiceFeature({
        ddbData: ddbFeature.ddbData,
        ddbDefinition: foundry.utils.deepClone(ddbFeature.ddbDefinition),
        type: ddbFeature.type,
        rawCharacter: ddbFeature.rawCharacter,
        extraFlags,
        ddbCharacter: ddbFeature.ddbCharacter,
        documentType: ddbFeature.documentType,
        fallbackEnricher: ddbFeature.fallbackEnricher,
      });
      await choiceFeature.build(choice);
      logger.debug(`DDBChoiceFeature.buildChoiceFeatures: ${choiceFeature.ddbDefinition.name}`, {
        choiceFeature,
        choice,
        ddbFeature,
      });
      // console.warn(`Choice generation ${choiceFeature.data.name}`, {
      //   data: deepClone(choiceFeature.data),
      // });
      if (choices.length === 1
        && !DDBChoiceFeature.KEEP_CHOICE_FEATURE.includes(ddbFeature.originalName)
      ) {
        ddbFeature.data.name = choiceFeature.data.name;
        if ((Object.keys(ddbFeature.data.system.activities).length === 0
          && !DDBChoiceFeature.NO_CHOICE_ACTIVITY.some((a) => ddbFeature.originalName.startsWith(a)))
          || DDBChoiceFeature.OVERRIDE_CHOICE_FEATURE.includes(ddbFeature.originalName)
        ) {
          ddbFeature.data.system.activities = choiceFeature.data.system.activities;
        }
        if (ddbFeature.data.effects.length === 0
          || DDBChoiceFeature.OVERRIDE_CHOICE_FEATURE.includes(ddbFeature.originalName)
        ) {
          ddbFeature.data.effects = choiceFeature.data.effects;
        }
        if (["", null, undefined].includes(ddbFeature.data.system.uses?.max)
          || DDBChoiceFeature.OVERRIDE_CHOICE_FEATURE.includes(ddbFeature.originalName)
        ) {
          ddbFeature.data.system.uses = choiceFeature.data.system.uses;
        }
      } else if (ddbFeature.isCompanionFeatureOption || ddbFeature.isCompanionFeature) {
        // eslint-disable-next-line no-unused-vars
        for (const [key, activity] of Object.entries(ddbFeature.data.system.activities)) {
          if (activity.type !== "summon") continue;
          // eslint-disable-next-line no-unused-vars
          for (const [cKey, cActivity] of Object.entries(choiceFeature.data.system.activities)) {
            // eslint-disable-next-line max-depth
            if (cActivity.type !== "summon") continue;
            activity.bonuses = cActivity.bonuses;
            activity.match = cActivity.match;
            activity.profiles.push(...cActivity.profiles);
          }
        }
      } else {
        features.push(choiceFeature.data);
      }
    }

    return features;
  }

}
