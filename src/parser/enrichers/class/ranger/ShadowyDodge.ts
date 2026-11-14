import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Gloom Stalker Shadowy Dodge. The 2024 reaction also teleports you up to 30 feet, so it is a
 * teleport activity as in the PHB; the 2014 one only imposes Disadvantage.
 */
export default class ShadowyDodge extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get activity(): IDDBActivityData {
    if (this.is2014) {
      return {
        activationType: "reaction",
        targetType: "self",
      };
    }
    return {
      name: "Shadowy Dodge",
      activationType: "reaction",
      activationCondition: "When a creature makes an attack roll against you",
      targetType: "self",
      data: {
        range: {
          override: true,
          value: "30",
          units: "ft",
        },
      },
    };
  }


}
