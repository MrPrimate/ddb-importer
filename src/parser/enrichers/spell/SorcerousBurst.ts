import DDBEnricherData from "../data/DDBEnricherData";

export default class SorcerousBurst extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Initial Damage",
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: "1d8x@mod=8",
          types: ["acid", "cold", "fire", "lightning", "poison", "psychic", "thunder"],
          scalingMode: "whole",
          scalingNumber: 1,
        }),
      ],
    };
  }
}
