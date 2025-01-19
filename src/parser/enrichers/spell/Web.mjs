/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Web extends DDBEnricherData {

  get activity() {
    return {
      id: "ddbWebSpellSave1",
      noeffect: this.useMidiAutomations,
    };
  }


  get override() {
    return {
      data: {
        flags: {
          ddbimporter: {
            effect: {
              applyStart: true,
              applyEntry: true,
              applyImmediate: false,
              everyEntry: false,
              allowVsRemoveCondition: true,
              removalCheck: "str", // in 2024 this can be athletcis
              removalSave: null,
              saveRemoves: false,
              condition: "Restrained",
              save: "dex",
              sequencerFile: "jb2a.web.02",
              activityIds: ["ddbWebSpellSave1"],
            },
          },
        },
      },
    };
  }

  get clearAutoEffects() {
    return true;
  }

  get effects() {
    return [
      {
        name: "Restrained",
        activeAurasNever: true,
        midiNever: true,
        statuses: ["Restrained"],
      },
      {
        name: "Web",
        activeAurasOnly: true,
        options: {
          durationSeconds: 3600,
        },
        midiOnly: true,
        macroChanges: [
          {
            functionCall: "DDBImporter.effects.AuraAutomations.ConditionOnEntry",
          },
        ],
        data: {
          flags: {
            dae: {
              macroRepeat: "startEveryTurn",
            },
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
              save: "dex",
              savedc: null,
              displayTemp: true,
            },
          },
        },
      },
    ];
  }


  get setMidiOnUseMacroFlag() {
    return {
      functionCall: "DDBImporter.effects.AuraAutomations.ConditionOnEntry",
      triggerPoints: ["preActiveEffects"],
    };
  }

}
