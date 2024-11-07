/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class HuntersPrey extends DDBEnricherMixin {

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
          value: "0",
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
              parts: [DDBEnricherMixin.basicDamagePart({ number: 1, denomination: 8, types: DDBEnricherMixin.allDamageTypes() })],
            },
          },
        },
      },
    ];
  }

}
