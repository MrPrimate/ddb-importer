import DDBEnricherData from "../../data/DDBEnricherData";

export default class SongOfDefense extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
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
