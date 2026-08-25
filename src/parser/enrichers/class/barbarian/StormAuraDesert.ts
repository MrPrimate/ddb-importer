import DDBEnricherData from "../../data/DDBEnricherData";
import _StormAura from "./_StormAura";

export default class StormAuraDesert extends _StormAura {

  override get element(): string {
    return "fire";
  }

  override get tundra(): string {
    return "Desert";
  }


  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      activationType: "bonus",
      rangeSelf: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.storm-herald.storm-aura-desert",
              types: [this.element],
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
