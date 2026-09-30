import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Necromancer (AU 2024), the Undead Vitality action of Necromancy Spellbook: an Undead within
 * 60 feet regains the expended slot's level plus the wizard level. The slot belongs to the
 * Necromancy spell, so the activity asks for its level through the scaling prompt with no
 * consumption target; dnd5e counts `@scaling` from 1, so the prompt value is the slot level.
 */
export default class UndeadVitality extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Undead Vitality",
      targetType: "creature",
      activationType: "special",
      activationCondition: "When you cast a Necromancy spell using a spell slot (scaling: the slot level)",
      noConsumeTargets: true,
      addConsumptionScalingMax: "9",
      noTemplate: true,
      data: {
        range: { value: "60", units: "ft" },
        target: {
          affects: { type: "creature", count: "1", special: "Undead you can see" },
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scaling + @classes.wizard.levels",
          types: ["healing"],
          scalingMode: "none",
        }),
      },
    };
  }

}
