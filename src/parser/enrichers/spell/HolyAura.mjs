/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class HolyAura extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast",
      targetType: "self",
      // rangeSelf: true,
      // noTemplate: true,
      // overrideRange: true,
      // overrideTarget: true,
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save vs Blinded",
          type: "save",
        },
        build: {
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

  get effects() {
    const lightAnimation = '{"type": "sunburst", "speed": 2,"intensity": 4}';
    return [
      {
        noCreate: true,
        name: "Holy Aura: Blinded",
        activityMatch: "Save vs Blinded",
        daeSpecialDurations: ["turnEnd"],
      },
      {
        name: "Holy Aura (Aura)",
        options: {
          durationSeconds: 60,
        },
        activityMatch: "Cast",
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(
            "1",
            20,
            "flags.midi-qol.advantage.ability.save.all",
          ),
          DDBEnricherData.ChangeHelper.unsignedAddChange(
            "1",
            20,
            "flags.midi-qol.advantage.ability.attack.all",
          ),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '5'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, lightAnimation),
        ],
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
      },
    ];
  }

}
