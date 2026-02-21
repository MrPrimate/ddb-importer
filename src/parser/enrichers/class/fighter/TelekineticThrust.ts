import DDBEnricherData from "../../data/DDBEnricherData";

export default class TelekineticThrust extends DDBEnricherData {

  get activity() {
    return {
      name: "Telekinetic Thrust",
      activationType: "special",
      addItemConsume: true,
    };
  }

  get effects() {
    return [
      {
        name: "Telekinetic Thrust: Prone",
        statuses: ["Prone"],
      },
    ];
  }

}
