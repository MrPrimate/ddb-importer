import DDBEnricherData from "../data/DDBEnricherData";

export default class StaffOfHealing extends DDBEnricherData {
  async customFunction({ name, activity } : { name: string; activity: IDDBActivityData }) {
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
  }
}
