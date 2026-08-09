import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodyExit extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Bloody Mist", type: "class" },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: "Stolen Power",
          itemConsumeValue: "5",
          additionalConsumptionTargets: [
            {
              type: "itemUses",
              target: "",
              value: "1",
              scaling: { mode: "", formula: "" },
            },
          ],
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }

}
