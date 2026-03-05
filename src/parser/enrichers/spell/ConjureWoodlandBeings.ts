import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class ConjureWoodlandBeings extends DDBEnricherData {

  get type() {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return null;
    return [
      {
        init: {
          name: "Save vs Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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

  get effects() : IDDBEffectHint[] {
    if (this.is2014) return null;
    const flagName = `${utils.idString(this.data.name)}Called`;
    const overtimeOptions = [
      `label=${this.data.name} (End of Turn)`,
      `turn=end`,
      "damageRoll=(@spellLevel + 1)d8",
      "damageType=force",
      "saveRemove=false",
      "saveDC=@attributes.spell.dc",
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
              radius: "10",
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

  get override(): IDDBOverrideData {
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
