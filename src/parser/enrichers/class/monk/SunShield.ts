import DDBEnricherData from "../../data/DDBEnricherData";

export default class SunShield extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      name: "Toggle Light/Aura",
    };
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
    return [{
      name: `Sun Shield Aura`,
      activityMatch: "Toggle Light/Aura",
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "token.light.bright"),
        DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "token.light.dim"),
        DDBEnricherData.ChangeHelper.overrideChange("#ffffff", 20, "token.light.color"),
        DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
      ],
    }];

  }


}
