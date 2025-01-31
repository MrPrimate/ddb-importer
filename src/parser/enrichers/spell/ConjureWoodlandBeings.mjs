/* eslint-disable class-methods-use-this */
import { utils } from "../../../lib/_module.mjs";
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ConjureWoodlandBeings extends DDBEnricherData {

  get type() {
    return this.is2014 ? null : "utility";
  }

  get activity() {
    if (this.is2014) return null;
    return {
      name: "Cast",
      targetType: "self",
      overrideTemplate: this.useMidiAutomations,
      noTemplate: this.useMidiAutomations,
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

  get additionalActivities() {
    if (this.is2014) return null;
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
          noeffect: true,
          activationOverride: {
            type: "special",
            condition: "Enters or ends turn in emanation (1/turn only)",
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          rangeOverride: {
            value: "10",
            units: "ft",
          },
        },
        overrides: {
          id: "ddbConjWoodBeSav",
          targetType: "creature",
          overrideTemplate: true,
          noTemplate: true,
          data: {
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
      },
    ];
  }

  get effects() {
    if (this.is2014) return null;
    const flagName = `${utils.idString(this.data.name)}Called`;
    const overtimeOptions = [
      `label=${this.data.name} (End of Turn)`,
      `turn=end`,
      "damageRoll=(@spellLevel + 1)d8",
      "damageType=force",
      "saveRemove=false",
      "saveDC=@attributes.spelldc",
      "saveAbility=wis",
      "saveDamage=halfdamage",
      "killAnim=true",
      `applyCondition=!flags.ddbihelpers.${flagName}`,
      "macroToCall=function",
    ];
    return [
      {
        activityMatch: "Cast",
        activeAurasOnly: true,
        macroChanges: [
          {
            macroValues: "@spellLevel",
            functionCall: "DDBImporter.effects.AuraAutomations.ActorDamageOnEntry",
          },
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange(
            overtimeOptions.join(","),
            20,
            "flags.midi-qol.OverTime",
          ),
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
              radius: 10,
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

  get override() {
    if (this.is2014) return null;
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
        flags: {
          ddbimporter: {
            effect: {
              saveOnEntry: true,
              sequencerFile: "jb2a.swirling_feathers.outburst.01.textured.2",
              activityIds: ["ddbConjWoodBeSav"],
            },
          },
        },
      },
    };
  }
}
