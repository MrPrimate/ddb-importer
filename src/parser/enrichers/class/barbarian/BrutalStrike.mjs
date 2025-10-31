/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BrutalStrike extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      noeffect: true,
      name: "Brutal Strike Damage",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "@scale.barbarian.brutal-strike" })],
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Forceful Blow",
          type: "utility",
        },
        build: {
          noeffect: true,
          generateActivation: true,
        },
      },
      {
        constructor: {
          name: "Hamstrung Blow",
          type: "utility",
        },
        build: {
          generateActivation: true,
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Hamstrung",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("-15", 90, "system.attributes.movement.walk"),
        ],
        activityMatch: "Hamstrung Blow",
      },
      {
        name: "Reckless Attack: Brutal Strike Damage",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("@scale.barbarian.brutal-strike", 20, "system.bonuses.mwak.damage"),
        ],
        options: {
          transfer: true,
          disabled: true,
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
