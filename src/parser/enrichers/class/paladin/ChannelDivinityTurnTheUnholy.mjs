/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ChannelDivinityTurnTheUnholy extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      name: "Turn the Unholy",
      addItemConsume: true,
      targetType: "creature",
      activationCondition: "Each fiend or undead that see or hear you",
      rangeSelf: true,
      data: {
        save: {
          ability: ["wis"],
          dc: {
            calculation: "cha",
            formula: "",
          },
        },
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: "30",
            units: "ft",
          },
          prompt: false,
        },
      },
    };
  }


}
