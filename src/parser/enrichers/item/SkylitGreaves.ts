import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";

/**
 * Skylit Greaves: 5 charges (1d4 + 1 at dawn) spent on a battering whirlwind or on flight equal to
 * walking speed with hover for 10 minutes. The passive speed and resistances come from DDB modifiers.
 */
export default class SkylitGreaves extends DDBEnricherData {
  override get activity(): IDDBActivityData {
    return {
      name: "Battering Whirlwind",
      addItemConsume: true,
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "5", [{ period: "dawn", type: "formula", formula: "1d4 + 1" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Wind Torrent", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        activationCondition: "Spend 2 charges instead to also create the Battering Whirlwind",
        addItemConsume: true,
        noConsumeTargets: false,
        noeffect: false,
      }),
      // declaring additional activities stops the parser splitting out this second save itself
      itemActivity("Thrown Into a Creature", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        activationCondition: "A creature flung by the Battering Whirlwind is thrown at another creature",
        targetType: "creature",
        targetCount: "1",
        data: {
          save: { ability: ["dex"], dc: { calculation: "", formula: "17" } },
          damage: {
            includeBase: false,
            onSave: "half",
            parts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 8, type: "bludgeoning" })],
          },
        },
      }, { generateDamage: true }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Wind Torrent",
        activityMatch: "Wind Torrent",
        options: {
          transfer: false,
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.attributes.movement.hover"),
        ],
      },
    ];
  }

}
