/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PsychicWhispers extends DDBEnricherData {

  get type() {
    return null;
  }

  get activity() {
    return {
      name: "Psychic Whispers",
      addItemConsume: true,
      addSingleFreeUse: true,
      data: {
        target: {
          affects: {
            count: "@prof",
            type: "ally",
            choice: true,
            special: "",
          },
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.soulknife.energy-die.die",
          name: "Hours active roll",
        },
      },
    };
  }

}
