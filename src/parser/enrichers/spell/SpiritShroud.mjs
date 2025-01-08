/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SpiritShroud extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast",
      overrideTarget: true,
      targetType: "self",
    };
  }

  get additionalActivities() {
    return [{
      constructor: {
        name: "Damage",
        type: "damage",
      },
      build: {
        generateDamage: true,
        generateConsumption: false,
        noSpellslot: true,
        generateAttack: false,
        onsave: false,
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["radiant", "necrotic", "cold"], scalingMode: "half", scalingNumber: "1" }),
        ],
        noeffect: true,
      },
      overrides: {
        noTemplate: true,
      },
    }];
  }

  get effects() {
    return [
      {
        name: "Surrounded by a Spirit Shroud",
        activeAurasNever: true,
        midiNever: true,
      },
      {
        name: "Slowed by Spirit Shroud",
        midiNever: true,
        activeAurasNever: true,
        changes: [
          DDBEnricherData.ChangeHelper.customChange(
            "-10",
            20,
            "system.attributes.movement.all",
          ),
        ],
      },
      {
        name: "Spirit Shroud",
        activityMatch: "Cast",
        activeAurasOnly: true,
        changes: [
          DDBEnricherData.ChangeHelper.customChange(
            "-10",
            20,
            "system.attributes.movement.all",
          ),
        ],
        data: {
          flags: {
            dae: {
              specialDuration: [],
              selfTargetAlways: true,
              selfTarget: true,
            },
            ActiveAuras: {
              isAura: true,
              aura: "Enemy",
              radius: 10,
              alignment: "",
              type: "",
              ignoreSelf: true,
              height: false,
              hidden: false,
              hostile: false,
              onlyOnce: false,
              displayTemp: true,
            },
          },
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

  get setMidiOnUseMacroFlag() {
    return {
      type: "spell",
      name: "spiritShroud.js",
      triggerPoints: ["preActiveEffects"],
    };
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "spiritShroud.js",
    };
  }

}
