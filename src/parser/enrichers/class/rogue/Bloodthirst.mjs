/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Bloodthirst extends DDBEnricherData {

  get override() {
    const hasSRFeature = this.hasClassFeature({ featureName: "Dread Incarnate", subClassName: "Scion of the Three" });
    if (!hasSRFeature || this.ddbParser.isMuncher) return {};

    return {
      data: {
        system: {
          uses: {
            recovery: [
              { period: "lr", type: 'recoverAll', formula: undefined },
              { period: "sr", type: 'formula', formula: "1" },
            ],
          },
        },
      },
    };
  }

}
