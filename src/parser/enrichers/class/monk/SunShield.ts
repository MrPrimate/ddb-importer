import DDBEnricherData from "../../data/DDBEnricherData";

export default class SunShield extends DDBEnricherData {

  get type() {
    return DDBEnricherData.AutoEffects.effectModules().atlInstalled
      ? DDBEnricherData.ACTIVITY_TYPES.UTILITY
      : DDBEnricherData.ACTIVITY_TYPES.DDBMACRO;
  }

  get activity(): IDDBActivityData {
    if (DDBEnricherData.AutoEffects.effectModules().atlInstalled) {
      return {
        noTemplate: true,
        name: "Toggle Light/Aura",
      };
    } else {
      return {
        type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
        noTemplate: true,
        name: "Toggle Light/Aura",
        data: {
          macro: {
            name: "Toggle Light/Aura",
            function: "ddb.generic.light",
            visible: false,
            parameters: `{"targetsSelf":true,"targetsToken":true,"lightConfig":{"dim":60,"bright":30},"flag":"light"}`,
          },
        },
      };
    }
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Reaction Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
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


  get effects(): IDDBEffectHint[] {
    if (!DDBEnricherData.AutoEffects.effectModules().atlInstalled) return [{
      name: `Sun Shield Aura`,
      activityMatch: "Toggle Light/Aura",
    }];
    return [{
      name: `Sun Shield Aura`,
      activityMatch: "Toggle Light/Aura",
      atlChanges: [
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", "override", "30"),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", "override", "60"),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", "override", "#ffffff"),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", "override", "0.25"),
      ],
    }];

  }


}
