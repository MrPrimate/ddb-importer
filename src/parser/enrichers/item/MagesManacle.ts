import DDBEnricherData from "../data/DDBEnricherData";

export default class MagesManacle extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bind",
      targetType: "creature",
      activationType: "action",
      activationCondition: "Large or smaller creature within 5 feet that is Grappled or Incapacitated",
      addItemConsume: true,
      noTemplate: true,
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: "15" } },
        range: { value: "5", units: "ft" },
        duration: { value: "8", units: "hour" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bound by Manacle",
        statuses: ["Restrained"],
        options: { durationSeconds: 28800 },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: 0,
        max: "1",
        recovery: [{ period: "dawn", type: "recoverAll" }],
      },
    };
  }

}
