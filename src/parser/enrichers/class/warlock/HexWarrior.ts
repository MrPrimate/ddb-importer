import DDBEnricherData from "../../data/DDBEnricherData";

export default class HexWarrior extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        ignoreTransfer: true,
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Hex Weapon]`, 20, "name"),
          // the attack activity's own ability, which makes the weapon roll with Charisma. The legacy
          // "system.ability" key only adds to the candidate abilities through a dnd5e shim
          DDBEnricherData.ChangeHelper.overrideChange("cha", 20, "activities[attack].attack.ability"),
        ],
      },
    ];
  }
}
