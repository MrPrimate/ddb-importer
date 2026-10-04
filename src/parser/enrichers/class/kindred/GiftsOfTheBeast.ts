import DDBEnricherData from "../../data/DDBEnricherData";

/** Kindred (Gifts of the Beast): a bonus action and 1 Blood Point grow claws for a minute; Unarmed Strikes deal 2d6 slashing and can use Dexterity. */
export default class GiftsOfTheBeast extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Feral Weapons",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "feat:blood-potency",
      itemConsumeValue: "1",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Rending Claws", type: DDBEnricherData.ACTIVITY_TYPES.ATTACK },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateAttack: true,
          generateDamage: true,
          activationOverride: { type: "action", value: 1, condition: "While Feral Weapons is active" },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, bonus: "@mod", types: ["slashing"] })],
        },
        overrides: {
          targetType: "creature",
          noConsumeTargets: true,
          data: {
            attack: { ability: "dex", type: { value: "melee", classification: "unarmed" } },
            range: { units: "ft", value: "5" },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Feral Weapons",
        activityMatch: "Feral Weapons",
        options: { durationSeconds: 60, description: "Unarmed Strikes deal 2d6 Slashing damage and can use Dexterity instead of Strength." },
      },
    ];
  }

}
