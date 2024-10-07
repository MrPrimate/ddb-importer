import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper.js";
import logger from "../../logger.js";
import DDBAction from "./DDBAction.js";
import DDBAttackAction from "./DDBAttackAction.js";
import DDBBaseFeature from "./DDBBaseFeature.js";
import DDBFeatures from "./DDBFeatures.js";
import { addExtraEffects } from "./extraEffects.js";
import DDBFeatureEnricher from "../enrichers/DDBFeatureEnricher.js";
import utils from "../../lib/utils.js";

export default class CharacterFeatureFactory {
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

    this.data = [];
    this.enricher = new DDBFeatureEnricher();
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

  /**
   * Everyone has an Unarmed Strike
   */
  getUnarmedStrike(overrides = {}) {
    const unarmedStrikeMock = CONFIG.DDB.naturalActions[0];
    unarmedStrikeMock.displayAsAttack = true;
    const strikeMock = Object.assign(unarmedStrikeMock, overrides);

    const unarmedStrikeAction = new DDBAttackAction({
      ddbData: this.ddbData,
      ddbDefinition: strikeMock,
      rawCharacter: this.rawCharacter,
      enricher: this.enricher,
    });
    unarmedStrikeAction.build();

    // console.warn(`unarmedStrikeAction for Unarmed strike`, unarmedStrikeAction);
    return unarmedStrikeAction.data;
  }

  _generateUnarmedStrikeAction(overrides = {}) {
    this.parsed.actions.push(this.getUnarmedStrike(overrides));
  }

  async _generateAttackActions() {
    const attackActionsBase = [
      // do class options here have a class id, needed for optional class features
      this.ddbData.character.actions.class
        .filter((action) => DDBHelper.findClassByFeatureId(this.ddbData, action.componentId))
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
        && !DDBAction.SKIPPED_ACTIONS_STARTSWITH.some((a) => utils.nameString(action.name).startsWith(a))
        && !DDBAction.SKIPPED_ACTIONS.some((a) => utils.nameString(action.name) === a),
      )
      .filter((action) => DDBHelper.displayAsAttack(this.ddbData, action, this.rawCharacter));

    const attackActions = (await Promise.all(attackActionsBase
      .map(async (action) => {
        const ddbAttackAction = new DDBAttackAction({
          ddbData: this.ddbData,
          ddbDefinition: action,
          rawCharacter: this.rawCharacter,
          type: action.actionSource,
          enricher: this.enricher,
        });
        ddbAttackAction.build();

        logger.debug(`Building Attack Action ${action.name}`, { ddbAttackAction });

        // console.warn(`ddbAttackAction for ${action.name}`, ddbAttackAction);
        return ddbAttackAction.data;
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
        const klass = DDBHelper.findClassByFeatureId(this.ddbData, cur.componentId);
        const feature = klass.classFeatures.find((f) => f.definition.id === cur.componentId);
        if (feature.definition.requiredLevel > klass.level) return prev;
        return prev.definition.requiredLevel > feature.definition.requiredLevel ? prev : feature;
      }, { componentId: null, definition: { requiredLevel: 0 } });

    return feature;
  }

  async _generateOtherActions() {
    // do class options here have a class id, needed for optional class features
    const classActions = this.ddbData.character.actions.class.filter((action) =>
      DDBHelper.findClassByFeatureId(this.ddbData, action.componentId)
      && (!DDBAction.HIGHEST_LEVEL_ONLY_ACTION_MATCH.includes(utils.nameString(action.name))
        || (DDBAction.HIGHEST_LEVEL_ONLY_ACTION_MATCH.includes(utils.nameString(action.name))
        && this._highestLevelActionFeature(action, "class")?.definition?.id === action.componentId)),
    );

    const actionsToBuild = [
      classActions,
      this.ddbData.character.actions.race,
      this.ddbData.character.actions.feat,
      this._getCustomActions(false),
    ]
      .flat()
      .filter((action) => action.name && action.name !== ""
        && !DDBAction.SKIPPED_ACTIONS_STARTSWITH.some((a) => utils.nameString(action.name).startsWith(a))
        && !DDBAction.SKIPPED_ACTIONS.some((a) => utils.nameString(action.name) === a),
      )
      .filter((action) => {
        const name = DDBHelper.getName(this.ddbData, action, this.rawCharacter);
        // const displayAsAttack = DDBHelper.displayAsAttack(this.ddbData, action, this.rawCharacter);
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

        const ddbAction = new DDBAction({
          ddbData: this.ddbData,
          ddbDefinition: action,
          rawCharacter: this.rawCharacter,
          enricher: this.enricher,
        });
        ddbAction.build();
        logger.debug(`Building Other Action ${action.name}`, { ddbAction });

        return ddbAction.data;
      })))
      .filter((a) => !foundry.utils.hasProperty(a, "flags.ddbimporter.skip"));

    logger.debug("other actions", otherActions);
    this.parsed.actions = this.parsed.actions.concat(otherActions);
  }

  async processActions() {
    await this.enricher.init();
    await this._generateAttackActions();
    this._generateUnarmedStrikeAction();
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
      await DDBBaseFeature.finalFixes(action);
    }

    this.processed.actions = await addExtraEffects(this.ddbData, this.processed.actions, this.rawCharacter);
    this.updateIds("actions");
    this.data.push(...this.processed.actions);
  }

  updateIds(type) {
    this.ddbCharacter.updateItemIds(this.processed[type]);
  }

  async processFeatures() {
    const ddbFeatures = new DDBFeatures({
      ddbCharacter: this.ddbCharacter,
      ddbData: this.ddbData,
      rawCharacter: this.rawCharacter,
    });

    await ddbFeatures.build();
    this.processed.features = ddbFeatures.data;
    this.updateIds("features");
    this.data.push(...ddbFeatures.data);
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
}
