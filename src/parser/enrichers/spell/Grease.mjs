/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Grease extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        name: "Greasy",
        options: {
          durationSeconds: 60,
        },
        macroChanges: [
          { macroValues: "@item.level @attributes.spelldc", macroType: "generic", macroName: "activeAuraConditionOnEntry.js".file },
        ],
        data: {
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
              // hostile: true,
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
      type: "generic",
      name: "activeAuraConditionOnEntry.js",
      triggerPoints: ["preActiveEffects"],
    };
  }

  get itemMacro() {
    return {
      type: "generic",
      name: "activeAuraConditionOnEntry.js",
    };
  }

}
