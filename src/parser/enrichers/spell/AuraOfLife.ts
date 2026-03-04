import DDBEnricherData from "../data/DDBEnricherData";

export default class AuraOfLife extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic"),
        ],
      },
      {
        noCreate: true,
        daeOnly: true,
        activeAuraOnly: true,
        auraeffectsOnly: true,
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
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `30`,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
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
