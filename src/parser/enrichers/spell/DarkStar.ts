import DDBEnricherData from "../data/DDBEnricherData";

export default class DarkStar extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
            activityId: "ddbDarkStZoneSa1",
          }),
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: [
              DDBEnricherData.SRDEffects.condition("deafened"),
              DDBEnricherData.SRDEffects.damageImmunity("thunder"),
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
        id: "ddbDarkStZoneSa1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: "Enters the sphere or starts its turn there",
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
