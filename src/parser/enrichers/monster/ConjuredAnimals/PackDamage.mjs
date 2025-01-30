/* eslint-disable class-methods-use-this */
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

  get effects() {
    // TODO: this should be attacjed to a template/aura action
    return [
      {
        activeAurasOnly: true,
        options: {
          transfer: true,
        },
        macroChanges: [
          {
            macroValues: "@spellLevel",
            functionCall: "DDBImporter.effects.AuraAutomations.ActorDamageOnEntry",
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
    return {
      data: {
        flags: {
          ddbimporter: {
            effect: {
              saveOnEntry: true,
              // sequencerFile: "jb2a.fumes.fire.orange",
              activityIds: ["ddbPackDamageSav"],
            },
          },
        },
      },
    };
  }


}
