import DDBEnricherData from "../../data/DDBEnricherData";
import _StormAura from "./_StormAura";

export default class StormAuraSea extends _StormAura {

  override get element(): string {
    return "lightning";
  }

  override get tundra(): string {
    return "Sea";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      rangeSelf: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.storm-herald.storm-aura-sea",
              types: [this.element],
            }),
          ],
        },
        save: {
          ability: ["dex"],
          dc: {
            calculation: "con",
            formula: "",
          },
        },
        target: {
          affects: {
            count: "1",
            choice: true,
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
