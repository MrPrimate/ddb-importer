import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodiedButUnbowed extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "moxie",
          value: "-@scale.pugilist.moxie",
        },
      ],
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.pugilist.level * 4",
          types: ["temphp"],
        }),
      },
      targetType: "self",
    };
  }

}
