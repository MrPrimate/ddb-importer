import DDBEnricherData from "../data/DDBEnricherData";

export default class JallarzisStormOfRadiance extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbJalStoZoneSa1",
          }),
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: [
              DDBEnricherData.SRDEffects.condition("blinded"),
              DDBEnricherData.SRDEffects.condition("deafened"),
            ],
          }),
        ],
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbJalStoZoneSa1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: "Enters the storm or ends its turn there",
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

}
