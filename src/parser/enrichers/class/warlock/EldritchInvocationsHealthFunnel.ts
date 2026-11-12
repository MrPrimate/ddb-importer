import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Health Funnel (World of Warcraft Eldritch Invocation): a Bonus Action spends any number of
 * unexpended Hit Dice, rolling each plus the Cha modifier, as Temporary Hit Points for the familiar
 * or another Fiend you command. Each scaling step spends another die (`@consumed.hd`).
 */
export default class EldritchInvocationsHealthFunnel extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Health Funnel",
      activationType: "bonus",
      targetType: "creature",
      activationCondition: "Your familiar or another Fiend you command",
      additionalConsumptionTargets: [
        { type: "hitDice", target: "largest", value: "1", scaling: { mode: "amount", formula: "" } },
      ],
      data: {
        consumption: { scaling: { allowed: true, max: "@attributes.hd.value" } },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@consumed.hd + @scaling * @abilities.cha.mod",
          types: ["temphp"],
        }),
      },
    };
  }

}
