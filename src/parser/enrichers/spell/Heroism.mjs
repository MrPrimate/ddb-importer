/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Heroism extends DDBEnricherData {

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
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "@mod", type: "temphp" }),
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

  get clearAutoEffects() {
    return true;
  }

  get effects() {
    return [
      {
        activityMatch: "Cast",
        options: {
          description: "Gain temp hp at the start of your turn",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("frightened", 20, "system.traits.ci.value"),
        ],
      },
      {
        noCreate: true,
        midiOnly: true,
        name: "Heroism (Automation)",
        macroChange: [
          { macroType: "spell", macroName: "heroism.js" },
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `turn=start,damageRoll=@attributes.spell.mod,damageType=temphp,label=${this.data.name} Renewal,fastForwardDamage=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "heroism.js",
    };
  }

}
