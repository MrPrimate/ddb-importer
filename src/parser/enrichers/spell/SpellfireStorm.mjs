/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SpellfireStorm extends DDBEnricherData {

  get activity() {
    return {
      name: "Cast",
    };
  }

  get additionalActivities() {
    return [
      {
        duplicate: true,
        id: "ddbSpellStormSa1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            range: {
              override: true,
              units: "spec",
            },
            target: {
              override: true,
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Within Spellfire Storm",
        activeAurasOnly: true,
        midiOnly: true,
        options: {
          durationSeconds: 60,
          durationRounds: 10,
        },
        macroChanges: [
          {
            functionCall: "DDBImporter.effects.AuraAutomations.DamageOnEntry",
          },
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `label=${this.data.name} Turn End,turn=end, saveAbility=con, saveDC=@attributes.spell.dc, saveDamage=halfdamage, rollType=save, saveMagic=true, damageBeforeSave=false, damageRoll=(@item.level)d10, damageType=radiant, killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
        data: {
          duration: {
            seconds: 60,
            rounds: 10,
          },
          flags: {
            ActiveAuras: {
              isAura: true,
              aura: "All",
              radius: 20,
              alignment: "",
              type: "",
              ignoreSelf: false,
              height: false,
              hidden: false,
              onlyOnce: false,
              displayTemp: true,
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        flags: {
          ddbimporter: {
            effect: {
              saveOnEntry: true,
              sequencerFile: "jb2a.fumes.fire.orange",
              activityIds: ["ddbSpellStormSa1"],
            },
          },
        },
      },
    };
  }

  get setMidiOnUseMacroFlag() {
    return {
      functionCall: "DDBImporter.effects.AuraAutomations.DamageOnEntry",
      triggerPoints: ["preActiveEffects"],
    };
  }

}
