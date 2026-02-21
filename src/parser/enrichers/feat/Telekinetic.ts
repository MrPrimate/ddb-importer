import DDBEnricherData from "../data/DDBEnricherData";

export default class Telekinetic extends DDBEnricherData {

  get activity() {
    return {
      type: "none",
    };
  }

  get additionalActivities() {
    return [
      { action: { name: "Telekinetic Shove", type: "feat", rename: ["Shove"] } },
      { action: { name: "Telekinetic: Shove", type: "feat", rename: ["Shove"] } },
    ];
  }

}
