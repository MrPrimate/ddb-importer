import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverCarrionFeast extends DDBEnricherData {

  override get builtFeaturesFromActionFilters(): string[] {
    return ["Carrion Feast"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Feast (Bonus Damage)",
      activationType: "action",
      targetType: "creature",
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 5, denomination: 6, type: "necrotic" }),
      ],
      data: {
        description: {
          chatFlavor: "You gain temporary hit points equal to the necrotic damage dealt.",
        },
      },
    };
  }

}
