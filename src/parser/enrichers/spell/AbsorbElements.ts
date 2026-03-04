import DDBEnricherData from "../data/DDBEnricherData";

export default class AbsorbElements extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: `${this.data.name} Effect`,
      data: {
        description: {
          chatFlavor: "Uses the damage type of the triggered attack: Acid, Cold, Fire, Lightning, or Poison.",
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Elemental Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: ["acid", "cold", "fire", "lightning", "thunder"],
            }),
          ],
          noeffect: true,
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    const noMidiEffects = ["Acid", "Cold", "Fire", "Lightning", "Thunder"].map((element) => {
      return {
        midiNever: true,
        name: `Absorb ${element}`,
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange(element, 1),
        ],
        activityMatch: `${this.data.name} Effect`,
      };
    });
    const midiEffects = [
      {
        name: `${this.data.name}: Extra Damage`,
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`(@item.level)d6`, 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`(@item.level)d6`, 20, "system.bonuses.msak.damage"),
        ],
        daeSpecialDurations: ["DamageDealt" as const, "turnEnd" as const],
        data: {
          duration: {
            rounds: 2,
            startTurn: 1,
          },
        },
      },
      {
        name: `${this.data.name}: Resistance`,
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.damageResistanceChange(""),
        ],
        daeSpecialDurations: ["turnStartSource" as const],
        data: {
          duration: {
            rounds: 2,
          },
        },
      },
    ];
    return [...noMidiEffects, ...midiEffects];
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "absorbElements.js",
    };
  }

  get setMidiOnUseMacroFlag() {
    return {
      type: "spell",
      name: "absorbElements.js",
      triggerPoints: ["postActiveEffects"],
    };
  }

  get override() {
    return {
      data: {
        flags: {
          "midi-qol": {
            reactionCondition: "reaction === 'isDamaged' && (workflow.damageDetail.some(d => ['acid', 'cold', 'fire', 'lightning', 'thunder'].includes(d.type.toLowerCase())) || ['acid', 'cold', 'fire', 'lightning', 'thunder'].some(dt => workflow.item.formula.toLowerCase().includes(dt)) || ['acid', 'cold', 'fire', 'lightning', 'thunder'].some(dt => workflow.item.damage.versatile.toLowerCase().includes(dt)))",
          },
        },
      },
    };
  }

}
