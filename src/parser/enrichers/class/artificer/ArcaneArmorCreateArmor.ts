import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneArmorCreateArmor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Create Armor",
      targetType: "self",
      data: {
        midiProperties: {
          triggeredActivityId: "none",
          triggeredActivityTargets: "targets",
          triggeredActivityRollAs: "self",
          forceDialog: false,
          confirmTargets: "never",
        },
        restrictions: {
          type: "equipment",
          categories: ["heavy", "light", "medium"],
          allowMagical: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Arcane Armor",
        type: "enchant",
        descriptionHint: true,
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Arcane Armor]`, 10, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "system.strength"),
          DDBEnricherData.ChangeHelper.addChange("foc", 20, "system.properties"),
        ],
      },
    ];
  }

}
