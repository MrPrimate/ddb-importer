/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SummonWildfireSpiritCommand extends DDBEnricherData {

  get type() {
    return null;
  }

  get activity() {
    return null;
  }

  get effects() {
    return [];
  }

  get additionalActivities() {
    return [];
  }

  get override() {
    return {
      data: {
        "system.uses": {
          spent: null,
          max: "",
        },
      },
    };
  }

}
