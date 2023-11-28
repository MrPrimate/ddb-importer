import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper.js";
import logger from "../../logger.js";
import { getInfusionActionData } from "../item/infusions.js";
import DDBAction from "./DDBAction.js";
import DDBAttackAction from "./DDBAttackAction.js";
import { addExtraEffects, fixFeatures } from "./fixes.js";


export default class CharacterFeatureFactory {

  constructor(ddbData, rawCharacter = null) {
    this.ddbData = ddbData;
    this.rawCharacter = rawCharacter;

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

    console.warn(`unarmedStrikeAction for Unarmed strike`, unarmedStrikeAction);
    return unarmedStrikeAction.data;
  }

  _generateUnarmedStrikeAction(overrides = {}) {
    this.parsed.actions.push(this.getUnarmedStrike(overrides));
  }


  _generateAttackActions() {
    const attackActions = [
      // do class options here have a class id, needed for optional class features
      this.ddbData.character.actions.class.filter((action) => DDBHelper.findClassByFeatureId(this.ddbData, action.componentId)),
      this.ddbData.character.actions.race,
      this.ddbData.character.actions.feat,
      this._getCustomActions(true),
      getInfusionActionData(this.ddbData),
    ]
      .flat()
      .filter((action) => DDBHelper.displayAsAttack(this.ddbData, action, this.rawCharacter))
      .map((action) => {
        const ddbAttackAction = new DDBAttackAction({ ddbData: this.ddbData, ddbDefinition: action, rawCharacter: this.rawCharacter });
        ddbAttackAction.build();

        console.warn(`ddbAttackAction for ${action.name}`, ddbAttackAction);
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
        console.warn(`ddbAction for ${action.name}`, ddbAction);

        return ddbAction.data;
      });

    logger.debug("other actions", otherActions);
    this.parsed.actions = this.parsed.actions.concat(otherActions);
  }

  async processActions() {
    this._generateAttackActions();
    this._generateUnarmedStrikeAction();
    this._generateOtherActions();

    this.processed.actions = duplicate(this.parsed.actions);

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
    this.data.push(...this.processed.actions);
  }

  async processFeatures() {
    const feature = {};
    if (feature.include) this.processed.features.push(feature);

    this.data.push(...this.processed.features);
  }

  updateFeatureIds() {
    // TODO
  }

  async process() {
    await this.processActions();
    await this.processFeatures();
    this.updateFeatureIds();
  }

}
