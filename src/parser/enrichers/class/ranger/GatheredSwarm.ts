import DDBEnricherData from "../../data/DDBEnricherData";

export default class GatheredSwarm extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Extra Damage",
      activationType: "special",
      targetType: "creature",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save",
          type: "save",
        },
        build: {
          generateDamage: false,
        },
        overrides: {
          activationType: "special",
          targetType: "creature",
          data: {
            damage: {
              parts: [],
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        "system.uses": {
          "spent": 0,
          "recovery": [
            {
              "period": "turnStart",
              "type": "recoverAll",
            },
          ],
          "max": "1",
        },
      },
    };
  }
}
