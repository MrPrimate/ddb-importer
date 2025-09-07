/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HuntersPrey extends DDBEnricherData {

  get type() {
    return "utility";
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
        data: {
          img: "icons/creatures/magical/construct-iron-stomping-yellow.webp",
          "flags.ddbimporter.activityMatch": "Choice",
        },
      },
      {
        name: "Horde Breaker",
        data: {
          img: "icons/creatures/invertebrates/wasp-swarm-movement.webp",
          "flags.ddbimporter.activityMatch": "Choice",
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.retainOriginalConsumption": true,
        "system.uses": {
          spent: null,
          max: "1",
          recovery: [
            { period: "sr", type: 'recoverAll', formula: undefined },
          ],
        },
      },
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
        constructor: {
          name: "Colossus Slayer: Damage",
          type: "damage",
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
            damage: {
              parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: DDBEnricherData.allDamageTypes() })],
            },
          },
        },
      },
    ];
  }

}
