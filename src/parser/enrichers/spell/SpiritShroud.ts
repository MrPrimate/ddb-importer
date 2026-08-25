import DDBEnricherData from "../data/DDBEnricherData";

export default class SpiritShroud extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: "Slowed by Spirit Shroud",
            auraeffectsNever: true,
          }),
        ],
      },
      overrideTarget: true,
      targetType: "self",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [{
      init: {
        name: "Damage",
        type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      },
      build: {
        generateDamage: true,
        generateConsumption: false,
        noSpellslot: true,
        generateAttack: false,
        onsave: false,
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["radiant", "necrotic", "cold"], scalingMode: "half", scalingNumber: 1 }),
        ],
        noeffect: true,
      },
      overrides: {
        noTemplate: true,
      },
    }];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Surrounded by a Spirit Shroud",
        auraeffectsNever: true,
        midiNever: true,
        options: {
          durationSeconds: 60,
        },
      },
      {
        name: "Slowed by Spirit Shroud",
        standalone: true,
        auraeffectsNever: true,
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange(
            "-10",
            20,
          ),
        ],
        options: {
          durationSeconds: 60,
          description: "Within 10 feet of the Spirit Shroud: speed reduced by 10 feet (creatures of the caster's choice).",
        },
      },
      {
        name: "Spirit Shroud",
        activityMatch: "Cast",
        auraeffectsOnly: true,
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange(
            "-10",
            20,
          ),
        ],
        data: {
          flags: {
            dae: {
              specialDuration: [],
              selfTargetAlways: true,
              selfTarget: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: false,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `10`,
          disposition: -1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange(
            "@uuid",
            20,
            "flags.midi-qol.spiritShroud",
          ),
        ],
      },
    ];
  }

  override get setMidiOnUseMacroFlag(): IDDBSetMidiOnUseMacroFlag {
    return {
      type: "spell",
      name: "spiritShroud.js",
      triggerPoints: ["preActiveEffects"],
    };
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "spell",
      name: "spiritShroud.js",
    };
  }

}
