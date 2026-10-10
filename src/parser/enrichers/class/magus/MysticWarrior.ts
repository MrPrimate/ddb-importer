import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Magus Fighting Style option. DDB's modifier already adds Intelligence to Concentration saves;
 * failing one grants temporary Hit Points of twice the spell's level (picked as the scaling) plus
 * Intelligence.
 */
export default class MysticWarrior extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Mystic Warrior",
      activationType: "special",
      activationCondition: "You fail a Constitution saving throw to maintain Concentration; pick the spell's level as the scaling",
      targetType: "self",
      rangeSelf: true,
      noConsumeTargets: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "(2 * @scaling) + @abilities.int.mod",
          types: ["temphp"],
          scalingMode: "none",
        }),
        consumption: {
          scaling: {
            allowed: true,
            max: "6",
          },
        },
      },
    };
  }

}
