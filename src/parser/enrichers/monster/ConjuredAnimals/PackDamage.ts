import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The importer-built 2024 Conjure Animals pack.
 * Using Pack Damage from the pack token places a 10-foot emanation attached to it;
 * the region fires the savevwhen a creature enters or ends its turn inside (once per turn).
 * The pack moving within 10 feet of a creature is mover-inverted and stays manual. The
 * "(Aura Automation)" activity below is the Aura Effects + midi arm of the same
 * automation, so the region arm only emits without Aura Effects.
 */
export default class PackDamage extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      id: "ddbPackDamageSav",
      targetType: "creature",
      activationType: "special",
      activationCondition:
        "Moves within 10 feet of a creature you can see and whenever a creature you can see enters a space within 10 feet of the pack or ends its turn there",
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            excludeSelf: true,
            auraeffectsNever: true,
          }),
        ],
        save: {
          ability: ["dex"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.useMidiAutomations) return [];
    return [
      {
        init: {
          name: "Pack Damage (Aura Automation)",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
        },
        overrides: {
          activationType: "none",
          data: {
            range: {
              value: 10,
              units: "ft",
            },
            midiProperties: {
              automationOnly: true,
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const flagName = `${utils.idString(this.data.name)}Called`;
    const overtimeOptions = [
      `label=${this.data.name} (End of Turn)`,
      `turn=end`,
      "damageRoll=(@flags.dnd5e.summon.level)d10",
      "damageType=slashing",
      "saveRemove=false",
      "saveDC=@attributes.spell.dc",
      "saveAbility=dex",
      "saveDamage=halfdamage",
      "killAnim=true",
      `applyCondition=!flags.ddbihelpers.${flagName}`,
      "macroToCall=function",
    ];
    return [
      {
        activityMatch: "Pack Damage (Aura Automation)",
        auraeffectsOnly: true,
        options: {
          transfer: true,
        },
        macroChanges: [
          {
            macroValues: "@flags.dnd5e.summon.level",
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
          },
        },
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `10`,
          disposition: -1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          ddbimporter: {
            effect: {
              sequencerFile: "jb2a.swirling_feathers.outburst.01.textured.2",
              activityIds: ["ddbPackDamageSav"],
            },
          },
        },
      },
    };
  }


}
