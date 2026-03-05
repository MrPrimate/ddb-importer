import DDBEnricherData from "../../data/DDBEnricherData";

export default class BestialFury extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {

    const hasFoeSlayer = this.is2024 && this.hasClassFeature({ featureName: "Foe Slayer", className: "Ranger" });
    const denomination = hasFoeSlayer
      ? 10
      : 6;

    return {
      targetType: "creature",
      data: {
        damage: {
          parts: DDBEnricherData.basicDamagePart({ number: 1, denomination, types: ["force"] }),
        },
      },
    };
  }

}
