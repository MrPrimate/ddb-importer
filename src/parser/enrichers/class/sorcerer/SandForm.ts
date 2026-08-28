import DDBEnricherData from "../../data/DDBEnricherData";

export default class SandForm extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Sand Form (Enter)",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
      itemConsumeValue: 5,
      data: {
        duration: { value: "1", units: "minute", special: "" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Sand Form (Damage Resistance)",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateTarget: true,
          generateUtility: true,
          generateConsumption: false,
          chatFlavor: "Until the end of that turn you have resistance to all damage, including against the triggering attack.",
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "When an attacker you can see hits you with an attack",
          },
        },
        overrides: {
          useActivitySnippet: true,
        },
      },
    ];
  }

}
