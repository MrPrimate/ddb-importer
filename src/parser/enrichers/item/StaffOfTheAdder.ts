import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";
import { riders, toggleOffChanges } from "../data/SelfEnchant";
import { itemActivity } from "./_ItemActivities";

/**
 * Awakening the snake head is a self-enchantment whose riders are the snake's attack (and its
 * 2014 venom), so they only appear while the head is animate; using it again reverts the head.
 */
export default class StaffOfTheAdder extends DDBEnricherData {

  static AWAKEN = "Awaken Snake Head";

  static riderId(name: string): string {
    return utils.namedIDStub(name, { prefix: "ddbItem" });
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return { noConsumeTargets: true, allowCritical: true, removeDamageParts: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const damage = [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "piercing" })];
    if (!this.is2014) {
      damage.push(DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, type: "poison" }));
    }
    const result = [
      itemActivity(StaffOfTheAdder.AWAKEN, DDBEnricherData.ACTIVITY_TYPES.ENCHANT, {
        activationType: "bonus",
        activationCondition: "Animate for 1 minute; snake head AC 15, HP 20. Track damage manually.",
        noeffect: false,
        data: {
          duration: { value: "1", units: "minute", concentration: false },
          enchant: { self: true },
        },
      }),
      itemActivity(
        "Attack with Snake",
        DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        {
          activationType: "action",
          activationCondition: "While the snake head is animate",
          ...(this.is2014 ? { flatAttack: "@prof" } : {}),
          targetType: "creature",
          targetCount: "1",
          rangeType: "ft",
          rangeValue: 5,
          overrideRange: true,
          data: {
            attack: {
              ability: this.is2014 ? "none" : "wis",
              type: { value: "melee", classification: "weapon" },
              flat: this.is2014,
            },
            damage: { includeBase: false, parts: damage },
          },
        },
        { generateAttack: true },
      ),
    ];
    if (this.is2014) {
      result.push(
        itemActivity("Snake Venom", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
          activationCondition: "When the snake head hits",
          targetType: "creature",
          targetCount: "1",
          rangeType: "any",
          data: {
            save: { ability: ["con"], dc: { calculation: "", formula: "15" } },
            damage: {
              includeBase: false,
              onSave: "none",
              parts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, type: "poison" })],
            },
          },
        }),
      );
    }
    return result;
  }

  override get effects(): IDDBEffectHint[] {
    const snakeActivities = this.is2014 ? ["Attack with Snake", "Snake Venom"] : ["Attack with Snake"];
    return [
      {
        name: "Snake Head Awakened",
        type: "enchant",
        activityMatch: StaffOfTheAdder.AWAKEN,
        options: {
          transfer: false,
        },
        changes: toggleOffChanges("Revert Snake Head"),
        data: {
          flags: {
            ddbimporter: riders({ activities: snakeActivities.map((name) => StaffOfTheAdder.riderId(name)) }),
          },
        },
      },
    ];
  }

}
