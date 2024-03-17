import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper.js";
import logger from "../../logger.js";
import { getInfusionActionData } from "../item/infusions.js";
import DDBAction from "./DDBAction.js";
import DDBAttackAction from "./DDBAttackAction.js";
import DDBFeatures from "./DDBFeatures.js";
import { addExtraEffects, fixFeatures } from "./fixes.js";


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

    const unarmedStrikeAction = new DDBAttackAction({ ddbData: this.ddbData, ddbDefinition: strikeMock, rawCharacter: this.rawCharacter });
    unarmedStrikeAction.build();

    // console.warn(`unarmedStrikeAction for Unarmed strike`, unarmedStrikeAction);
    return unarmedStrikeAction.data;
  }

  _generateUnarmedStrikeAction(overrides = {}) {
    this.parsed.actions.push(this.getUnarmedStrike(overrides));
  }


  _generateAttackActions() {
    const attackActions = [
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
      getInfusionActionData(this.ddbData),
    ]
      .flat()
      .filter((action) => DDBHelper.displayAsAttack(this.ddbData, action, this.rawCharacter))
      .map((action) => {
        const ddbAttackAction = new DDBAttackAction({ ddbData: this.ddbData, ddbDefinition: action, rawCharacter: this.rawCharacter, type: action.actionSource });
        ddbAttackAction.build();

        // console.warn(`ddbAttackAction for ${action.name}`, ddbAttackAction);
        return ddbAttackAction.data;
      });
    logger.debug("attack actions", attackActions);
    this.parsed.actions = this.parsed.actions.concat(attackActions);
  }


  actionParsed(actionName) {
    // const attacksAsFeatures = game.settings.get("ddb-importer", "character-update-policy-use-actions-as-features");
    const exists = this.parsed.actions.some((attack) => attack.name === actionName);
    return exists;
    // return attacksAsFeatures && exists;
  }

  _generateOtherActions() {
    const otherActions = [
      // do class options here have a class id, needed for optional class features
      this.ddbData.character.actions.class.filter((action) => DDBHelper.findClassByFeatureId(this.ddbData, action.componentId)),
      this.ddbData.character.actions.race,
      this.ddbData.character.actions.feat,
      this._getCustomActions(false),
      getInfusionActionData(this.ddbData),
    ]
      .flat()
      .filter((action) => action.name && action.name !== "")
      .filter(
        (action) => {
          const name = DDBHelper.getName(this.ddbData, action, this.rawCharacter);
          // const displayAsAttack = DDBHelper.displayAsAttack(this.ddbData, action, this.rawCharacter);
          // lets grab other actions and add, make sure we don't get attack based ones that haven't parsed
          return !this.actionParsed(name);
        }
      )
      .map((action) => {
        logger.debug(`Getting Other Action ${action.name}`);

        const ddbAction = new DDBAction({ ddbData: this.ddbData, ddbDefinition: action, rawCharacter: this.rawCharacter });
        ddbAction.build();
        // console.warn(`ddbAction for ${action.name}`, ddbAction);

        return ddbAction.data;
      });

    logger.debug("other actions", otherActions);
    this.parsed.actions = this.parsed.actions.concat(otherActions);
  }

  async processActions() {
    this._generateAttackActions();
    this._generateUnarmedStrikeAction();
    this._generateOtherActions();

    this.processed.actions = foundry.utils.duplicate(this.parsed.actions);

    this.processed.actions.sort().sort((a, b) => {
      if (!a.system.activation.activationType) {
        return 1;
      } else if (!b.system.activation.activationType) {
        return -1;
      } else {
        const aActionTypeID = DICTIONARY.actions.activationTypes.find(
          (type) => type.value === a.system.activation.activationType
        ).id;
        const bActionTypeID = DICTIONARY.actions.activationTypes.find(
          (type) => type.value === b.system.activation.activationType
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

    await fixFeatures(this.processed.actions);
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
        foundry.utils.setProperty(characterFeature, "flags.dnd5e.advancementOrigin", `${feature._id}.${advancement._id}`);
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
        const typeFlag = foundry.utils.getProperty(feature, "flags.ddbimporter.type");
        if (typeFlag == "race" && foundry.utils.hasProperty(this.ddbCharacter, "data.race._id")) {
          foundry.utils.setProperty(feature, "flags.dnd5e.advancementOrigin", `${this.ddbCharacter.data.race._id}`);
        } else if (typeFlag === "background") {
          const background = this.ddbCharacter.data.features.find((b) => b.type === "background");
          if (background) {
            foundry.utils.setProperty(feature, "flags.dnd5e.advancementOrigin", `${background._id}`);
          }
        } else if (typeFlag === "class" && foundry.utils.hasProperty(feature, "flags.ddbimporter.class")) {
          const klass = this.ddbCharacter.data.classes.find((k) => k.name === foundry.utils.getProperty(feature, "flags.ddbimporter.class"));
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
