import DDBEnricherData from "../data/DDBEnricherData";

export default class BellowsOfStrangulation extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "First Command Word (1 Charge)",
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      itemConsumeValue: "1",
      noTemplate: true,
      data: {
        save: { ability: ["con"], dc: { calculation: "", formula: "15" } },
        range: { value: "60", units: "ft" },
        duration: { value: "1", units: "minute" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Second Command Word (3 Charges)",
          itemConsumeValue: "3",
          data: {
            range: { override: true, units: "self", value: null },
            target: {
              override: true,
              affects: { type: "creature" },
              template: { type: "cone", size: "30", units: "ft" },
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Strangled",
        statuses: ["Incapacitated"],
        options: { durationSeconds: 60, description: "Repeat the save at the end of each turn to end the effect." },
      },
    ];
  }

}
