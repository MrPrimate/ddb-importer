/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Cloudkill extends DDBEnricherData {
  get activity() {
    return {
      id: "ddbCloKilSpellSa",
      noeffect: this.useMidiAutomations,
    };
  }


  get clearAutoEffects() {
    return this.useMidiAutomations;
  }

  get effects() {

    const killChange = this.is2014
      ? `label=${this.data.name} (Start of Turn),turn=start, saveAbility=con, killAnim=true, saveDC=@attributes.spell.dc, saveDamage=halfdamage, rollType=save, saveMagic=true, damageBeforeSave=false, damageRoll=(@item.level)d8, damageType=poison`
      : `label=${this.data.name} (End of Turn),turn=end, saveAbility=con, killAnim=true, saveDC=@attributes.spell.dc, saveDamage=halfdamage, rollType=save, saveMagic=true, damageBeforeSave=false, damageRoll=(@item.level)d8, damageType=poison`;
    return [
      {
        name: "Within Cloudkill Fog",
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
            killChange,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
        data: {
          duration: {
            seconds: 60,
            rounds: 100,
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
              sequencerFile: "jb2a.fog_cloud.2.green",
              activityIds: ["ddbCloKilSpellSa"],
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
