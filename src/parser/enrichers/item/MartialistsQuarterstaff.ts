import DDBEnricherData from "../data/DDBEnricherData";

export default class MartialistsQuarterstaff extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Throw (1 Charge)", type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
        },
        overrides: {
          targetType: "self",
          activationType: "special",
          activationCondition: "When you take the Attack action",
          addItemConsume: true,
          itemConsumeValue: "1",
          data: {
            restrictions: { type: "weapon", allowMagical: true },
          },
        },
      },
      {
        init: { name: "Trip (1 Charge)", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: true,
          generateRange: true,
          saveOverride: { ability: ["str"], dc: { calculation: "", formula: "13" } },
          rangeOverride: { value: "5", units: "ft", special: "" },
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "On a melee hit made with Advantage from the charge",
          addItemConsume: true,
          itemConsumeValue: "1",
          noTemplate: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Thrown Quarterstaff",
        type: "enchant",
        activityMatch: "Throw (1 Charge)",
        options: { expiry: "sourceEnd" },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("{} (Thrown)", 20, "name"),
          DDBEnricherData.ChangeHelper.addChange("thr", 20, "system.properties"),
          DDBEnricherData.ChangeHelper.overrideChange("20", 20, "system.range.value"),
          DDBEnricherData.ChangeHelper.overrideChange("60", 20, "system.range.long"),
        ],
      },
      {
        name: "Tripped",
        activityMatch: "Trip (1 Charge)",
        statuses: ["Prone"],
      },
    ];
  }

}
