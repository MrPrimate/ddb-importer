import SETTINGS from "../../settings.js";

export default class DDBEnhancers {

  static load2024MoonDruidEnhancers() {
    if (!game.settings.get(SETTINGS.MODULE_ID, "allow-moon-druid-ac-enhancer")) return;
    Hooks.on("dnd5e.transformActor", (subject, target, d, options) => {
      const isLegacy = game.settings.get("dnd5e", "rulesVersion") === "legacy";
      if ((options.preset !== "wildshape") || !subject.classes?.druid || isLegacy) return;
      if (subject.classes.druid.subclass?.identifier === "moon") {
        const acFeature = subject.items.find((i) => i.name === "Circle Forms");
        if (acFeature) {
          d.effects.push(...acFeature.toObject().effects);
        }
        const conFeature = subject.items.find((i) => i.name === "Improved Circle Forms");
        if (conFeature) {
          d.effects.push(...conFeature.toObject().effects);
        }
      }
    });
  }

  static loadEnhancers() {
    DDBEnhancers.load2024MoonDruidEnhancers();
  }

}
