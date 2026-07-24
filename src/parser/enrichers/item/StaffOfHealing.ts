import DDBEnricherData from "../data/DDBEnricherData";

export default class StaffOfHealing extends DDBEnricherData {
  async customFunction({ name, activity } : ICustomFunctionOptions) {
    if (name === "Cure Wounds" && activity?.data) {
      const update = {
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
      } as Partial<I5eActivity>;
      activity.data = foundry.utils.mergeObject(activity.data, update) as Partial<I5eActivity>;
    }
  }
}
