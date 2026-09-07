import DDBEnricherData from "../../data/DDBEnricherData";

export default class SunShield extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      name: "Toggle Light/Aura",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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


  override get effects(): IDDBEffectHint[] {
    return [{
      name: `Sun Shield Aura`,
      activityMatch: "Toggle Light/Aura",
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "ATL.light.bright"),
        DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "ATL.light.dim"),
        DDBEnricherData.ChangeHelper.overrideChange("#ffffff", 20, "ATL.light.color"),
        DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "ATL.light.alpha"),
      ],
    }];

  }


}
