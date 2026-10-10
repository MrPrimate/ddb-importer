import DDBEnricherData from "../../data/DDBEnricherData";

/** Free League Champion: once per short or long rest, a bonus action either heals 1d8 + Champion level + Constitution modifier or takes the Attack, Dash, Disengage or Dodge action. */
export default class SurgeOfVigour extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Regain Hit Points",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 8,
          bonus: "@classes.champion.levels + @abilities.con.mod",
          types: ["healing"],
        }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Push Beyond Your Limits", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          activationOverride: { type: "bonus", value: 1, condition: "Take the Attack, Dash, Disengage, or Dodge action" },
        },
        overrides: { targetSelf: true, addItemConsume: true },
      },
    ];
  }

}
