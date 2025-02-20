/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class MeldIntoStone extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast",
    };
  }


  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Minor Physical Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateDuration: true,
          generateActivation: true,
          noSpellslot: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 6,
              denomination: 6,
              types: ["force"],
            }),
          ],
          noeffect: true,
          activationOverride: {
            type: "",
            condition: "",
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
      },
      {
        constructor: {
          name: "Destruction",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateDuration: true,
          generateActivation: true,
          noSpellslot: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "50",
              types: ["force"],
            }),
          ],
          noeffect: true,
          activationOverride: {
            type: "",
            condition: "",
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
      },
    ];
  }

}
