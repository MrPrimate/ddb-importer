import DDBEnricherData from "../data/DDBEnricherData";
import SpellComponentItem from "./_SpellComponentItem";

/** The Magus Class: consumed when casting Arcanist's Magic Aura on an unwilling creature, which must save (Charisma) or suffer the Mask effect. */
export default class MagiceramicMask extends SpellComponentItem {

  override get spellName(): string {
    return "Arcanist's Magic Aura";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get componentActivity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      data: {
        save: {
          ability: ["cha"],
          dc: { calculation: "spellcasting", formula: "" },
        },
      },
    };
  }

}
