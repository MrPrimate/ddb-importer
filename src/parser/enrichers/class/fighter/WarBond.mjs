/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class WarBond extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Summon Weapon",
      activationType: "bonus",
      targetType: "self",
      noeffect: true,
    };
  }

  get effects() {
    return [
      {
        name: "Weapon Bond",
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Bonded]`, 20, "name"),
        ],
      },
    ];
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Bond, 1st Weapon",
          type: "enchant",
        },
        build: {
          generateActivation: true,
          generateRange: true,
          generateConsumption: true,
          activationOverride: {
            value: "1",
            units: "hour",
          },
          rangeOverride: {
            units: "self",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: 1,
                scaling: { mode: "", formula: "" },
              },
            ],
          },
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
          },
        },
      },
      {
        constructor: {
          name: "Bond, 2nd Weapon",
          type: "enchant",
        },
        build: {
          generateActivation: true,
          generateRange: true,
          generateConsumption: true,
          activationOverride: {
            value: "1",
            units: "hour",
          },
          rangeOverride: {
            units: "self",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: 1,
                scaling: { mode: "", formula: "" },
              },
            ],
          },
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter": {
          retainUseSpent: true,
        },
        "system.uses": {
          spent: 0,
          max: "2",
        },
      },
    };
  }

}
