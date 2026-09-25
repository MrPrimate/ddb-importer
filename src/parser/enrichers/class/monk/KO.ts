import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Warrior of the Street level 17: once per turn on an Unarmed Strike hit, three Martial Arts dice
 * of extra Force damage, and a target left on 100 Hit Points or fewer is Unconscious for 10
 * minutes. One use per Short or Long Rest, which 5 Focus Points can restore.
 *
 * The parser reads the 5 Focus restore cost as the strike's own cost, so the strike spends the
 * feature's use and the Focus cost moves to a separate restore activity. The Hit Point threshold
 * is checked after the damage lands, which dnd5e cannot gate on, so the Unconscious effect is
 * applied by hand.
 */
export default class KO extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "K.O.",
      targetType: "creature",
      activationType: "special",
      activationCondition: "Once per turn when you hit a creature with an Unarmed Strike",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ customFormula: "3@scale.monk.die.die", types: ["force"] }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        id: "ddbKORestoreUse1",
        init: {
          name: "Restore K.O. (Focus)",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "No action required",
          },
        },
        overrides: {
          targetType: "self",
          addItemConsume: true,
          itemConsumeTargetName: "Monk's Focus",
          itemConsumeValue: "5",
          additionalConsumptionTargets: [
            {
              type: "itemUses",
              target: "",
              value: "-1",
              scaling: { mode: "", formula: "" },
            },
          ],
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "K.O.: Unconscious",
        activityMatch: "K.O.",
        statuses: ["Unconscious"],
        options: {
          durationSeconds: 600,
          description: "Apply only if the target has 100 Hit Points or fewer after the Unarmed Strike's damage.",
        },
      },
    ];
  }

}
