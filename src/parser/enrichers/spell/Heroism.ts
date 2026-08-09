import DDBEnricherData from "../data/DDBEnricherData";

export default class Heroism extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      stopHealSpellActivity: true,
      name: "Cast",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Start of Turn Temp HP",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "@mod", type: "temphp" }),
          noeffect: true,
          activationOverride: { type: "special", condition: "Start of each creatures turn" },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
      },
    ];
  }

  override get clearAutoEffects() {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        activityMatch: "Cast",
        options: {
          description: "Gain temp hp at the start of your turn",
        },
        changes: [
          DDBEnricherData.ChangeHelper.conditionImmunityChange("frightened"),
        ],
      },
      {
        noCreate: true,
        midiOnly: true,
        name: "Heroism (Automation)",
        macroChanges: [
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

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "spell",
      name: "heroism.js",
    };
  }

}
