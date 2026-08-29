import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Two rolls in sequence: an ability check to bite through to the centre, and
 * only on a success a Constitution save against the nausea. DDB parses the
 * save alone, so the check is added and made the primary activity.
 *
 * The check is "Strength or Constitution (your choice)", and dnd5e's
 * `check.ability` is a single StringField with no way to offer a raw ability
 * choice, so it is built on Strength with the alternative called out in the
 * activation condition.
 */
export default class EverlastingSugarbomb extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bite to the Centre",
      targetType: "self",
      activationType: "action",
      activationCondition: "Strength or Constitution check, your choice: switch the ability on this activity to use Constitution",
      data: {
        check: {
          ability: "str",
          associated: [],
          dc: {
            calculation: "",
            formula: "25",
          },
          visible: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Nausea Save",
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
            condition: "After a successful check to bite through to the centre",
          },
          saveOverride: {
            ability: ["con"],
            dc: {
              calculation: "",
              formula: "16",
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned (Everlasting Sugarbomb)",
        activityMatch: "Nausea Save",
        statuses: ["Poisoned"],
        options: {
          durationSeconds: 60,
          description: "Poisoned for 1 minute, suffering painful nausea.",
        },
      },
    ];
  }

}
