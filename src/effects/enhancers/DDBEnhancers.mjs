import { SETTINGS } from "../../config/_module.mjs";
import WildShape from "./ClassFeatures/Druid/Wildshape.mjs";
import GreatWeaponMaster from "./ClassFeatures/Feats/GreatWeaponMaster.mjs";
import ArcaneWard from "./ClassFeatures/Wizard/ArcaneWard.mjs";

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
    if (game.settings.get(SETTINGS.MODULE_ID, "allow-arcane-ward-enhancer"))
      Hooks.on("preUpdateActor", async (subject, update, options, user) => {
        await ArcaneWard.preUpdateActorHook(subject, update, options, user);
      });
  }

  static _activityConsumptionHooks() {
    if (game.settings.get(SETTINGS.MODULE_ID, "allow-arcane-ward-enhancer"))
      Hooks.on("dnd5e.activityConsumption", async (activity, usageConfig, messageConfig, updates) => {
        await ArcaneWard.dnd5eActivityConsumptionHook(activity, usageConfig, messageConfig, updates);
      });
  }

  // Loads enhancer functions into appropriate system hooks.
  static loadEnhancers() {
    DDBEnhancers._loadTransformHooks();
    DDBEnhancers._loadPreRollDamageV2Hooks();
    DDBEnhancers._preUpdateActorHooks();
    DDBEnhancers._activityConsumptionHooks();
  }

}
