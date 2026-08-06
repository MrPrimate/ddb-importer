import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodyExit extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
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

  get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }

}
