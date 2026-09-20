import { SETTINGS } from "../../config/_module";
import WildShape from "./ClassFeatures/Druid/Wildshape";
import GreatWeaponMaster from "./Feats/GreatWeaponMaster";
import ArcaneWard from "./ClassFeatures/Wizard/ArcaneWard";
import WardingBond from "./Spells/WardingBond";
import MightySummoner from "./ClassFeatures/Druid/MightySummoner";
import Vestige from "./ClassFeatures/Warlock/Vestige";
import RiderEnchantmentLink from "./Enchantments/RiderEnchantmentLink";
import { logger } from "../../lib/_module";

// DDB Enhancers adds built in light touch automation effects

export default class DDBEnhancers {

  static addFeatureToEffects(subject, delta, featureName) {
    const feature = subject.items.find((i) => i.name === featureName);
    if (feature) {
      logger.debug(`Adding effects from ${featureName} to delta`, {
        subject, delta, feature, featureName,
      });
      delta.effects.push(...feature.toObject().effects);
    }
  }

  /**
   * An enhancer toggle. A setting this world has not registered reads as the fallback rather than
   * throwing, so a missing registration can never stop the other enhancers loading.
   */
  static _enhancerEnabled(key: string, fallback: boolean): boolean {
    const registered = game.settings.settings as unknown as Map<string, unknown>;
    if (!registered.has(`${SETTINGS.MODULE_ID}.${key}`)) return fallback;
    return (game.settings.get(SETTINGS.MODULE_ID, key as any) as unknown) === true;
  }

  static _loadTransformHooks() {
    if (game.settings.get(SETTINGS.MODULE_ID, "allow-moon-druid-wildshape-enhancer"))
      Hooks.on("dnd5e.transformActorV2", (subject, target, delta, options) => {
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

  static _dispositionMatch(activity, tokenData) {
    const dispositionFlag = foundry.utils.getProperty(activity, "item.flags.ddbimporter.disposition");
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

    if (game.settings.get(SETTINGS.MODULE_ID, "allow-mighty-summoner-enhancer")) {
      Hooks.on("dnd5e.preSummonToken", (activity, profile, tokenUpdateData, options) => {
        MightySummoner.dnd5ePreSummonTokenHook(activity, profile, tokenUpdateData, options);
        return true;
      });
    }
  }

  static _restHooks() {
    if (DDBEnhancers._enhancerEnabled("allow-divine-power-recovery-enhancer", false)) {
      Hooks.on("dnd5e.restCompleted", (actor, _result, config) => {
        const restType = (config as { type?: string } | undefined)?.type;
        if (restType !== "short" && restType !== "long") return;
        Vestige.recoverDivinePower(actor);
      });
    }
  }

  static _enchantmentHooks() {
    if (DDBEnhancers._enhancerEnabled("allow-rider-enchantment-link-enhancer", true)) {
      Hooks.on("dnd5e.preApplyEnchantment", (item, enchantmentData, options) => {
        RiderEnchantmentLink.preApplyEnchantmentHook(item, enchantmentData, options);
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
    DDBEnhancers._restHooks();
    DDBEnhancers._enchantmentHooks();
  }

}
