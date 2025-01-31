/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SpiritGuardians extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast",
      data: {
        midiProperties: {
          autoTargetAction: "none",
          triggeredActivityId: "none",
          triggeredActivityTargets: "targets",
          triggeredActivityRollAs: "self",
          forceDialog: false,
          confirmTargets: "never",
        },
      },
    };
  }

  get override() {
    return {
      data: {
        system: {
          target: {
            template: {
              type: "radius",
            },
          },
        },
        "midi-qol": {
          autoTarget: "none",
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save vs Damage",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateSave: true,
          generateDuration: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          noSpellslot: true,
          onSave: "half",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 3,
              denomination: 8,
              types: ["necrotic", "radiant"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
          noeffect: true,
          activationOverride: {
            type: "",
            condition: "Enters or ends turn in emanation (1/turn only)",
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          rangeOverride: {
            value: "15",
            units: "ft",
          },
          targetOverride: {
            template: {},
            affects: {
              count: "1",
              type: "creature",
            },
          },
          saveOverride: {
            ability: ["wis"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
        },
        overrides: {
          flags: {
            midiProperties: {
              autoTargetAction: "none",
              triggeredActivityId: "none",
              triggeredActivityTargets: "targets",
              forceDialog: false,
              confirmTargets: "never",
            },
          },
        },
      },
    ];
  }

  get effects() {
    // const overtimeOptions = [
    //   `label=Spirit Guardians (${this.is2014 ? 'Start' : 'End'} of Turn)`,
    //   `turn=${this.is2014 ? 'start' : 'end'}`,
    //   "damageRoll=(@spellLevel)d8",
    //   "damageType=radiant",
    //   "saveRemove=false",
    //   "saveDC=@attributes.spelldc",
    //   "saveAbility=wis",
    //   "saveDamage=halfdamage",
    //   "killAnim=true",
    // ];
    // if (this.is2024) {
    //   overtimeOptions.push(
    //     "applyCondition=!flags.ddbihelpers.SpiritGuardiansCalled",
    //     "macroToCall=function",
    //   );
    // }
    return [
      {
        name: "Spirit Guardians",
      },
      {
        activityMatch: "Cast",
        noCreate: true,
        activeAurasOnly: true,
        changes: [
          DDBEnricherData.ChangeHelper.customChange("/2", 20, "system.attributes.movement.all"),
        ],
        // midiChanges: [
        //   DDBEnricherData.ChangeHelper.overrideChange(
        //     overtimeOptions.join(","),
        //     20,
        //     "flags.midi-qol.OverTime",
        //   ),
        // ],
        macroChanges: [
          {
            // @token
            macroValues: "@spellLevel",
            macroType: "spell",
            macroName: this.is2014 ? "spiritGuardians2014.js" : "spiritGuardians2024.js",
          },
        ],
        data: {
          flags: {
            dae: {
              macroRepeat: "startEndEveryTurn",
              selfTarget: true,
              selfTargetAlways: true,
            },
            ActiveAuras: {
              isAura: true,
              aura: "Enemy",
              radius: 15,
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
      },
    ];
  }

  get itemMacro() {
    return {
      type: "spell",
      name: this.is2014 ? "spiritGuardians2014.js" : "spiritGuardians2024.js",
    };
  }
}
