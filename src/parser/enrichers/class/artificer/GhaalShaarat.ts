import DDBEnricherData from "../../data/DDBEnricherData";

export default class GhaalShaarat extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: false,
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      type: "enchant",
      magicalBonus: {
        makeMagical: true,
        bonus: "1",
      },
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange(`{} [Ghaal'Shaarat]`, 20, "name"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("thr", 20, "system.properties"),
        DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.range.value"),
        DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "system.range.long"),
      ],
    }];
  }

}
