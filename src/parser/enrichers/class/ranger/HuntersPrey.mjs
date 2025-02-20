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
    };
  }

  get effects() {
    return [
      {
        name: "Colossus Slayer",
        data: {
          "flags.ddbimporter.activityMatch": "Choice",
        },
      },
      {
        name: "Horde Breaker",
        data: {
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
            damage: {
              parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: DDBEnricherData.allDamageTypes() })],
            },
          },
        },
      },
    ];
  }

}
