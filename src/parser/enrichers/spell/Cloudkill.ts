import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The cast stays DDB's save over its 20-foot sphere, a fixed area rather than an emanation, and
 * "Ongoing Save" is a free copy the region fires. 2014 fires it when a creature enters the cloud or
 * starts its turn there ("for the first time on a turn"); 2024 when it enters or ends its turn
 * there. The default once-per-turn gate holds either to one save a turn, and dragging the cloud
 * onto a creature raises the same enter event, covering 2024's "moves into its space". Any
 * creature is affected. Moving the cloud 10 feet away from the caster each turn is left to the
 * table, as is the 2014 printing rolling nothing as the cloud appears.
 */
export default class Cloudkill extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbCloKilSpellSa",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", this.is2014 ? "tokenTurnStart" : "tokenTurnEnd"],
            activityId: "ddbCloKilZoneSa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbCloKilZoneSa1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: this.is2014 ? "Enters the cloud or starts its turn there" : "Enters the cloud or ends its turn there",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            duration: { override: true, units: "inst", concentration: false },
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

}
