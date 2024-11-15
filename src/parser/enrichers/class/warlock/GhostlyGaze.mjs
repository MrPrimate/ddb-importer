/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class GhostlyGaze extends DDBEnricherData {

  get activity() {
    if (this.is2014) {
      return {
        type: "utility",
      };
    } else {
      return null;
    }
  }

  get override() {
    if (this.is2014) {
      return {
        data: {
          "duration": {
            value: 1,
            units: "minute",
          },
          "system.uses": {
            value: this.ddbParser?.ddbData?.character.actions.class.find((a) => a.name === "Ghostly Gaze")?.limitedUse?.numberUsed ?? null,
            max: "1",
            recovery: [{ period: "sr", type: 'recoverAll', formula: undefined }],
          },
        },
      };
    } else {
      return null;
    }
  }

}
