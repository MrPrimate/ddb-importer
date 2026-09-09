import DDBEnricherData from "../../data/DDBEnricherData";

export default class AncientProtector extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Vengeance of the Elders",
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature covered in Elderwood Sap within your reach makes an attack roll",
      data: {
        range: {
          units: "touch",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Ancient Protector",
        options: {
          transfer: true,
          disabled: true,
          description: "While your Wood Wose is active you are Large, your reach increases by 5 feet, and you have Resistance to Bludgeoning and Piercing damage.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("lg", 20, "system.traits.size"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 20, "system.traits.dr.value"),
        ],
      },
    ];
  }

}
