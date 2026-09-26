import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer } from "../../data/RegionBuilders";

const PACK_SAVE_ID = "ddbPackDamageSav";

/**
 * The importer-built 2024 Conjure Animals pack.
 * "Place Aura" puts a 10-foot emanation on the pack token and rolls nothing; the region fires
 * Pack Damage when a creature enters or ends its turn inside (once per turn), and when the pack
 * moves within 10 feet of one ("movementOrArea": the pack appearing is not it moving). The
 * "(Aura Automation)" activity below is the Aura Effects + midi arm of the same
 * automation, so the region arm remains unless both modules can automate it.
 */
export default class PackDamage extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      id: PACK_SAVE_ID,
      targetType: "creature",
      targetCount: "1",
      noTemplate: true,
      activationType: "special",
      activationCondition:
        "Moves within 10 feet of a creature you can see and whenever a creature you can see enters a space within 10 feet of the pack or ends its turn there",
      data: {
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
    const placer = regionPlacer("Place Aura", {
      template: { type: "radius", size: "10" },
      activationType: "special",
      activationCondition: "When the pack appears",
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnEnd"],
          enterOn: "movementOrArea",
          excludeSelf: true,
          auraeffectsNever: this.useMidiAutomations,
          activityId: PACK_SAVE_ID,
        }),
      ],
    });
    // one working path: the region, or the Aura Effects + midi arm in its place
    if (!this.useMidiAutomations || !DDBEnricherData.AutoEffects.effectModules().auraeffectsInstalled) return [placer];
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
        midiOnly: true,
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
          bestFormula: "@flags.dnd5e.summon.level",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `10`,
          disposition: -1,
          evaluatePreApply: true,
          overrideName: "Conjured Animals: Pack Damage",
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
              activityIds: [PACK_SAVE_ID],
            },
          },
        },
      },
    };
  }


}
