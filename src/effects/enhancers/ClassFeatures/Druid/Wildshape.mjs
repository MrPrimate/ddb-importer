import DDBEnhancers from "../../DDBEnhancers.mjs";

export default class WildShape {

  static registerHooks() {
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
}
