import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Warded creatures have advantage on saves and attackers have disadvantage against them. A fiend or
 * undead that hits one with a melee attack saves or is Blinded: until the spell ends in 2014, until
 * the end of its next turn in 2024. Only the 2014 aura sheds dim light.
 */
export default class HolyAura extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Cast",
      targetType: "self",
      // rangeSelf: true,
      // noTemplate: true,
      // overrideRange: true,
      // overrideTarget: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Blinded",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        name: "Holy Aura: Blinded",
        activityMatch: "Save vs Blinded",
        ...(this.is2014 ? {} : { daeSpecialDurations: ["turnEnd" as const] }),
      },
      {
        name: "Holy Aura (Aura)",
        options: {
          durationSeconds: 60,
        },
        activityMatch: "Cast",
        // other creatures have disadvantage on attack rolls against a warded creature
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.grants.attack.disadvantage"),
        ],
        changes: ["str", "dex", "con", "int", "wis", "cha"].map((ability) =>
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, `system.abilities.${ability}.save.roll.mode`),
        ),
        data: {
          flags: {
            dae: {
              stackable: "noneNameOnly",
              selfTarget: true,
              selfTargetAlways: true,
            },
            ActiveAuras: {
              aura: "Allies",
              radius: "30",
              isAura: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
              ignoreSelf: false,
            },
          },
        },
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `30`,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
      // after the aura: dnd5e 5.x's chat tray matches an applied effect by its (shared concentration)
      // origin, so only the first effect applied to the caster by hand lands; the aura must be that one
      ...(this.is2014 ? [this.lightEffect] : []),
    ];
  }

  /** The 2014 aura's dim light, on the caster only: the ally aura effect must not carry it. */
  get lightEffect(): IDDBEffectHint {
    const lightAnimation = "{\"type\": \"sunburst\", \"speed\": 2,\"intensity\": 4}";
    return {
      name: "Holy Aura: Light",
      activityMatch: "Cast",
      atlOnly: true,
      options: {
        durationSeconds: 60,
      },
      // DAE applies it to the caster on use, as it does the aura effect
      data: {
        flags: {
          dae: {
            selfTarget: true,
            selfTargetAlways: true,
          },
        },
      },
      atlChanges: [
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "5"),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "#ffffff"),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "0.25"),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, lightAnimation),
      ],
    };
  }

}
