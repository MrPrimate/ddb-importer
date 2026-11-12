import { utils } from "../../../../lib/_module";
import DDBEnhancers from "../../DDBEnhancers";

export default class WildShape {

  /**
   * The druid subclass identifier without its "circle-" prefix.
   * dnd5e 6.1 migrates Circle of the Moon from `moon` to `circle-moon`, and imports made for 6.1
   * keep the prefix on every circle, while actors imported earlier still carry the short form.
   */
  static circleName(subject: any): string | undefined {
    const identifier = subject.classes?.druid?.subclass?.identifier;
    if (typeof identifier !== "string") return undefined;
    return identifier.replace(/^circle-/, "");
  }

  static dnd5eTransformHook(subject: any, _target: any, delta: any, options: any) {
    const isLegacy = utils.getSetting<string>("rulesVersion", "dnd5e") === "legacy";
    if ((options.preset !== "wildshape") || !subject.classes?.druid) return;
    const circle = WildShape.circleName(subject);
    if (circle === "moon" && !isLegacy) {
      DDBEnhancers.addFeatureToEffects(subject, delta, "Improved Circle Forms");
      DDBEnhancers.addFeatureToEffects(subject, delta, "Lunar Form");
    } else if (circle === "blighted") {
      DDBEnhancers.addFeatureToEffects(subject, delta, "Blighted Shape");
    } else if (circle === "mutation") {
      DDBEnhancers.addFeatureToEffects(subject, delta, "Apex Predator");
    }
  }
}
