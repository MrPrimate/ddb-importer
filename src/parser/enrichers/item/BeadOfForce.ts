import DDBEnricherData from "../data/DDBEnricherData";

export default class BeadOfForce extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      addItemConsume: true,
    };
  }

  get effects() {
    return [
      {
        options: {
          transfer: false,
          description: "Trapped in a sphere of force!",
          durationRounds: 10,
          durationSeconds: 60,
        },
      }
    ];
  }

}
