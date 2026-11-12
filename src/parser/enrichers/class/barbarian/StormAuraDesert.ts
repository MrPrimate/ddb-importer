import DDBEnricherData from "../../data/DDBEnricherData";

export default class StormAuraDesert extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      activationType: "bonus",
      rangeSelf: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: `@scale.${this.subclassIdentifier("Path of the Storm Herald")}.storm-aura-desert`,
              types: ["fire"],
            }),
          ],
        },
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
      },
    };
  }

}
