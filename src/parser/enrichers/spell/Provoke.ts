import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Magus Class. The provoked creature has Disadvantage on attacks against anyone but the
 * caster (AC5e scopes it), and attacking someone else lets the caster make a Reaction attack
 * that deals an extra 1d6 Force on a hit.
 */
export default class Provoke extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Provoke",
      targetType: "creature",
      removeDamageParts: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Reaction Strike Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          noSpellslot: true,
          partialDamageParts: [0],
          activationOverride: { type: "reaction", value: 1, condition: "The provoked creature attacks a creature other than you; add to your Unarmed Strike or weapon attack's damage on a hit" },
          durationOverride: { units: "inst", concentration: false },
        },
        overrides: {
          noeffect: true,
          targetType: "creature",
          targetCount: 1,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Provoked",
        activityMatch: "Provoke",
        options: {
          description: "Disadvantage on attack rolls against creatures other than the caster. Ends if it ends its turn more than 60 feet from the caster.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("effectOriginTokenId !== opponentId", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
      },
    ];
  }

}
