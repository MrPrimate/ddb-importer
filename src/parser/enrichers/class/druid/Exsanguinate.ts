import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Circle of Blood: once per long rest, alongside Blood Boon, regain spent Hit Dice equal to half your
 * Druid level and give Temporary Hit Points equal to twice it to up to your Wisdom modifier creatures
 * within 60 feet. The Hit Dice come back through a negative hit dice cost.
 */
export default class Exsanguinate extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: "max(1, @abilities.wis.mod)",
      targetChoice: true,
      activationType: "special",
      activationCondition: "You use your Blood Boon",
      data: {
        range: { override: true, value: "60", units: "ft" },
        consumption: {
          targets: [
            { type: "itemUses", target: "", value: "1", scaling: { mode: "", formula: "" } },
            { type: "hitDice", target: "largest", value: "-floor(@classes.druid.levels / 2)", scaling: { mode: "", formula: "" } },
          ],
          scaling: { allowed: false, max: "" },
        },
        healing: DDBEnricherData.basicDamagePart({ customFormula: "2 * @classes.druid.levels", types: ["temphp"] }),
      },
    };
  }

}
