import SETTINGS from "../../settings.js";

export default class DDBEnhancers {

  static addFeatureToEffects(subject, delta, featureName) {
    const feature = subject.items.find((i) => i.name === featureName);
    if (feature) {
      delta.effects.push(...feature.toObject().effects);
    }
  }

  static load2024MoonDruidEnhancers() {
    if (!game.settings.get(SETTINGS.MODULE_ID, "allow-moon-druid-wildshape-enhancer")) return;
    Hooks.on("dnd5e.transformActor", (subject, target, delta, options) => {
      const isLegacy = game.settings.get("dnd5e", "rulesVersion") === "legacy";
      if ((options.preset !== "wildshape") || !subject.classes?.druid) return;
      if (subject.classes.druid.subclass?.identifier === "moon" && !isLegacy) {
        DDBEnhancers.addFeatureToEffects(subject, delta, "Circle Forms");
        DDBEnhancers.addFeatureToEffects(subject, delta, "Improved Circle Forms");
      } else if (subject.classes.druid.subclass?.identifier === "blighted") {
        DDBEnhancers.addFeatureToEffects(subject, delta, "Blighted Shape");
      }

    });
  }

  static loadEnhancers() {
    DDBEnhancers.load2024MoonDruidEnhancers();
  }

}
