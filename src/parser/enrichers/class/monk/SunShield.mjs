/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SunShield extends DDBEnricherData {

  get type() {
    return DDBEnricherData.AutoEffects.effectModules().atlInstalled
      ? "utility"
      : "ddbmacro";
  }

  get activity() {
    if (DDBEnricherData.AutoEffects.effectModules().atlInstalled) {
      return {
        noTemplate: true,
        name: "Toggle Light/Aura",
      };
    } else {
      return {
        type: "ddbmacro",
        noTemplate: true,
        name: "Toggle Light/Aura",
        data: {
          macro: {
            name: "Toggle Light/Aura",
            function: "ddb.generic.light",
            visible: false,
            parameters: '{"targetsSelf":true,"targetsToken":true,"lightConfig":{"dim":60,"bright":30},"flag":"light"}',
          },
        },
      };
    }
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Reaction Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateTarget: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "5 + @abilities.wis.mod",
              types: ["radiant"],
            }),
          ],
        },
        overrides: {
          noTemplate: true,
          activationType: "reaction",
        },
      },
    ];
  }


  get effects() {
    if (!DDBEnricherData.AutoEffects.effectModules().atlInstalled) return [{
      name: `Sun Shield Aura`,
      activityMatch: "Toggle Light/Aura",
    }];
    return [{
      name: `Sun Shield Aura`,
      activityMatch: "Toggle Light/Aura",
      data: {
        "flags.ddbimporter.activityMatch": "Toggle Light/Aura",
      },
      atlChanges: [
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '30'),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '60'),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'),
      ],
    }];

  }


}
