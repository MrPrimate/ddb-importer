/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AuraOfLife extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("necrotic", 20, "system.traits.dr.value"),
        ],
      },
      {
        noCreate: true,
        daeOnly: true,
        activeAuraOnly: true,
        macroChanges: [
          { macroValues: "@token", macroType: "spell", macroName: "auraOfLife.js" },
        ],
        data: {
          flags: {
            dae: {
              macroRepeat: "startEveryTurn",
              selfTarget: true,
              selfTargetAlways: true,
            },
            ActiveAuras: {
              isAura: true,
              aura: "Allies",
              radius: 30,
              alignment: "",
              type: "",
              ignoreSelf: false,
              height: false,
              hidden: false,
              onlyOnce: false,
              save: false,
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
      type: "spell",
      name: "auraOfLife.js",
    };
  }

}
