import DDBEnricherData from "../data/DDBEnricherData";

export default class Web extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbWebSpellSave1",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["web"] }),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
            activityId: "ddbWebSpellZone1",
          }),
        ],
      },
    };
  }


  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbWebSpellZone1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: "Enters the webs or starts its turn there",
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

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Restrained",
        statuses: ["Restrained"],
      },
    ];
  }

}
