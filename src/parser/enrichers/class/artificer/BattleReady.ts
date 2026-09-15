import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Battle Ready (Battle Smith): attacks with a magic weapon can use Intelligence for the attack
 * and damage rolls. Two channels, both wanted:
 *
 * - An "Arcane Empowerment" enchant applied to a magic weapon by
 *   hand that overrides its attack ability to Intelligence;
 * - a passive transfer effect for everything else. dnd5e 6.0 has no rule type that swaps an
 *   attack's ability, so it adds the difference between the Intelligence modifier and the
 *   modifier the weapon actually rolled with (`@mod` is the attack's ability modifier in dnd5e
 *   roll data), gated to magic weapon attacks. It adds nothing where the item parser already
 *   baked Intelligence into a DDB magic weapon or where the enchant has been applied, and covers
 *   weapons added in Foundry later.
 */
export default class BattleReady extends DDBEnricherData {

  static INT_OVER_WEAPON_ABILITY = "max(0, @abilities.int.mod - @mod)";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Arcane Empowerment",
      id: "ddbArcaneEmpowr1",
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
        name: "Arcane Empowerment",
        activityMatch: "Arcane Empowerment",
        magicalBonus: {
          nameAddition: "Battle Ready",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("int", 20, "activities[attack].attack.ability"),
        ],
        options: {
          durationSeconds: null,
          expiry: null,
          description: "Attack and damage rolls with this magic weapon use Intelligence.",
        },
        data: {
          _id: "ddbArcaneEmpoEf1",
        },
      },
      {
        name: "Arcane Empowerment: Intelligence Attacks",
        options: {
          transfer: true,
          description: "Attack and damage rolls with a magic weapon use Intelligence when it is higher than the weapon's ability. This doesn't show up on the sheet, but will when rolled.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleBonusChange("attack", BattleReady.INT_OVER_WEAPON_ABILITY, {
            conditions: DDBEnricherData.ChangeHelper.MAGIC_WEAPON_ATTACK_FILTER,
          }),
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", BattleReady.INT_OVER_WEAPON_ABILITY, {
            conditions: DDBEnricherData.ChangeHelper.MAGIC_WEAPON_ATTACK_FILTER,
          }),
        ],
      },
    ];
  }

}
