import { utils } from "../../../../lib/_module";
import DDBEnhancers from "../../DDBEnhancers";

export default class WildShape {

  static dnd5eTransformHook(subject, _target, delta, options) {
    const isLegacy = utils.getSetting<string>("rulesVersion", "dnd5e") === "legacy";
    if ((options.preset !== "wildshape") || !subject.classes?.druid) return;
    if (subject.classes.druid.subclass?.identifier === "moon" && !isLegacy) {
      DDBEnhancers.addFeatureToEffects(subject, delta, "Improved Circle Forms");
    } else if (subject.classes.druid.subclass?.identifier === "blighted") {
      DDBEnhancers.addFeatureToEffects(subject, delta, "Blighted Shape");
    }
  }
}
