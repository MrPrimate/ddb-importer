import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A cursed graft with two unrelated Constitution saves: one when you attune,
 * and a weekly one against turning into a Vampire Spawn. DDB text writes the
 * first as "DC 15 Constitution save" and the second as a "saving throw", and a
 * single parsed activity can only carry one, so both are built here.
 *
 * The Strength increase is a DDB modifier and already has its own effect.
 */
export default class MuscleGraft extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Attunement Save",
      targetType: "self",
      activationType: "special",
      activationCondition: "When you become attuned to the graft",
      data: {
        save: {
          ability: ["con"],
          dc: {
            calculation: "",
            formula: "15",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Curse: Weekly Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: false,
          activationOverride: {
            type: "special",
            condition: "At the end of each week while the curse lasts",
          },
          saveOverride: {
            ability: ["con"],
            dc: {
              calculation: "",
              formula: "10",
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Muscle Graft: Constitution Loss",
        activityMatch: "Attunement Save",
        options: {
          // the "to a minimum of 1" floor cannot be expressed as a plain add
          description: "Your Constitution decreases by 2, to a minimum of 1. Remove this effect by hand if it would take you below 1.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-2", 5, "system.abilities.con.value"),
        ],
      },
    ];
  }

}
