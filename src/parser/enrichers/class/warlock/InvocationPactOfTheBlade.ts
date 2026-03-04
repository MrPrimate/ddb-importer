import DDBEnricherData from "../../data/DDBEnricherData";

export default class InvocationPactOfTheBlade extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity() {
    return {
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
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Pact Weapon]`, 20, "name"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("necrotic", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("psychic", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("radiant", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.proficient"),
          DDBEnricherData.ChangeHelper.overrideChange("cha", 20, "system.ability"),
        ],
      },
    ];
  }
}
