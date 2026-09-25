import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

export default class StaffOfTheAdder extends DDBEnricherData {

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
      itemActivity("Awaken Snake Head", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "bonus",
        activationCondition: "Animate for 1 minute; snake head AC 15, HP 20. Track damage manually.",
        data: { duration: { value: "1", units: "minute", concentration: false } },
      }),
      itemActivity("Revert Snake Head", DDBEnricherData.ACTIVITY_TYPES.UTILITY, { activationType: "bonus" }),
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

}
