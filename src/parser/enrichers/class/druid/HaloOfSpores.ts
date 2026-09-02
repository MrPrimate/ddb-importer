import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Circle of Spores: the parsed reaction save (Con, scale-driven necrotic) stays
 * the primary; "Place Halo" puts a 10-foot emanation on the druid whose region
 * offers that reaction whenever a creature moves within 10 feet or starts its
 * turn there. The card is the prompt: the druid declines by not rolling.
 */
export default class HaloOfSpores extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Halo of Spores",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    // Spreading Spores pulls the Halo of Spores class ACTION for its own save;
    // the emanation belongs to the feature document only
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Place Halo",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          activationOverride: {
            type: "special",
            condition: "Places the 10-foot halo of spores around you",
          },
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
            template: {
              count: "1",
              contiguous: false,
              type: "radius",
              size: "10",
              units: "ft",
            },
          },
        },
        overrides: {
          data: {
            range: {
              override: true,
              units: "self",
            },
            behaviors: [
              DDBEnricherData.BehaviorHelper.activity({
                events: ["tokenEnter", "tokenMoveIn", "tokenTurnStart"],
                activityName: "Halo of Spores",
                excludeSelf: true,
              }),
            ],
          },
        },
      },
    ];
  }

}
