import DDBEnricherData from "../data/DDBEnricherData";

export default class AbsorbElements extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: `${this.data.name} Effect`,
      data: {
        description: {
          chatFlavor: "Uses the damage type of the triggered attack: Acid, Cold, Fire, Lightning, or Poison.",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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

  override get effects(): IDDBEffectHint[] {
    const noMidiEffects: IDDBEffectHint[] = ["Acid", "Cold", "Fire", "Lightning", "Thunder"].map((element) => {
      return {
        midiNever: true,
        name: `Absorb ${element}`,
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange(element, 1),
        ],
        activityMatch: `${this.data.name} Effect`,
      };
    });
    const midiEffects: IDDBEffectHint[] = [
      {
        name: `${this.data.name}: Extra Damage`,
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`(@item.level)d6`, 20, "system.rolls.damage.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`(@item.level)d6`, 20, "system.rolls.damage.msak.bonus"),
        ],
        // "the first time you hit with a melee attack on your next turn" - the effect
        // rides the caster, so the caster's turn end is the bound
        options: { expiry: "sourceEnd" },
        daeSpecialDurations: ["DamageDealt"],
      },
      {
        name: `${this.data.name}: Resistance`,
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.damageResistanceChange(""),
        ],
        options: { expiry: "sourceStart" },
      },
    ];
    return [...noMidiEffects, ...midiEffects];
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "spell",
      name: "absorbElements.js",
    };
  }

  override get setMidiOnUseMacroFlag(): IDDBSetMidiOnUseMacroFlag {
    return {
      type: "spell",
      name: "absorbElements.js",
      triggerPoints: ["postActiveEffects"],
    };
  }

  override get override(): IDDBOverrideData {
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
