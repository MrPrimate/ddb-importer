import DDBEnricherData from "../data/DDBEnricherData";

export default class PotionOfDragonsBreath extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Exhale Breath",
      targetType: "creature",
      activationType: "bonus",
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: "13" } },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 3,
              denomination: 6,
              types: ["acid", "cold", "fire", "lightning", "poison"],
              scalingMode: "none",
            }),
          ],
        },
        range: { units: "self" },
        target: {
          affects: { type: "creature" },
          template: { type: "cone", size: "15", units: "ft" },
        },
        duration: { value: "1", units: "minute" },
      },
    };
  }

}
