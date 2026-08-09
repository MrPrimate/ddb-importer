import DDBEnricherData from "../../data/DDBEnricherData";

export default class TelekineticThrust extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Telekinetic Thrust",
      activationType: "special",
      addItemConsume: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Telekinetic Thrust: Prone",
        statuses: ["Prone"],
      },
    ];
  }

}
