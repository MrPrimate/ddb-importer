import DDBEnricherData from "../../data/DDBEnricherData";

export default class BondOfShelter extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Create Shelter",
      activationType: "action",
      targetType: "creature",
      addItemConsume: true,
      data: {
        duration: {
          override: true,
          value: "1",
          units: "hour",
        },
        target: {
          override: true,
          affects: {
            type: "enemy",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "cylinder",
            size: "30",
            height: "20",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
            activityName: "Nature's Wrath",
            excludeSelf: true,
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Nature's Wrath",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 5, denomination: 10, type: "bludgeoning" }),
          ],
          activationOverride: {
            type: "special",
            condition: "Enters the cylinder for the first time on a turn or starts its turn there",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "creature",
            },
            template: {},
          },
        },
        overrides: {
          data: {
            range: {
              override: true,
              units: "spec",
            },
          },
        },
      },
    ];
  }

}
