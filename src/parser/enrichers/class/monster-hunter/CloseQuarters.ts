import DDBEnricherData from "../../data/DDBEnricherData";

export default class CloseQuarters extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "reaction",
      activationCondition: "You hit a creature with a Melee weapon attack",
      allowCritical: false,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              // 2d6, becoming 4d6 at Monster Hunter level 11
              customFormula: "(2 + 2 * floor(@classes.monster-hunter.levels / 11))d6",
              types: ["bludgeoning", "piercing", "slashing"],
            }),
          ],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Off Balance",
        options: {
          durationRounds: 1,
        },
        daeSpecialDurations: ["turnStartSource"],
        ac5eChanges: [
          // automated-conditions-5e: disadvantage on the target's next attack
          DDBEnricherData.ChangeHelper.customChange("once; 1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
      },
    ];
  }

}
