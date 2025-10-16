/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class GatheredSwarm extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get override() {
    return {
      data: {
        "system.uses": {
          "spent": 0,
          "recovery": [
            {
              "period": "turnStart",
              "type": "recoverAll",
            },
          ],
          "max": "1",
        },
      },
    };
  }
}
