import DDBEnricherData from "../../data/DDBEnricherData";

export default class RestoreKeeperOfSouls extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "none",
      data: {
        consumption: {
          scaling: { allowed: true, max: "4" },
          targets: [
            {
              type: "itemUses",
              target: "",
              value: -1,
              scaling: { mode: "", formula: "" },
            },
            {
              type: "spellSlots",
              value: "1",
              target: "6",
              scaling: { mode: "level", formula: "" },
            },
          ],
        },
      },
    };
  }

}
