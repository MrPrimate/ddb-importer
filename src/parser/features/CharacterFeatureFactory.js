import { DICTIONARY, SETTINGS } from "../../config/_module.mjs";
import { logger, utils, DDBCompendiumFolders, DDBItemImporter, DDBSources } from "../../lib/_module.mjs";
import DDBAction from "./DDBAction.js";
import DDBAttackAction from "./DDBAttackAction.js";
import DDBFeatureMixin from "./DDBFeatureMixin.js";
import DDBClassFeatures from "./DDBClassFeatures.js";
import {
  DDBGenericEnricher,
  DDBClassFeatureEnricher,
  DDBSpeciesTraitEnricher,
  DDBFeatEnricher,
  DDBBackgroundEnricher,
} from "../enrichers/_module.mjs";
import { DDBFeatureActivity } from "../activities/_module.mjs";
import DDBFeature from "./DDBFeature.js";
import DDBChoiceFeature from "./DDBChoiceFeature.js";
import { DDBDataUtils, SystemHelpers } from "../lib/_module.mjs";

export default class CharacterFeatureFactory {

  // feature parsing hints

  static LEGACY_SKIPPED_FEATURES = DICTIONARY.parsing.features.LEGACY_SKIPPED_FEATURES;

  static SKIPPED_FEATURES_2014 = DICTIONARY.parsing.features.SKIPPED_FEATURES_2014;

  static TASHA_VERSATILE = DICTIONARY.parsing.features.TASHA_VERSATILE;

  static SKIPPED_FEATURES = DICTIONARY.parsing.features.SKIPPED_FEATURES;

  static SKIPPED_FEATURES_STARTS_WITH = DICTIONARY.parsing.features.SKIPPED_FEATURES_STARTS_WITH;

  static SKIPPED_FEATURES_ENDS_WITH = DICTIONARY.parsing.features.SKIPPED_FEATURES_ENDS_WITH;

  static SKIPPED_FEATURES_INCLUDES = DICTIONARY.parsing.features.SKIPPED_FEATURES_INCLUDES;

  static IGNORED_PARENT_CHOICE_FEATURES = DICTIONARY.parsing.features.IGNORED_PARENT_CHOICE_FEATURES;

  // if there are duplicate name entries in your feature use this, due to multiple features in builder
  // and sheet with different descriptions.
  static FORCE_DUPLICATE_FEATURE = DICTIONARY.parsing.features.FORCE_DUPLICATE_FEATURE;

  static FORCE_DUPLICATE_OVERWRITE = DICTIONARY.parsing.features.FORCE_DUPLICATE_OVERWRITE;

  // always duplicate these features
  static FORCE_FEATURE_CLASS_MATCH = DICTIONARY.parsing.features.FORCE_FEATURE_CLASS_MATCH;

  constructor(ddbCharacter) {
    this.ddbCharacter = ddbCharacter;
    this.ddbData = ddbCharacter.source.ddb;
    this.rawCharacter = ddbCharacter.raw.character;

    this.parsed = {
      actions: [],
      features: [],
    };

    this.processed = {
      actions: [],
      features: [],
    };

    this.data = {
      actions: [],
      features: [],
    };

    this.excludedOriginFeatures = this.ddbData.character.optionalOrigins
      .filter((f) => f.affectedRacialTraitId)
      .map((f) => f.affectedRacialTraitId);
  }

  static isDuplicateFeature(items, item, { matchClass = false } = {}) {
    const forceFeatureClassMatch = matchClass || CharacterFeatureFactory.FORCE_FEATURE_CLASS_MATCH.includes(item.flags?.ddbimporter?.originalName ?? item.name);
    return items.some((dup) => {
      const classMatched = !forceFeatureClassMatch || (forceFeatureClassMatch
        && foundry.utils.hasProperty(dup.flags.ddbimporter, "class")
        && foundry.utils.hasProperty(item.flags.ddbimporter, "class")
        && dup.flags.ddbimporter.class === item.flags.ddbimporter.class);

      return dup.name === item.name && dup.system.description.value === item.system.description.value && classMatched;
    });
  }

  static getNameMatchedFeature(items, item, { matchClass = false } = {}) {
    const forceFeatureClassMatch = matchClass || CharacterFeatureFactory.FORCE_FEATURE_CLASS_MATCH.includes(item.flags?.ddbimporter?.originalName ?? item.name);
    return items.find((dup) => {
      const classMatched = !forceFeatureClassMatch || (forceFeatureClassMatch
        && foundry.utils.hasProperty(dup.flags.ddbimporter, "class")
        && foundry.utils.hasProperty(item.flags.ddbimporter, "class")
        && dup.flags.ddbimporter.class === item.flags.ddbimporter.class);

      return dup.name === item.name
        && item.flags.ddbimporter.type === dup.flags.ddbimporter.type
        && classMatched;
    });
  }

  static includedFeatureNameCheck(featName) {
    const includeTashaVersatile = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-include-versatile-features");

    // eslint-disable-next-line operator-linebreak
    const nameAllowed =
      !CharacterFeatureFactory.LEGACY_SKIPPED_FEATURES.includes(featName)
      && !CharacterFeatureFactory.SKIPPED_FEATURES.includes(featName)
      && !CharacterFeatureFactory.SKIPPED_FEATURES_STARTS_WITH.some((text) => featName.startsWith(text))
      && !CharacterFeatureFactory.SKIPPED_FEATURES_ENDS_WITH.some((text) => featName.endsWith(text))
      && !CharacterFeatureFactory.SKIPPED_FEATURES_INCLUDES.some((text) => featName.includes(text))
      && !featName.match(/(?:\w+) Weapon Masteries(?:y|ies)(?:$|:)/igm)
      && !featName.match(/(?:\d+:) Weapon Master(?:y|ies)(?:$|:)/igm)
      && (includeTashaVersatile || (!includeTashaVersatile && !CharacterFeatureFactory.TASHA_VERSATILE.includes(featName)));

    logger.debug(`Checking ${featName}, status: ${nameAllowed}`);

    return nameAllowed;
  }

  _getCustomActions(displayedAsAttack) {
    const customActions = this.ddbData.character.customActions
      .filter((action) => action.displayAsAttack === displayedAsAttack)
      .map((action) => {
        action.dice = {
          diceString: action.diceCount && action.diceType ? `${action.diceCount}d${action.diceType}` : null,
          fixedValue: action.fixedValue,
        };

        const range = {
          aoeType: action.aoeType,
          aoeSize: action.aoeSize,
          range: action.range,
          long: action.longRange,
        };
        action.range = range;

        if (action.statId) action.abilityModifierStatId = action.statId;

        action.activation = {
          activationTime: action.activationTime,
          activationType: action.activationType,
        };

        action.isCustomAction = true;

        return action;
      });

    return customActions;
  }

  async getUnarmedStrike(overrides = {}) {
    const unarmedStrikeMock = CONFIG.DDB.naturalActions[0];
    unarmedStrikeMock.displayAsAttack = true;
    const strikeMock = Object.assign(unarmedStrikeMock, overrides);
    strikeMock.sources = [
      {
        "sourceId": 148,
        "pageNumber": null,
        "sourceType": 2,
      },
      {
        "sourceId": 1,
        "pageNumber": null,
        "sourceType": 2,
      },
    ];

    const enricherClass = CharacterFeatureFactory.DDB_TYPE_ENRICHERS["other"];
    const enricher = new enricherClass({
      activityGenerator: DDBFeatureActivity,
    });
    await enricher.init();
    const feature = await this.getFeatureFromAction({
      action: strikeMock,
      enricher,
      isAttack: true,
    });

    return feature;

  }

  async _generateUnarmedStrikeAction(overrides = {}) {
    const action = await this.getUnarmedStrike(overrides);
    this.parsed.actions.push(action);
  }

  static DDB_TYPE_ENRICHERS = {
    "class": DDBClassFeatureEnricher,
    "race": DDBSpeciesTraitEnricher,
    "feat": DDBFeatEnricher,
    "other": DDBGenericEnricher,
    "background": DDBBackgroundEnricher,
  };

  async _generateAttackActions() {
    const attackActionsBase = [
      // do class options here have a class id, needed for optional class features
      this.ddbData.character.actions.class
        .filter((action) => DDBDataUtils.findClassByFeatureId(this.ddbData, action.componentId))
        .map((t) => {
          t.actionSource = "class";
          return t;
        }),
      this.ddbData.character.actions.race.map((t) => {
        t.actionSource = "race";
        return t;
      }),
      this.ddbData.character.actions.feat.map((t) => {
        t.actionSource = "feat";
        return t;
      }),
      this._getCustomActions(true),
    ]
      .flat()
      .filter((action) => action.name && action.name !== ""
        && (action.isCustomAction
        || DDBAction.KEEP_ACTIONS.some((a) => utils.nameString(action.name) === a)
        || DDBAction.KEEP_ACTIONS_2024.some((a) => utils.nameString(action.name) === a
          && !this.isAction2014(action)
          && action.activation?.activationType !== 3, // hardcoded to avoid bonus actions here
        )
        || DDBAction.KEEP_ACTIONS_STARTSWITH.some((a) => utils.nameString(action.name).startsWith(a))),
      )
      .filter((action) => DDBDataUtils.displayAsAttack(this.ddbData, action, this.rawCharacter));

    const attackActions = (await Promise.all(attackActionsBase
      .map(async (action) => {
        const enricherClass = CharacterFeatureFactory.DDB_TYPE_ENRICHERS[action.actionSource ?? "other"];
        const enricher = new enricherClass({
          activityGenerator: DDBFeatureActivity,
        });
        await enricher.init();
        const feature = await this.getFeatureFromAction({
          action,
          type: action.actionSource,
          enricher,
          isAttack: true,
        });
        return feature;
      })))
      .filter((a) => !foundry.utils.hasProperty(a, "flags.ddbimporter.skip"));

    logger.debug("attack actions", attackActions);
    this.parsed.actions = this.parsed.actions.concat(attackActions);
  }

  actionParsed(actionName) {
    // const attacksAsFeatures = game.settings.get("ddb-importer", "character-update-policy-use-actions-as-features");
    const exists = this.parsed.actions.some((attack) =>
      (foundry.utils.getProperty(attack, "flags.ddbimporter.originalName") ?? attack.name) === actionName,
    );
    return exists;
    // return attacksAsFeatures && exists;
  }

  _highestLevelActionFeature(action, type) {
    const feature = this.ddbData.character.actions[type]
      .filter((a) => a.name === action.name)
      .reduce((prev, cur) => {
        const klass = DDBDataUtils.findClassByFeatureId(this.ddbData, cur.componentId);
        const feature = klass.classFeatures.find((f) => f.definition.id === cur.componentId);
        if (!feature) return prev;
        if (feature.definition.requiredLevel > klass.level) return prev;
        return prev.definition.requiredLevel > feature.definition.requiredLevel ? prev : feature;
      }, { componentId: null, definition: { requiredLevel: 0 } });

    return feature;
  }

  isAction2014(action) {
    const klass = DDBDataUtils.findClassByFeatureId(this.ddbData, action.componentId);
    return klass.definition.sources.every((s) => DDBSources.is2014Source(s));
  }

  async _generateOtherActions() {
    // do class options here have a class id, needed for optional class features
    const classActions = this.ddbData.character.actions.class.filter((action) =>
      DDBDataUtils.findClassByFeatureId(this.ddbData, action.componentId)
      && (!DDBAction.HIGHEST_LEVEL_ONLY_ACTION_MATCH.includes(utils.nameString(action.name))
        || (DDBAction.HIGHEST_LEVEL_ONLY_ACTION_MATCH.includes(utils.nameString(action.name))
        && this._highestLevelActionFeature(action, "class")?.definition?.id === action.componentId)),
    ).map((t) => {
      t.actionSource = "class";
      return t;
    });

    const actionsToBuild = [
      classActions,
      this.ddbData.character.actions.race.map((t) => {
        t.actionSource = "race";
        return t;
      }),
      this.ddbData.character.actions.feat.map((t) => {
        t.actionSource = "feat";
        return t;
      }),
      this._getCustomActions(false),
    ]
      .flat()
      .filter((action) => action.name && action.name !== ""
        && (action.isCustomAction
        || DDBAction.KEEP_ACTIONS.some((a) => utils.nameString(action.name) === a)
        || DDBAction.KEEP_ACTIONS_2024.some((a) => utils.nameString(action.name) === a
          && !this.isAction2014(action)
          && action.activation?.activationType !== 3, // hardcoded to avoid bonus actions here
        )
        || DDBAction.KEEP_ACTIONS_STARTSWITH.some((a) => utils.nameString(action.name).startsWith(a))),
      )
      .filter((action) => {
        const name = DDBDataUtils.getName(this.ddbData, action, this.rawCharacter);
        // const displayAsAttack = DDBDataUtils.displayAsAttack(this.ddbData, action, this.rawCharacter);
        // lets grab other actions and add, make sure we don't get attack based ones that haven't parsed
        const isParsed = this.actionParsed(name);
        // console.warn("isParsed", { action, ddbname: name, isParsed });
        return !isParsed;
      });

    // console.warn("otherActions", {
    //   classActions,
    //   parsedActions: deepClone(this.parsed.actions),
    //   actionsToBuild,
    // });

    const otherActions = (await Promise.all(actionsToBuild
      .map(async(action) => {
        logger.debug(`Getting Other Action ${action.name}`);

        const enricherClass = CharacterFeatureFactory.DDB_TYPE_ENRICHERS[action.actionSource ?? "other"];
        const enricher = new enricherClass({
          activityGenerator: DDBFeatureActivity,
        });
        await enricher.init();

        const feature = await this.getFeatureFromAction({
          action,
          type: action.actionSource,
          enricher,
          isAttack: false,
        });
        return feature;
      })))
      .filter((a) => !foundry.utils.hasProperty(a, "flags.ddbimporter.skip"));

    logger.debug("other actions", otherActions);
    this.parsed.actions = this.parsed.actions.concat(otherActions);
  }

  async processActions() {
    await this._generateAttackActions();
    await this._generateUnarmedStrikeAction();
    await this._generateOtherActions();

    this.processed.actions = foundry.utils.duplicate(this.parsed.actions);

    this.processed.actions.sort().sort((a, b) => {
      if (!Object.values(a.system.activities).some((a) => foundry.utils.hasProperty(a, "activation.type"))) {
        return 1;
      } else if (!Object.values(b.system.activities).some((b) => foundry.utils.hasProperty(b, "activation.type"))) {
        return -1;
      } else {
        const aActionTypeID = DICTIONARY.actions.activationTypes.find(
          (type) => type.value === Object.values(a.system.activities).find((a) => foundry.utils.hasProperty(a, "activation.type")).activation.type,
        ).id;
        const bActionTypeID = DICTIONARY.actions.activationTypes.find(
          (type) => type.value === Object.values(b.system.activities).find((b) => foundry.utils.hasProperty(b, "activation.type")).activation.type,
        ).id;
        if (aActionTypeID > bActionTypeID) {
          return 1;
        } else if (aActionTypeID < bActionTypeID) {
          return -1;
        } else {
          return 0;
        }
      }
    });

    for (const action of this.processed.actions) {
      await DDBFeatureMixin.finalFixes(action);
    }

    this.updateIds("actions");
  }

  updateIds(type) {
    this.ddbCharacter.updateItemIds(this.processed[type]);
  }

  #itemGrantLink(feature, advancementIndex) {
    // "added": {
    //   "TlT20Gh1RofymIDY": "Compendium.dnd5e.classfeatures.Item.u4NLajXETJhJU31v",
    //   "2PZlmOVkOn2TbR1O": "Compendium.dnd5e.classfeatures.Item.hpLNiGq7y67d2EHA"
    // }
    const linkingData = foundry.utils.getProperty(feature, "flags.ddbimporter.advancementLink");
    const advancement = feature.system.advancement[advancementIndex];
    const dataLink = linkingData.find((d) => d._id === advancement._id);

    if (!dataLink || !linkingData || !advancement) {
      logger.warn(`Advancement for ${feature.name} (idx ${advancementIndex}) missing required data for linking`, {
        advancement,
        linkingData,
        dataLink,
      });
      return;
    }

    const added = {};
    for (const [advancementFeatureName, uuid] of Object.entries(dataLink.features)) {
      logger.debug(`Advancement ${advancement._id} searching for Feature ${advancementFeatureName} (${uuid})`, {
        advancement,
        advancementFeatureName,
        uuid,
      });

      const characterFeature = this.ddbCharacter.getDataFeature(advancementFeatureName);
      if (characterFeature) {
        logger.debug(`Advancement ${advancement._id} found Feature ${advancementFeatureName} (${uuid})`);
        added[characterFeature._id] = uuid;
        foundry.utils.setProperty(characterFeature, "flags.dnd5e.sourceId", uuid);
        foundry.utils.setProperty(
          characterFeature,
          "flags.dnd5e.advancementOrigin",
          `${feature._id}.${advancement._id}`,
        );
      }
    }

    if (Object.keys(added).length > 0) {
      advancement.value = {
        added,
      };
      feature.system.advancement[advancementIndex] = advancement;
    }
  }

  #addGenericAdvancementOrigins(types = ["actions", "features"]) {
    for (const type of types) {
      for (const feature of this.ddbCharacter.data[type]) {
        // eslint-disable-next-line no-continue
        if (foundry.utils.hasProperty(feature, "flags.dnd5e.advancementOrigin")) continue;
        const typeFlag = foundry.utils.getProperty(feature, "flags.ddbimporter.type")
          ?? foundry.utils.getProperty(feature, "flags.ddbimporter.dndbeyond.type");
        const classFlag = foundry.utils.getProperty(feature, "flags.ddbimporter.class")
          ?? foundry.utils.getProperty(feature, "flags.ddbimporter.dndbeyond.class");

        if (typeFlag == "race" && foundry.utils.hasProperty(this.ddbCharacter, "data.race._id")) {
          foundry.utils.setProperty(feature, "flags.dnd5e.advancementOrigin", `${this.ddbCharacter.data.race._id}`);
        } else if (typeFlag === "background") {
          const background = this.ddbCharacter.data.features.find((b) => b.type === "background");
          if (background) {
            foundry.utils.setProperty(feature, "flags.dnd5e.advancementOrigin", `${background._id}`);
          }
        } else if (typeFlag === "class" && classFlag) {
          const klass = this.ddbCharacter.data.classes.find(
            (k) => k.name === classFlag,
          );
          if (klass) {
            foundry.utils.setProperty(feature, "flags.dnd5e.advancementOrigin", `${klass._id}`);
          }
        }
      }
    }
  }

  linkFeatures(types = ["actions", "features"]) {
    logger.debug("Linking Feature Factory Advancements to Features", {
      CharacterFeatureFactory: this,
      types,
    });
    for (const type of types) {
      for (const feature of this.ddbCharacter.data[type]) {
        const linkingData = foundry.utils.getProperty(feature, "flags.ddbimporter.advancementLink");
        if (linkingData) {
          logger.debug("Linking Advancements to Features", {
            feature,
            linkingData,
          });
          for (let idx = 0; idx < feature.system.advancement.length; idx++) {
            const a = feature.system.advancement[idx];
            const dataLink = linkingData.find((d) => d._id === a._id);
            // eslint-disable-next-line max-depth
            if (a.type === "ItemGrant" && dataLink) {
              this.#itemGrantLink(feature, idx);
            }
          }
        }
      }
    }
    this.#addGenericAdvancementOrigins(types);
  }

  async getFeaturesFromDefinition(featDefinition, type, flags = {}) {
    const source = DDBSources.parseSource(featDefinition.definition ? featDefinition.definition : featDefinition);
    const ddbFeature = new DDBFeature({
      ddbCharacter: this.ddbCharacter,
      ddbData: this.ddbData,
      ddbDefinition: featDefinition,
      rawCharacter: this.rawCharacter,
      type,
      source,
      extraFlags: flags,
      fallbackEnricher: "Generic",
    });
    logger.debug(`Start CharacterFeatureFactory.getFeaturesFromDefinition (type: ${type}): ${ddbFeature.ddbDefinition.name}`);
    await ddbFeature.loadEnricher();
    logger.debug(`Loaded Enricher for ${ddbFeature.ddbDefinition.name}`);
    await ddbFeature.build();
    logger.debug(`CharacterFeatureFactory.getFeaturesFromDefinition (type: ${type}): ${ddbFeature.ddbDefinition.name}`, {
      ddbFeature,
      featDefinition,
      this: this,
      type,
    });
    // only background features get advancements for now
    if (type === "background") {
      ddbFeature.generateBackgroundAbilityScoreAdvancement();
      // console.warn("Generating background advancements", ddbFeature);
      await ddbFeature.generateAdvancements();
      await ddbFeature.buildBackgroundFeatAdvancements();
    }
    const choiceFeatures = ddbFeature.isChoiceFeature
      ? await DDBChoiceFeature.buildChoiceFeatures(ddbFeature)
      : [];

    const results = [];
    if (!CharacterFeatureFactory.IGNORED_PARENT_CHOICE_FEATURES.includes(ddbFeature.ddbDefinition.name)) {
      results.push(ddbFeature.data);
    }
    results.push(...choiceFeatures);

    return results;
  }

  fixAcEffects(type = "features") {
    for (const feature of this.parsed[type]) {
      logger.debug(`Checking ${feature.name} for AC effects`);
      for (const effect of (feature.effects ?? [])) {
        if (
          !["Custom", "Unarmored"].includes(this.ddbCharacter.armor.results.maxType)
          && (
            (effect.changes.filter((c) => c.key.startsWith("system.attributes.ac")).length >= 2
            && effect.changes.some((change) => change.key === "system.attributes.ac.formula")
            && effect.changes.some((change) => change.key === "system.attributes.ac.calc"))
            || (effect.changes.filter((c) => c.key.startsWith("system.attributes.ac")).length === 1
              && effect.changes.some((change) => change.key === "system.attributes.ac.calc"))
          )
        ) {
          if ((feature.flags.ddbimporter.type === "race" && this.ddbCharacter.armor.results.maxType === "Natural")
            || (feature.flags.ddbimporter.type === "class" && this.ddbCharacter.armor.results.maxType === "Unarmored Defense")
          ) {
            effect.disabled = false;
          } else {
            logger.debug(`Disabling AC effect on ${feature.name} as not applicable for armor type ${this.ddbCharacter.armor.results.maxType}`);
            effect.disabled = true;
          }
        }
      }
    }
  }

  async _buildRacialTraits(type = "features") {
    logger.debug("Parsing racial traits");
    const traits = this.ddbData.character.race.racialTraits
      .filter(
        (trait) => CharacterFeatureFactory.includedFeatureNameCheck(trait.definition.name)
          && !trait.definition.hideInSheet
          && !this.excludedOriginFeatures.includes(trait.definition.id)
          && (this.ddbCharacter.totalLevels >= (trait.definition.requiredLevel ?? 1)),
      );

    for (const trait of traits) {
      const features = await this.getFeaturesFromDefinition(trait, "race", {
        species: {
          fullRaceName: this.ddbCharacter._ddbRace.fullName,
          baseName: this.ddbCharacter._ddbRace.baseName,
          baseRaceName: this.ddbCharacter._ddbRace.baseRaceName,
          groupName: this.ddbCharacter._ddbRace.groupName,
          isLineage: this.ddbCharacter._ddbRace.isLineage,
        },
      });
      features.forEach((item) => {
        const existingFeature = CharacterFeatureFactory.getNameMatchedFeature(this.parsed[type], item);
        const duplicateFeature = CharacterFeatureFactory.isDuplicateFeature(this.parsed[type], item)
          // ||
          || CharacterFeatureFactory.FORCE_DUPLICATE_FEATURE.includes(item.flags.ddbimporter.originalName ?? item.name);
        logger.debug(`Processing racial trait ${item.name}`, {
          trait,
          existingFeature,
          duplicateFeature,
          item,
        });
        if (existingFeature && !duplicateFeature) {
          existingFeature.system.description.value += `<h3>Racial Trait Addition</h3>${item.system.description.value}`;
        } else if (existingFeature) {
          logger.debug(`Duplicate feature found for ${item.name}, skipping`, {
            existingFeature,
            trait,
          });
        } else if (!existingFeature) {
          foundry.utils.setProperty(item, "flags.ddbimporter.baseName", (trait.definition.fullName ?? trait.definition.name));
          foundry.utils.setProperty(item, "flags.ddbimporter.fullRaceName", this.ddbCharacter._ddbRace.fullName);
          foundry.utils.setProperty(item, "flags.ddbimporter.groupName", this.ddbCharacter._ddbRace.groupName);
          foundry.utils.setProperty(item, "flags.ddbimporter.isLineage", this.ddbCharacter._ddbRace.isLineage);
          this.parsed[type].push(item);
        }
      });
    };
  }

  async _addFeats(type = "features") {
    // add feats
    logger.debug("Parsing feats");
    const validFeats = this.ddbData.character.feats.filter((feat) =>
      CharacterFeatureFactory.includedFeatureNameCheck(feat.definition.name),
    ).filter((feat) => {
      if (feat.componentId === null) return true;
      const isComponentId = DDBDataUtils.findComponentByComponentId(this.ddbData, feat.componentId);
      if (isComponentId) return true;
      if (this.ddbData.character.background.definition?.grantedFeats?.find((f) => f.id === feat.componentId)) {
        return true;
      }

      for (const [key, choices] of Object.entries(this.ddbData.character.choices)) {
        if (!choices) continue;
        if (!["feat", "background", "class", "item", "race"].includes(key)) continue;
        const match = choices.some((choice) =>
          choice.componentId === feat.componentId
          && choice.componentTypeId === feat.componentTypeId
          && choice.optionValue === feat.definition.id,
        );
        if (match) return true;
      }

      if (feat.definition.categories.some((c) => ["__DISPLAY_WITH_DATA_ORIGIN", "__DISGUISE_FEAT"].includes(c.tagName))) {
        const classOptions = this.getValidOptionalClassFeatures({ requireLevel: true });
        const grantedFeat = classOptions.some((co) => co.grantedFeats.some((gf) => gf.featIds.some((id) => id === feat.definition.id)));
        return grantedFeat;
      }

      return true;
    });
    for (const feat of validFeats) {
      const feats = await this.getFeaturesFromDefinition(feat, "feat");
      this.parsed[type].push(...feats);
    };
  }

  async _addBackground(type = "features") {
    logger.debug("Parsing background");
    const backgroundFeature = this.ddbCharacter.getBackgroundData();
    const backgroundFeats = await this.getFeaturesFromDefinition(backgroundFeature, "background");
    this.parsed[type].push(...backgroundFeats);
  }

  getValidOptionalClassFeatures({ requireLevel = true } = {}) {
    return this.ddbData.classOptions
      .filter((feat) => {
        if (!requireLevel || !foundry.utils.hasProperty(feat, "requiredLevel")) return true;
        const requiredLevel = foundry.utils.getProperty(feat, "requiredLevel");
        const klass = this.ddbData.character.classes.find((cls) => cls.definition.id === feat.classId
          || cls.subclassDefinition?.id === feat.classId);
        if (!klass) {
          logger.info(`Unable to determine class for optional feature ${feat.name}, you might not have a suitable subclass`, { feat, this: this, requiredLevel });
          return false;
        }
        return klass.level >= requiredLevel;
      });
  }

  async _buildOptionalClassFeatures({ type = "features", requireLevel = true } = {}) {
    // optional class features
    logger.debug("Parsing optional class features");
    if (this.ddbData.classOptions) {
      const options = this.getValidOptionalClassFeatures({ requireLevel })
        .filter((feat) => CharacterFeatureFactory.includedFeatureNameCheck(feat.name));
      for (const feat of options) {
        logger.debug(`Parsing Optional Feature ${feat.name}`);
        const klass = this.ddbData.character.classes.find((cls) => cls.definition.id === feat.classId
            || cls.subclassDefinition?.id === feat.classId);
        const flags = {
          "ddbimporter": {
            class: klass.definition.name,
            classId: klass.definition.id,
            optionalFeature: true,
          },
        };
        const feats = await this.getFeaturesFromDefinition(feat, "class", flags);
        this.parsed[type].push(...feats);
      };
    }
  }

  _setLevelScales(type = "features") {
    for (const feature of this.parsed[type]) {
      if (foundry.utils.hasProperty(feature, "flags.ddbimporter.skipScale")) continue;

      if (DICTIONARY.parsing.levelScale.LEVEL_SCALE_EXCLUSIONS.includes(feature.name)) continue;

      const featureName = utils.referenceNameString(feature.name).toLowerCase();
      const scaleKlass = this.ddbCharacter.raw.classes.find((klass) =>
        klass.system.advancement
          .some((advancement) => advancement.type === "ScaleValue"
            && advancement.configuration.identifier === featureName,
          ));

      if (!scaleKlass) continue;

      const identifier = utils.referenceNameString(scaleKlass.system.identifier).toLowerCase();
      const damage = SystemHelpers.buildDamagePart({
        damageString: `@scale.${identifier}.${featureName}`,
      });
      if (foundry.utils.hasProperty(feature, "system.damage.base")) {
        feature.system.damage.base.custom = damage.custom;
      } else if (foundry.utils.hasProperty(feature, "system.activities")) {
        for (const [key, activity] of Object.entries(feature.system.activities)) {
          if (activity.damage && activity.damage.parts.length === 0) {
            activity.damage.parts = [damage];
          } else if (activity.damage && activity.damage.parts.length > 0) {
            activity.damage.parts[0].custom = damage.custom;
          }
          feature.system.activities[key] = activity;
        }
      }
    }
  }


  async _buildClassFeatures() {
    logger.debug("Parsing class and subclass features");
    this._ddbClassFeatures = new DDBClassFeatures({
      ddbCharacter: this.ddbCharacter,
      ddbData: this.ddbData,
      rawCharacter: this.rawCharacter,
    });
    await this._ddbClassFeatures.build();
    await this._buildOptionalClassFeatures();

    logger.debug("ddbClassFeatures._buildClassFeatures", {
      ddbClassFeature: this._ddbClassFeatures,
      this: this,
    });

    // now we loop over class features and add to list, removing any that match racial traits, e.g. Darkvision
    logger.debug("Removing matching traits");
    this._ddbClassFeatures.data.forEach((doc) => {
      const forceFeatureClassMatch = CharacterFeatureFactory.FORCE_FEATURE_CLASS_MATCH.includes(doc.flags.ddbimporter.originalName ?? doc.name);
      const existingFeature = CharacterFeatureFactory.getNameMatchedFeature(this.parsed.features, doc, { matchClass: forceFeatureClassMatch });
      const duplicateFeature = CharacterFeatureFactory.isDuplicateFeature(this.parsed.features, doc)
        || CharacterFeatureFactory.FORCE_DUPLICATE_FEATURE.includes(doc.flags.ddbimporter.originalName ?? doc.name);
      if (existingFeature && !duplicateFeature) {
        if (CharacterFeatureFactory.FORCE_DUPLICATE_OVERWRITE.includes(doc.flags.ddbimporter.originalName ?? doc.name)) {
          existingFeature.system.description.value = `${doc.system.description.value}`;
        } else {
          const klassAdjustment = `<h3>${doc.flags.ddbimporter.dndbeyond.class}</h3>${doc.system.description.value}`;
          existingFeature.system.description.value += klassAdjustment;
        }
      } else if (!existingFeature) {
        this.parsed.features.push(doc);
      }
    });
  }


  async processFeatures() {
    // const ddbFeatures = new DDBFeatures({
    //   ddbCharacter: this.ddbCharacter,
    //   ddbData: this.ddbData,
    //   rawCharacter: this.rawCharacter,
    // });

    // await CharacterFeatureFactory.build();
    // this.processed.features = CharacterFeatureFactory.data;
    await this._buildRacialTraits();
    await this._buildClassFeatures();
    await this._addFeats();
    await this._addBackground();

    this._setLevelScales();

    for (const feature of this.parsed.features) {
      await DDBFeatureMixin.finalFixes(feature);
    }
    this.fixAcEffects();
    this.processed.features = foundry.utils.deepClone(this.parsed.features);

    this.updateIds("features");

  }


  // helpers

  async getFeatureFromAction({ action, type, isAttack = null, manager = null, extraFlags = {}, enricher = null }) {
    const isAttackAction = isAttack ?? DDBDataUtils.displayAsAttack(this.ddbData, action, this.rawCharacter);
    const ddbAction = isAttackAction
      ? new DDBAttackAction({
        ddbCharacter: this.ddbCharacter,
        ddbData: this.ddbData,
        ddbDefinition: action,
        rawCharacter: this.rawCharacter,
        type: type ?? action.actionSource,
        extraFlags,
        enricher,
      })
      : new DDBAction({
        ddbCharacter: this.ddbCharacter,
        ddbData: this.ddbData,
        ddbDefinition: action,
        rawCharacter: this.rawCharacter,
        type: type ?? action.actionSource,
        extraFlags,
        enricher,
      });
    if (manager) ddbAction.enricher.manager = manager;
    logger.debug(`Building Action ${action.name}`, { ddbAction, isAttackAction });
    await ddbAction.loadEnricher();
    await ddbAction.build();
    return ddbAction.data;
  }

  getActions({ name, type }) {
    const nameMatchedActions = this.ddbData.character.actions[type].filter((a) => utils.nameString(a.name) === name);
    const levelAdjustedActions = nameMatchedActions.length > 1
      ? nameMatchedActions.filter((a) =>
        type !== "class"
          || this._highestLevelActionFeature(a, type)?.definition?.id === a.componentId,
      )
      : nameMatchedActions;

    const actions = levelAdjustedActions.map((a) => {
      a.actionSource = type;
      return a;
    });
    return actions;
  }

  // compendium additions

  async addToCompendiums(update = null, compendiumImportTypes = ["features", "traits", "feats", "backgrounds"]) {
    logger.verbose("Adding features to compendiums", { update, compendiumImportTypes, this: this });
    const updateFeatures = update ?? game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-update-add-features-to-compendiums");

    const documents = [];
    documents.push(...foundry.utils.deepClone(this.data.features));
    documents.push(...foundry.utils.deepClone(this.data.actions));

    const featTypeDocs = documents.filter((doc) => doc.type === "feat");

    // console.warn(`Processing ${featTypeDocs.length} feats into the feat compendium`, {
    //   featTypeDocs,
    //   documents,
    //   this: this,
    //   // data: foundry.utils.deepClone(this.data),
    //   updateFeatures,
    //   update,
    //   compendiumImportTypes,
    // });
    if (compendiumImportTypes.some((c) => ["features"].includes(c))) {

      const featureCompendiumFolders = new DDBCompendiumFolders("features");
      await featureCompendiumFolders.loadCompendium("features");

      const klassNames = [];
      for (const classDef of this.ddbData.character.classes) {
        klassNames.push(classDef.definition.name);
        const version = classDef.definition.sources.every((s) => DDBSources.is2014Source(s))
          ? "2014"
          : "2024";
        await featureCompendiumFolders.createClassFeatureFolder(classDef.definition.name, version);
        if (classDef.subclassDefinition) {
          const version = classDef.subclassDefinition.sources.every((s) => DDBSources.is2014Source(s))
            ? "2014"
            : "2024";
          await featureCompendiumFolders.createSubClassFeatureFolder(classDef.subclassDefinition.name, classDef.definition.name, version);
        }
      }

      const featureHandlerOptions = {
        chrisPremades: true,
        removeSRDDuplicates: false,
        filterDuplicates: false,
        deleteBeforeUpdate: false,
        matchFlags: ["id"],
        useCompendiumFolders: true,
        indexFilter: {
          fields: [
            "name",
            "flags.ddbimporter",
            "system.type.subtype",
          ],
        },
      };

      for (const klassName of klassNames) {
        logger.debug(`Processing class ${klassName} into the class compendium`);
        const classFeatures = featTypeDocs.filter((doc) =>
          ["class", "subclass"].includes(foundry.utils.getProperty(doc, "flags.ddbimporter.type"))
          && !foundry.utils.getProperty(doc, "flags.ddbimporter.infusionFeature")
          && (klassName === foundry.utils.getProperty(doc, "flags.ddbimporter.class")
          || klassName === foundry.utils.getProperty(doc, "flags.ddbimporter.dndbeyond.class")),
        ).map((doc) => {
          if (!doc.system.advancement) return doc;
          for (const advancement of doc.system.advancement) {
            delete advancement.value;
          }
          return doc;
        });

        logger.debug(`Adding class features for ${klassName} to the class compendium`, {
          classFeatures,
        });

        const featureHandler = await DDBItemImporter.buildHandler("features", classFeatures, updateFeatures, featureHandlerOptions);
        await featureHandler.buildIndex(featureHandlerOptions.indexFilter);
      }
    }

    if (compendiumImportTypes.some((c) => ["traits", "species"].includes(c))) {

      const traitCompendiumFolders = new DDBCompendiumFolders("traits");
      await traitCompendiumFolders.loadCompendium("traits");

      const traitFeatures = featTypeDocs.filter((doc) =>
        ["race", "trait", "species"].includes(foundry.utils.getProperty(doc, "flags.ddbimporter.type"))
        && !foundry.utils.hasProperty(doc, "flags.ddbimporter.dndbeyond.choice"),
      ).map((doc) => {
        if (!doc.system.advancement) return doc;
        for (const advancement of doc.system.advancement) {
          delete advancement.value;
        }
        return doc;
      });
      logger.debug(`Adding species traits to the species compendium`, {
        traitFeatures,
      });

      const isLineage = this.ddbCharacter._ddbRace.isLineage;
      await traitCompendiumFolders.createSubTraitFolders(this.ddbCharacter.raw.race);

      const traitHandlerOptions = {
        chrisPremades: true,
        matchFlags: isLineage ? ["groupName", "isLineage", "is2014", "legacy"] : ["fullRaceName", "groupName", "isLineage", "is2014", "legacy"],
        useCompendiumFolders: true,
        deleteBeforeUpdate: false,
      };

      const traitHandler = await DDBItemImporter.buildHandler("trait", traitFeatures, updateFeatures, traitHandlerOptions);
      await traitHandler.buildIndex(traitHandlerOptions.indexFilter);
    }

    const featHandlerOptions = {
      chrisPremades: true,
      deleteBeforeUpdate: false,
      matchFlags: ["id", "is2014"],
    };

    if (compendiumImportTypes.includes("feats")) {
      const featCompendiumFolders = new DDBCompendiumFolders("feats");
      await featCompendiumFolders.loadCompendium("feats");
      const featFeatures = featTypeDocs.filter((doc) =>
        ["feat"].includes(foundry.utils.getProperty(doc, "flags.ddbimporter.type"))
        && !foundry.utils.hasProperty(doc, "flags.ddbimporter.dndbeyond.choice"),
      ).map((doc) => {
        if (!doc.system.advancement) return doc;
        for (const advancement of doc.system.advancement) {
          delete advancement.value;
        }
        return doc;
      });
      logger.debug(`Adding feats to the feats compendium`, {
        featFeatures,
      });
      for (const feat of featFeatures) {
        await featCompendiumFolders.createFeatFolder(feat);
      }
      const featHandler = await DDBItemImporter.buildHandler("feats", featFeatures, updateFeatures, featHandlerOptions);
      await featHandler.buildIndex(featHandlerOptions.indexFilter);
    }

    if (compendiumImportTypes.includes("backgrounds")) {
      const backgroundCompendiumFolders = new DDBCompendiumFolders("backgrounds");
      await backgroundCompendiumFolders.loadCompendium("backgrounds");
      const backgroundFeatures = documents.filter((doc) =>
        ["background"].includes(foundry.utils.getProperty(doc, "flags.ddbimporter.type"))
        && !foundry.utils.hasProperty(doc, "flags.ddbimporter.dndbeyond.choice"),
      ).map((doc) => {
        if (!doc.system.advancement) return doc;
        for (const advancement of doc.system.advancement) {
          delete advancement.value;
        }
        return doc;
      });
      logger.debug(`Adding backgrounds to the backgrounds compendium`, {
        backgroundFeatures,
      });
      for (const feature of backgroundFeatures) {
        await backgroundCompendiumFolders.createBackgroundFolder(feature);
      }
      const backgroundHandler = await DDBItemImporter.buildHandler("background", backgroundFeatures, updateFeatures, featHandlerOptions);
      await backgroundHandler.buildIndex(featHandlerOptions.indexFilter);
    }

  }


  filterActionFeatures() {
    const alwaysUseFeatureDescription = true;

    // eslint-disable-next-line complexity
    this.data.actions = this.processed.actions.map((action) => {
      const originalActionName = foundry.utils.getProperty(action, "flags.ddbimporter.originalName") ?? action.name;
      const featureMatch = this.processed.features.find((feature) => {
        const originalFeatureName = foundry.utils.getProperty(feature, "flags.ddbimporter.originalName") ?? feature.name;
        const featureNamePrefix = originalFeatureName.split(":")[0].trim();
        const replaceRegex = new RegExp(`${utils.regexSanitizeString(featureNamePrefix)}(?:\\s*)-`);
        const featureFlagType = foundry.utils.getProperty(feature, "flags.ddbimporter.type");
        const actionFlagType = foundry.utils.getProperty(action, "flags.ddbimporter.type");
        const replacedActionName = originalActionName.replace(replaceRegex, `${featureNamePrefix}:`);
        // console.warn(`Checking "${originalActionName}" against "${originalFeatureName}"`, {
        //   action,
        //   feature,
        //   replacedActionName,
        //   originalFeatureName,
        //   featureFlagType,
        //   actionFlagType,
        //   nameMatch: originalFeatureName === originalActionName
        //     || replacedActionName === originalFeatureName,
        //   flagMatch: featureFlagType === actionFlagType,
        // });
        return (
          originalFeatureName === originalActionName
          || replacedActionName === originalFeatureName
          || feature.name === action.name
          || replacedActionName === feature.name
        )
        && featureFlagType === actionFlagType;
      });
      if (featureMatch) {
        const originalFeatureName = foundry.utils.getProperty(featureMatch, "flags.ddbimporter.originalName") ?? featureMatch.name;
        foundry.utils.setProperty(action, "flags.ddbimporter.featureNameMatch", originalFeatureName);
        if (action.system.description.value === "" || alwaysUseFeatureDescription) {
          action.system.description.value = featureMatch.system.description.value;
        }

        if (action.system.description.chat === "") {
          action.system.description.chat = featureMatch.system.description.chat;
        }

        action.system.source = featureMatch.system.source;

        foundry.utils.setProperty(action, "flags.ddbimporter.featureMeta", featureMatch.flags.ddbimporter);

        logger.debug(`Found match for ${originalActionName} and ${featureMatch.name}`, {
          action: foundry.utils.deepClone(action),
          feature: foundry.utils.deepClone(featureMatch),
        });
        if (Object.keys(action.system.activities).length === 0) {
          for (const [key, activity] of Object.entries(featureMatch.system.activities)) {
            // console.warn(`Checking activity ${key}`, activity);
            if (!action.system.activities[key]) {
              action.system.activities[key] = activity;
              continue;
            }
            if (action.system.activities[key] && action.system.activities[key].effects?.length === 0) {
              action.system.activities[key].effects = featureMatch.system.activities[key].effects;
            }
          }
        } else {
          for (const key of Object.keys(featureMatch.system.activities)) {
            if (action.system.activities[key] && action.system.activities[key].effects?.length === 0) {
              action.system.activities[key].effects = featureMatch.system.activities[key].effects;
            }
          }
        }


        if (Object.keys(featureMatch.system.activities).length === 0
          && Object.keys(action.system.activities).length > 0
          && featureMatch.effects.length > 0
          && action.effects.length === 0
        ) {
          for (const key of Object.keys(action.system.activities)) {
            if (foundry.utils.getProperty(action.system.activities[key], "flags.ddbimporter.noeffect")) continue;
            const effects = [];
            for (const effect of featureMatch.effects) {
              // eslint-disable-next-line max-depth
              if (effect.transfer) continue;
              // eslint-disable-next-line max-depth
              if (foundry.utils.getProperty(effect, "flags.ddbimporter.noeffect")) continue;
              const activityNameRequired = foundry.utils.getProperty(effect, "flags.ddbimporter.activityMatch");
              // eslint-disable-next-line max-depth
              if (activityNameRequired && action.system.activities[key].name !== activityNameRequired) continue;
              const effectId = effect._id ?? foundry.utils.randomID();
              effect._id = effectId;
              effects.push({ _id: effectId });
            }
            action.system.activities[key].effects = effects;
          }
        }

        if (action.effects && action.effects.length === 0
          && featureMatch.effects && featureMatch.effects.length > 0
        ) {

          action.effects = featureMatch.effects;
          const newFlags = foundry.utils.duplicate(featureMatch.flags);

          delete newFlags.ddbimporter;
          foundry.utils.mergeObject(action.flags, newFlags, { overwrite: true, insertKeys: true, insertValues: true });
        }

        if (featureMatch.system.uses.max
          && (utils.isString(featureMatch.system.uses.max)
          || !action.system.uses.max)
        ) {
          action.system.uses.max = featureMatch.system.uses.max;
        }

        if (foundry.utils.hasProperty(featureMatch, "system.prerequisites.level")) {
          foundry.utils.setProperty(action, "system.prerequisites.level", featureMatch.system.prerequisites.level);
        }
      }
      return action;
    });

    this.data.features = this.processed.features
      .filter((feature) => {
        const originalName = foundry.utils.getProperty(feature, "flags.ddbimporter.originalName") ?? feature.name;

        if (DDBAction.KEEP_ACTIONS.includes(originalName)) return true;
        const is2024 = foundry.utils.getProperty(feature, "flags.ddbimporter.is2024");
        if (DDBAction.KEEP_ACTIONS_2024.includes(originalName) && is2024) return true;
        return !this.data.actions.some((action) =>
          ((foundry.utils.getProperty(action, "flags.ddbimporter.originalName") ?? action.name).trim().toLowerCase() === originalName.trim().toLowerCase()
          || foundry.utils.getProperty(action, "flags.ddbimporter.featureNameMatch") === originalName)
          && foundry.utils.getProperty(action, "flags.ddbimporter.isCustomAction") !== true
          && foundry.utils.getProperty(feature, "flags.ddbimporter.type") === foundry.utils.getProperty(action, "flags.ddbimporter.type"),
        );
      });

  }

}
