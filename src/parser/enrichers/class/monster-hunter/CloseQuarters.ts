import DDBEnricherData from "../../data/DDBEnricherData";

export default class CloseQuarters extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
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
              // 2d6, becoming 4d6 at Monster Hunter level 11 (scale added by DDBSubClass)
              customFormula: "@scale.carver-guild.close-quarters-damage",
              types: ["bludgeoning", "piercing", "slashing"],
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Apply Disadvantage",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            condition: "Part of the Close Quarters reaction",
          },
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Close Quarters Disadvantage",
        activityMatch: "Apply Disadvantage",
        options: {
          // "its next attack roll before the start of your next turn"
          expiry: "sourceStart",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
      },
      {
        name: "Close Quarters (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional extra damage on a melee weapon hit, spending your reaction.",
        },
        ac5eChanges: [
          // the extra damage takes the weapon's damage type, so no flavor is given
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=@scale.carver-guild.close-quarters-damage; oncePerRound; optin; name=Close Quarters; description=Uses Reaction; actionType.mwak",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
