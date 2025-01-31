import { SETTINGS } from "../../config/_module.mjs";
import WildShape from "./ClassFeatures/Druid/Wildshape.mjs";
import GreatWeaponMaster from "./Feats/GreatWeaponMaster.mjs";
import ArcaneWard from "./ClassFeatures/Wizard/ArcaneWard.mjs";
import WardingBond from "./Spells/WardingBond.mjs";

// DDB Enhancers adds built in light touch automation effects

export default class DDBEnhancers {

  static addFeatureToEffects(subject, delta, featureName) {
    const feature = subject.items.find((i) => i.name === featureName);
    if (feature) {
      delta.effects.push(...feature.toObject().effects);
    }
  }

  static _loadTransformHooks() {
    if (game.settings.get(SETTINGS.MODULE_ID, "allow-moon-druid-wildshape-enhancer"))
      Hooks.on("dnd5e.transformActor", (subject, target, delta, options) => {
        WildShape.dnd5eTransformHook(subject, target, delta, options);
      });
  }

  static _loadPreRollDamageV2Hooks() {
    if (game.settings.get(SETTINGS.MODULE_ID, "allow-great-weapon-master-enhancer"))
      Hooks.on("dnd5e.preRollDamageV2", (rollData, options, message) => {
        GreatWeaponMaster.dnd5ePreRollDamageV2Hook(rollData, options, message);
      });
  }

  static _preUpdateActorHooks() {
    const arcaneWardHook = game.settings.get(SETTINGS.MODULE_ID, "allow-arcane-ward-enhancer");
    const wardingBondHook = game.settings.get(SETTINGS.MODULE_ID, "allow-warding-bond-enhancer");
    if (arcaneWardHook)
      Hooks.on("preUpdateActor", async (subject, update, options, user) => {
        if (arcaneWardHook) await ArcaneWard.preUpdateActorHook(subject, update, options, user);
        if (wardingBondHook) await WardingBond.preUpdateActorHook(subject, update, options, user);
      });
  }

  static _activityConsumptionHooks() {
    if (game.settings.get(SETTINGS.MODULE_ID, "allow-arcane-ward-enhancer"))
      Hooks.on("dnd5e.activityConsumption", async (activity, usageConfig, messageConfig, updates) => {
        await ArcaneWard.dnd5eActivityConsumptionHook(activity, usageConfig, messageConfig, updates);
      });
  }

  static _summonHooks() {
    // if (game.settings.get(SETTINGS.MODULE_ID, "allow-summon-enhancer")) {
    Hooks.on("dnd5e.summonToken", (activity, _profile, tokenData, _options) => {
      const dispositionFlag = foundry.utils.getProperty(activity, "item.flags.ddbimporter.disposition");
      if (!dispositionFlag) return true;
      if (dispositionFlag.match) {
        const token = activity.actor.token ?? activity.actor.prototypeToken;
        if (!token) return true;
        tokenData.disposition = token.disposition;
      }
      return true;
    });
    // }
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
