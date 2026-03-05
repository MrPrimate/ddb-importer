import DDBEnricherData from "../../data/DDBEnricherData";

export default class TelekineticThrust extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Telekinetic Thrust",
      activationType: "special",
      addItemConsume: true,
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Telekinetic Thrust: Prone",
        statuses: ["Prone"],
      },
    ];
  }

}
