import DDBEnricherData from "../data/DDBEnricherData";

export default class DemonArmor extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        restrictions: {
          type: "weapon",
        },
      }
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        descriptionHint: true,
        magicalBonus: {
          makeMagical: true,
          bonus: "1",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.bonuses.base.number"),
          DDBEnricherData.ChangeHelper.overrideChange("8", 20, "system.damage.base.denomination"),
          DDBEnricherData.ChangeHelper.overrideChange("false", 20, "system.damage.base.custom.enabled"),
        ],
      },
    ];
  }

}
