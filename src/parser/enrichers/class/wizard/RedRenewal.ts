import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Sangromancer: once per long rest, finishing a Short Rest restores spent Hit Point Dice and
 * Sangromancy Dice (Full-Blooded) equal to half your Wizard level, through negative costs.
 */
export default class RedRenewal extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You finish a Short Rest",
      data: {
        consumption: {
          targets: [
            { type: "itemUses", target: "", value: "1", scaling: { mode: "", formula: "" } },
            { type: "hitDice", target: "largest", value: "-floor(@classes.wizard.levels / 2)", scaling: { mode: "", formula: "" } },
            { type: "itemUses", target: "full-blooded", value: "-floor(@classes.wizard.levels / 2)", scaling: { mode: "", formula: "" } },
          ],
          scaling: { allowed: false, max: "" },
        },
      },
    };
  }

}
