import DDBEnricherData from "../../data/DDBEnricherData";

export default class CurseCaster extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Bestow Curse", type: "class", rename: ["Cast Bestow Curse"] },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: "Misfortunist",
          itemConsumeValue: "3",
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
