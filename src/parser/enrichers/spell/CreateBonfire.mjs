/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class CreateBonfire extends DDBEnricherData {
  get activity() {
    return {
      id: "ddbBonfirSpellSa",
      noeffect: this.useMidiAutomations,
    };
  }

  get clearAutoEffects() {
    return this.useMidiAutomations;
  }

  get effects() {
    return [
      {
        name: "Standing in a Bonfire",
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
            `turn=end,label=${this.data.name} (End of Turn),damageRoll=(@cantripDice)d8,damageType=fire,saveRemove=false,saveDC=@attributes.spell.dc,saveAbility=dex,saveDamage=nodamage,killAnim=true`,
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
              radius: null,
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
              isCantrip: true,
              saveOnEntry: true,
              sequencerFile: "jb2a.flames.01.orange",
              activityIds: ["ddbBonfirSpellSa"],
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
