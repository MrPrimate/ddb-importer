import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Battle Ready (Battle Smith): attacks with a magic weapon can use Intelligence for the attack
 * and damage rolls. An "Arcane Empowerment" enchant, applied to a magic weapon by hand, overrides
 * its attack ability to Intelligence. The item parser already bakes Intelligence into DDB magic
 * weapons; the enchant covers weapons added in Foundry later.
 */
export default class BattleReady extends DDBEnricherData {

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
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("{}, Battle Ready", 20, "name"),
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
    ];
  }

}
