import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityTurnTheUnholy extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
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
