/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PackDamage extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    return {
      id: "ddbPackDamageSav",
      targetType: "creature",
      activationType: "special",
      activationCondition:
        "Moves within 10 feet of a creature you can see and whenever a creature you can see enters a space within 10 feet of the pack or ends its turn there",
      data: {
        range: {
          units: "ft",
          value: "10",
        },
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

  get additionalActivities() {
    if (!this.useMidiAutomations) return [];
    return [
      {
        constructor: {
          name: "Pack Damage (Aura Automation)",
          type: "utility",
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

  get effects() {
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
        aurasOnly: true,
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

  get override() {
    return {
      data: {
        flags: {
          ddbimporter: {
            effect: {
              saveOnEntry: true,
              sequencerFile: "jb2a.swirling_feathers.outburst.01.textured.2",
              activityIds: ["ddbPackDamageSav"],
            },
          },
        },
      },
    };
  }


}
