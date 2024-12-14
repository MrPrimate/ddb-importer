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

  static druidEnhancers() {
    if (game.settings.get(SETTINGS.MODULE_ID, "allow-moon-druid-wildshape-enhancer"))
      WildShape.registerHooks();
  }

  static wizardEnhancers() {
    if (game.settings.get(SETTINGS.MODULE_ID, "allow-arcane-ward-enhancer"))
      ArcaneWard.registerHooks();
  }

  static addFeatEnhancers() {
    GreatWeaponMaster.registerHooks();
  }

  static loadEnhancers() {
    DDBEnhancers.druidEnhancers();
    DDBEnhancers.wizardEnhancers();
    DDBEnhancers.addFeatEnhancers();
  }

}
