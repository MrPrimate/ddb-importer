import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Warded creatures have advantage on saves and attackers have disadvantage against them. A fiend or
 * undead that hits one with a melee attack saves or is Blinded: until the spell ends in 2014, until
 * the end of its next turn in 2024. Only the 2014 aura sheds dim light.
 */
export default class HolyAura extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Holy Aura" }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Blinded",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          // the 2014 Blinded lasts as long as the spell, which it takes from this activity
          noConcentration: true,
          generateSave: true,
          generateConsumption: false,
          noSpellslot: true,
          generateRange: true,
        },
        overrides: {
          targetType: "creature",
          data: {
            range: {
              units: "ft",
              value: "30",
            },
          },
          overrideRange: true,
          overrideTarget: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        name: "Holy Aura: Blinded",
        activityMatch: "Save vs Blinded",
        options: this.is2014 ? {} : { expiry: "targetEnd" },
      },
      ...(this.is2014 ? [this.lightEffect] : []),
      {
        name: "Holy Aura",
        standalone: true,
        options: {
          durationSeconds: 60,
        },
        // other creatures have disadvantage on attack rolls against a warded creature
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.grants.attack.disadvantage"),
        ],
        changes: ["str", "dex", "con", "int", "wis", "cha"].map((ability) =>
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange(ability),
        ),
      },
    ];
  }

  /** The 2014 aura's dim light on the caster. */
  get lightEffect(): IDDBEffectHint {
    return {
      name: "Holy Aura: Light",
      activityMatch: "Cast",
      options: {
        durationSeconds: 60,
      },
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("5", 20, "token.light.dim"),
        DDBEnricherData.ChangeHelper.overrideChange("#97a9ab", 20, "token.light.color"),
        DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
        DDBEnricherData.ChangeHelper.overrideChange("4", 20, "token.light.animation.intensity"),
        DDBEnricherData.ChangeHelper.overrideChange("sunburst", 20, "token.light.animation.type"),
        DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.speed"),
      ],
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          target: {
            affects: {
              type: "ally",
            },
          },
        },
      },
    };
  }

}
