import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverTusksOfTheRampagingMammoth extends DDBEnricherData {


  override get builtFeaturesFromActionFilters(): string[] {
    return ["Tusks of the Rampaging Mammoth"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Strike (Bonus Damage)",
      activationType: "action",
      targetType: "creature",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          number: 3,
          denomination: 12,
          types: DDBEnricherData.allDamageTypes(),
        }),
      ],
      data: {
        range: {
          units: "ft",
          value: "5",
        },
        description: {
          chatFlavor: "If the creature is Huge or smaller, you push it 15 feet.",
        },
      },
    };
  }

}
