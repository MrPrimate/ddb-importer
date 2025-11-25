/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SongOfDefense extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "reaction",
      activationCondition: "You take damage whilst Bladesong is active",
      data: {
        roll: {
          name: "Damage Reduction",
          formula: `5 * @scaling`,
        },
        consumption: {
          "scaling": { "allowed": true, "max": "9" },
          "spellSlot": true,
          "targets": [
            {
              "type": "spellSlots",
              "value": "1",
              "target": "1",
              "scaling": { "mode": "level", "formula": "" },
            },
          ],
        },
      },
    };
  }

}
