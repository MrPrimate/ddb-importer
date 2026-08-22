import DDBEnricherData from "../data/DDBEnricherData";

export default class DemonArmor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        restrictions: {
          type: "weapon",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        descriptionHint: true,
        magicalBonus: {
          makeMagical: true,
          bonus: "1",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.damage.base.number"),
          DDBEnricherData.ChangeHelper.overrideChange("8", 20, "system.damage.base.denomination"),
          DDBEnricherData.ChangeHelper.overrideChange("false", 20, "system.damage.base.custom.enabled"),
        ],
      },
    ];
  }

}
