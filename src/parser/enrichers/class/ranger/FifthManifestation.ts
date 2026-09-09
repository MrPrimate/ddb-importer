import DDBEnricherData from "../../data/DDBEnricherData";

export default class FifthManifestation extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "5th Manifestation",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      data: {
        duration: { value: "", units: "spec", special: "until the start of your next turn" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "5th Manifestation: Corruption Strike",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateDamage: true,
          generateConsumption: false,
          chatFlavor: "Attacks are treated as if you had the maximum number of curse markers accumulated.",
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          rangeOverride: {
            value: "5",
            units: "ft",
            special: "",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 5,
              denomination: 4,
              types: ["necrotic"],
            }),
          ],
        },
        overrides: {
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "5th Manifestation",
        includesName: true,
        max: "2",
        period: "lr",
      }),
    };
  }

}
