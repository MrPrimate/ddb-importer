/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class AbsorbSpells extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Regain Sorcery Points",
      activationType: "special",
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          value: "-1d4",
          target: "sorcery-points",
          scaling: { allowed: false, max: "" },
        },
      ],
    };
  }

}
