/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class StaffOfHealing extends DDBEnricherData {
  async customFunction({ name, activity } = {}) {
    if (name === "Cure Wounds") {
      activity.data = foundry.utils.mergeObject(activity.data, {
        consumption: {
          spellSlot: false,
          targets: [
            {
              type: "itemUses",
              value: "1",
              target: "",
              scaling: {
                mode: "amount",
                formula: "",
              },
            },
          ],
          scaling: {
            allowed: true,
            max: "4",
          },
        },
      });
    }
    return activity;
  }
}
