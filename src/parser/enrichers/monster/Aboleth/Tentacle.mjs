/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Tentacle extends DDBEnricherData {
  get activity() {
    if (!this.is2014) return null;
    if (!this.ddbEnricher.originalActivity) return null;
    const parts = this.ddbEnricher.originalActivity.type === "save"
      ? []
      : [this.ddbParser.actionInfo.damageParts[0].part];
    return {
      data: {
        damage: {
          parts,
        },
      },
    };
  }
}
