import DDBEnricherData from "../data/DDBEnricherData";
import SpellComponentItem from "./_SpellComponentItem";

/** The Magus Class: consumed when casting Chromatic Orb; the orb can deal Necrotic, Psychic or Radiant damage and deals 2d8 more. */
export default class PolychromaticPrism extends SpellComponentItem {

  override get spellName(): string {
    return "Chromatic Orb";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get componentActivity(): IDDBActivityData {
    return {
      activationCondition: "When you cast Chromatic Orb; add to the orb's damage",
      targetType: "creature",
      targetCount: 1,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["necrotic", "psychic", "radiant"], scalingMode: "none" }),
      ],
    };
  }

}
