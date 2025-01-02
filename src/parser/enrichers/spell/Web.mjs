/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Web extends DDBEnricherData {

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
              // sequencerFile: "jb2a.web.02",
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
            macroValues: "@item.level @attributes.spelldc",
            macroType: "generic",
            macroName: "activeAuraConditionOnEntry.js",
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

  get itemMacro() {
    return {
      name: "activeAuraConditionOnEntry.js",
      type: "generic",
    };
  }

}
