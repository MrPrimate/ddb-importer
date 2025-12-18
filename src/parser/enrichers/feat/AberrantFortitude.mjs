/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AberrantFortitude extends DDBEnricherData {
  get usesOnActivity() {
    return true;
  }

  get activity() {
    return {
      noConsumeTargets: true,
      addActivityConsume: true,
      data: {
        roll: {
          name: "Roll bonus",
          formula: `@scale.${this.parentIdentifier}.die`,
        },
      },
    };
  }

  get override() {
    const advancement = {
      "type": "ScaleValue",
      "_id": foundry.utils.randomID(),
      "configuration": {
        "identifier": "die",
        "type": "dice",
        "scale": {
          "0": {
            "number": 1,
            "faces": 4,
          },
        },
      },
      "title": this.name,
      "hint": "A scale value which can be updated by its Greater Mark feat.",
    };
    // to do determine advancement here

    return {
      data: {
        "system.advancement": [advancement],
      },
    };
  }
}
