import WildShape from "./ClassFeatures/Druid/Wildshape";
import GreatWeaponMaster from "./Feats/GreatWeaponMaster";
import ArcaneWard from "./ClassFeatures/Wizard/ArcaneWard";
import WardingBond from "./Spells/WardingBond";
import MightySummoner from "./ClassFeatures/Druid/MightySummoner";
import { logger, utils } from "../../lib/_module";

// DDB Enhancers adds built in light touch automation effects

export default class DDBEnhancers {

  static addFeatureToEffects(subject: Actor, delta: any, featureName: string) {
    const feature = subject.items.find((i: any) => i.name === featureName);
    if (feature && feature.effects) {
      logger.debug(`Adding effects from ${featureName} to delta`, {
        subject, delta, feature, featureName,
      });
      delta.effects.push(...feature.toObject().effects);
    }
  }

  static _loadTransformHooks() {
    if (utils.getSetting<boolean>("allow-moon-druid-wildshape-enhancer"))
      Hooks.on("dnd5e.transformActorV2", (subject, target, delta, options) => {
        WildShape.dnd5eTransformHook(subject, target, delta, options);
      });
  }

  static _loadPreRollDamageV2Hooks() {
    if (utils.getSetting<boolean>("allow-great-weapon-master-enhancer"))
      Hooks.on("dnd5e.preRollDamageV2", (rollData, options, message) => {
        GreatWeaponMaster.dnd5ePreRollDamageV2Hook(rollData, options, message);
      });
  }

  static _preUpdateActorHooks() {
    const arcaneWardHook = utils.getSetting<boolean>("allow-arcane-ward-enhancer");
    const wardingBondHook = utils.getSetting<boolean>("allow-warding-bond-enhancer");
    if (arcaneWardHook)
      Hooks.on("preUpdateActor", (subject, update, options, user) => {
        void (async () => {
          if (arcaneWardHook) await ArcaneWard.preUpdateActorHook(subject, update, options, user);
          if (wardingBondHook) await WardingBond.preUpdateActorHook(subject, update, options, user);
        })();
      });
  }

  static _activityConsumptionHooks() {
    if (utils.getSetting<boolean>("allow-arcane-ward-enhancer"))
      Hooks.on("dnd5e.activityConsumption", (activity, usageConfig, messageConfig, updates) => {
        void (async () => {
          await ArcaneWard.dnd5eActivityConsumptionHook(activity, usageConfig, messageConfig, updates);
        })();
      });
  }

  static _dispositionMatch(activity: any, tokenData: any) {
    const dispositionFlag = foundry.utils.getProperty(activity, "item.flags.ddbimporter.disposition") as IDDBImporterFlagsDisposition | undefined;
    if (!dispositionFlag) return true;
    if (dispositionFlag.match) {
      const token = activity.actor.token ?? activity.actor.prototypeToken;
      if (!token) return true;
      tokenData.disposition = token.disposition;
    }
    return true;
  }

  static _summonHooks() {
    Hooks.on("dnd5e.summonToken", (activity, _profile, tokenData, _options) => {
      DDBEnhancers._dispositionMatch(activity, tokenData);

      return true;
    });

    if (utils.getSetting<boolean>("allow-mighty-summoner-enhancer")) {
      Hooks.on("dnd5e.preSummonToken", (activity, profile, tokenUpdateData, options) => {
        MightySummoner.dnd5ePreSummonTokenHook(activity, profile, tokenUpdateData, options);
        return true;
      });
    }
  }

  // Loads enhancer functions into appropriate system hooks.
  static loadEnhancers() {
    DDBEnhancers._loadTransformHooks();
    DDBEnhancers._loadPreRollDamageV2Hooks();
    DDBEnhancers._preUpdateActorHooks();
    DDBEnhancers._activityConsumptionHooks();
    DDBEnhancers._summonHooks();
  }

}
