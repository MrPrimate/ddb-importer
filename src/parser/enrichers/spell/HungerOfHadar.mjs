/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class HungerOfHadar extends DDBEnricherData {

  get type() {
    return "ddbmacro";
  }

  get activity() {
    return {
      name: "Cast and Place Darkness",
      data: {
        img: "icons/magic/unholy/orb-glowing-purple.webp",
        macro: {
          name: "Toggle Darkness",
          function: "ddb.generic.light",
          visible: false,
          parameters: `{"darkness":true,"distance":20,"isTemplate":true,"lightConfig":{"dim":0,"bright":20},"flag":"darkness"}`,
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Start of Turn Damage",
          type: "damage",
        },
        build: {
          generateSave: false,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          noSpellslot: true,
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "Start of turn",
          noTemplate: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 6,
              types: "cold",
              scalingMode: this.is2014 ? "" : "whole",
              scalingNumber: this.is2014 ? "" : "1",
            }),
          ],
        },
      },
      {
        constructor: {
          name: "End of Turn Save vs Damage",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          noSpellslot: true,
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "End of turn",
          noTemplate: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 6,
              types: "acid",
              scalingMode: this.is2014 ? "" : "whole",
              scalingNumber: this.is2014 ? "" : "1",
            }),
          ],
        },
      },
    ];
  }

}

