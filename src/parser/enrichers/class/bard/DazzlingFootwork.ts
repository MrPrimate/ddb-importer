import DDBEnricherData from "../../data/DDBEnricherData";

export default class DazzlingFootwork extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      useActivitySnippet: { name: "Bardic Damage", type: "class" },
      targetType: "self",
      data: {
        name: "Bardic Damage",
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
        name: "Unarmored Defense",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.acCalcsAddChange("unarmoredBard", 10),
        ],
        activityMatch: "No Activity",
      },
      {
        name: "Bardic Damage",
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Dazzling Footwork]`, 20, "name"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "activities[attack].attack.ability"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.damage.base.custom.enabled"),
          DDBEnricherData.ChangeHelper.overrideChange("@scale.dance.dazzling-footwork + @mod", 20, "system.damage.base.custom.formula"),
        ],
        activityMatch: "Bardic Damage",
      },
    ];
  }


  override get clearAutoEffects(): boolean {
    return true;
  }

}
