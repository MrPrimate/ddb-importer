import DDBEnricherData from "../../data/DDBEnricherData";

/** College of Masks persona: a bonus action and a Bardic Inspiration die exhale a 15-foot cone of fire, two rolls of the die (Dexterity save, half). */
export default class DragonMask extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "bardic-inspiration",
      rangeSelf: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, type: "cone", size: "15", units: "ft" },
        },
        save: { ability: ["dex"], dc: { calculation: "spellcasting", formula: "" } },
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "2d@scale.bard.inspiration.faces", types: ["fire"] })],
        },
      },
    };
  }

}
