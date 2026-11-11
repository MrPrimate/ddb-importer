import DDBEnricherData from "../../data/DDBEnricherData";

export default class WildMagicSurge extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Roll for Surge Change (Nat 20)",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d20",
          name: "Roll for Surge Change",
        },
      },
    };
  }

  // a result on the 2014 surge table maximises the damage of the next damaging spell within a minute;
  // the 2024 table has no such result, so the description decides
  override get additionalActivities(): IDDBAdditionalActivity[] {
    const description = this.ddbParser?.ddbDefinition?.description ?? "";
    if (!(/maximi[sz]e the damage of the next damaging spell/i).test(description)) return [];
    return [
      DDBEnricherData.maximumDamageActivity({
        condition: "Surge: maximize the damage of the next damaging spell you cast within the next minute",
        parameters: { title: "Maximized Surge", sources: [{ type: "spell" }] },
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "",
        recovery: [],
      },
    };
  }

}
