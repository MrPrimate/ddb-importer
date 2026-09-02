import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The 20-foot fog is a placed sphere the caster drifts 10 feet each turn; the
 * cast-time save is the parsed activity and the "Ongoing Save" duplicate fires
 * from the region whenever a creature enters the sphere or ends its turn there
 * (once per turn).
 */
export default class Doomtide extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbDoomTideAdSa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbDoomTideAdSa1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: "Enters the Sphere or ends its turn there (once per turn); or the Sphere moves into its space",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            range: {
              override: true,
              units: "spec",
            },
            target: {
              override: true,
            },
            behaviors: [],
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Doomed",
        options: {
          expiry: "targetEnd",
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("-1d6", 20, "system.rolls.ability.save.bonus"),
        ],
      },
    ];
  }

}
