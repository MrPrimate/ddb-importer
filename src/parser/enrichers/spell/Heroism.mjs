/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class Heroism extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      stopHealSpellActivity: true,
      name: "Cast",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Start of Turn Temp HP",
          type: "heal",
        },
        build: {
          generateHealing: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          healingPart: DDBEnricherMixin.basicDamagePart({ customFormula: "@mod", type: "temphp" }),
          noeffect: true,
          activationOverride: { type: "spec", condition: "Start of each creatures turn" },
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
        options: {
          description: "Gain temp hp at the start of your turn",
        },
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange("frightened", 20, "system.traits.ci.value"),
        ],
      },
    ];
  }

}
