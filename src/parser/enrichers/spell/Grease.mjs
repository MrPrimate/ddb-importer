/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Grease extends DDBEnricherData {

  get activity() {
    return {
      id: "ddbGreaseSpellSa",
      noeffect: this.useMidiAutomations,
    };
  }

  get clearAutoEffects() {
    return this.useMidiAutomations;
  }

  get effects() {
    return [
      {
        name: "Grease",
        activeAurasOnly: true,
        midiOnly: true,
        options: {
          durationSeconds: 60,
        },
        macroChanges: [
          { macroValues: "@item.level @attributes.spelldc", functionCall: "DDBImporter.effects.AuraAutomations.ConditionOnEntry" },
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `applyCondition=!statuses.has('prone'),turn=end,label=${this.data.name},saveRemove=false,saveDC=@attributes.spelldc,saveAbility=dex,saveDamage=nodamage,killAnim=true,macro=function.DDBImporter.effects.AuraAutomations.ConditionOnEntry`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
        data: {
          duration: {
            seconds: 60,
          },
          flags: {
            ActiveAuras: {
              isAura: true,
              aura: "All",
              radius: null,
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
              applyStart: true,
              applyEnd: true,
              applyEntry: true,
              applyImmediate: true,
              everyEntry: true,
              removeOnOff: false,
              allowVsRemoveCondition: false,
              removalCheck: null,
              removalSave: null,
              saveRemoves: false,
              condition: "Prone",
              sequencerFile: "jb2a.grease.dark_green.loop",
              activityIds: ["ddbGreaseSpellSa"],
            },
          },
        },
      },
    };
  }

  get setMidiOnUseMacroFlag() {
    return {
      functionCall: "DDBImporter.effects.AuraAutomations.ConditionOnEntry",
      triggerPoints: ["preActiveEffects"],
    };
  }

}
