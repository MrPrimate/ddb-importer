import DDBEnricherData from "../../data/DDBEnricherData";

export default class PsiBolsteredKnack extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.soulknife.energy-die.die",
          name: "Roll Additional Bonus",
        },
      },
    };
  }

}
