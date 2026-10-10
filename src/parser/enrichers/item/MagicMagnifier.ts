import DDBEnricherData from "../data/DDBEnricherData";
import SpellComponentItem from "./_SpellComponentItem";

/** The Magus Class: consumed when casting Ensorcelled Strike; on a hit, the first spell damage the target takes before the end of your next turn adds 3d6 Force. */
export default class MagicMagnifier extends SpellComponentItem {

  override get spellName(): string {
    return "Ensorcelled Strike";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get componentActivity(): IDDBActivityData {
    return {
      activationCondition: "When you cast Ensorcelled Strike and hit; roll when the target first takes spell damage before the end of your next turn",
      targetType: "creature",
      targetCount: 1,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["force"], scalingMode: "none" }),
      ],
    };
  }

}
