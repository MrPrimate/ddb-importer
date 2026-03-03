import DDBEnricherData from "../../data/DDBEnricherData";

export default class HuntersPrey extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Choice",
      addItemConsume: true,
      targetType: "self",
      activationType: "special",
      activationCondition: "Finish a short or long rest",
      data: {
        sort: 2,
      },
    };
  }

  get effects() {
    return [
      {
        name: "Colossus Slayer",
        activityMatch: "Choice",
        data: {
          img: "icons/creatures/magical/construct-iron-stomping-yellow.webp",
        },
      },
      {
        name: "Horde Breaker",
        activityMatch: "Choice",
        data: {
          img: "icons/creatures/invertebrates/wasp-swarm-movement.webp",
        },
      },
    ];
  }

  get override() {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [
          { period: "sr", type: "recoverAll", formula: undefined },
        ],
      },
      retainOriginalConsumption: true,
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbHuntersPrey">
<p><strong>Implementation Details</strong></p>
<p>You can use the effects on the Choice action to track your choice. The damage activity is provided for Colossus Slayer.</p>
</section>`,
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Colossus Slayer: Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateTarget: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "Once per turn, if target is missing hit points",
          data: {
            sort: 1,
            range: {
              value: null,
              units: "spec",
            },
            uses: {
              "spent": 0,
              "recovery": [
                {
                  "period": "turn",
                  "type": "recoverAll",
                },
              ],
              "max": "1",
            },
            damage: {
              parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: DDBEnricherData.allDamageTypes() })],
            },
          },
        },
      },
    ];
  }

}
