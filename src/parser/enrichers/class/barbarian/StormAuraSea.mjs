/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StormAuraSea extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    return {
      activationType: "bonus",
      rangeSelf: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.storm-herald.storm-aura-sea",
              types: ["lightning"],
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
