import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";

export default class RivalCoin extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Toss Coin",
      activationType: "action",
      addItemConsume: true,
      noTemplate: true,
      rangeSelf: true,
      targetType: "self",
      data: { roll: { formula: "1d2", name: "Odd: Tails; Even: Heads", prompt: false, visible: true } },
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "1", [{ period: "dawn", type: "recoverAll" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Heads", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        noeffect: false,
        activationCondition:
          "After Toss Coin rolls an even number; on failure, disadvantage on the target's next attack before its next turn ends",
        rangeType: "ft",
        rangeValue: 60,
        overrideRange: true,
        targetType: "creature",
        targetCount: "1",
        data: {
          save: { ability: ["wis"], dc: { calculation: "", formula: "13" } },
          damage: {
            includeBase: false,
            onSave: "half",
            parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, type: "psychic" })],
          },
        },
      }),
      itemActivity("Tails", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        activationCondition: "After Toss Coin rolls an odd number",
        targetType: "self",
        data: {
          damage: {
            includeBase: false,
            parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, type: "psychic" })],
          },
        },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Rival's Distraction",
        activityMatch: "Heads",
        options: {
          transfer: false,
          expiry: "targetEnd",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Remove after the next attack. DAE or AC5e can expire this automatically after one attack.",
        },
        daeSpecialDurations: ["1Attack"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
      },
    ];
  }

}
