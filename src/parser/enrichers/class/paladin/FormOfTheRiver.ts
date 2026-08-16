import DDBEnricherData from "../../data/DDBEnricherData";

export default class FormOfTheRiver extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Enter Form of the River",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
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
          name: "Aura of the River: Push Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateDamage: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "When you successfully move a creature with your aura",
          },
          rangeOverride: {
            value: "5",
            units: "ft",
            special: "",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 8,
              types: ["bludgeoning"],
            }),
          ],
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Form of the River",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
