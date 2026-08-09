import DDBEnricherData from "../../data/DDBEnricherData";

export default class HexWarrior extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      data: {
        name: "Bond With Weapon",
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        ignoreTransfer: true,
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Hex Weapon]`, 20, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("cha", 20, "system.ability"),
        ],
      },
    ];
  }
}
