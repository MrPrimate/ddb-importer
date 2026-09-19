import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Arrow-Catching Shield: a standing +2 AC against ranged attacks while the shield is worn, and a
 * reaction to become the target of a ranged attack aimed at a creature within 5 feet. The bonus is
 * a transfer effect and owes nothing to the reaction. dnd5e rules only adjust the roller's own
 * rolls, so "AC against ranged attacks" has no native form: AC5e's modifyAC carries it, and
 * without AC5e the flat bonus ships disabled as a toggle, since left on it would count against
 * melee attacks too.
 */
export default class ArrowCatchingShield extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Intercept Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
          activationOverride: { type: "reaction", value: null, condition: "When an attacker makes a ranged attack roll against a target within 5 feet of you" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 5,
          noTemplate: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const name = "Arrow-Catching: +2 AC vs Ranged";
    return [
      {
        name,
        ac5eOnly: true,
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=2; actionType.rwak || actionType.rsak",
            20,
            "flags.automated-conditions-5e.modifyAC",
          ),
        ],
        options: {
          transfer: true,
          // the reaction's "until" wording in the description must not time a standing bonus
          durationSeconds: null,
          expiry: null,
          description: "+2 AC against ranged attacks while you wield this shield.",
        },
      },
      {
        name,
        ac5eNever: true,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
        options: {
          transfer: true,
          disabled: true,
          durationSeconds: null,
          expiry: null,
          description: "+2 AC against ranged attacks while you wield this shield. Enable this effect when a ranged attack targets you.",
        },
      },
    ];
  }

}
