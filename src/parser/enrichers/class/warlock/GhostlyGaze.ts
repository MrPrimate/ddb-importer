import DDBEnricherData from "../../data/DDBEnricherData";

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
        uses: {
          spent: this.ddbParser?.ddbData?.character.actions.class.find((a) => a.name === "Ghostly Gaze")?.limitedUse?.numberUsed ?? null,
          max: "1",
          recovery: [{ period: "sr", type: 'recoverAll', formula: undefined }],
        },
        data: {
          "duration": {
            value: 1,
            units: "minute",
          },
        },
      };
    } else {
      return null;
    }
  }

}
