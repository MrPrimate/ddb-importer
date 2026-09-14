import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Battle Ready (Battle Smith): attacks with a magic weapon can use Intelligence for the attack
 * and damage rolls.
 */
export default class BattleReady extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Arcane Empowerment",
      activationType: "special",
      activationCondition: "Apply to a magic weapon you wield",
      noTemplate: true,
      targetType: "self",
      data: {
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
        name: "Battle Ready",
        activityMatch: "Arcane Empowerment",
        magicalBonus: {
          nameAddition: " (Battle Ready)",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("int", 20, "activities[attack].attack.ability"),
        ],
        options: {
          description: "Attack and damage rolls with this magic weapon use Intelligence.",
        },
      },
    ];
  }

}
