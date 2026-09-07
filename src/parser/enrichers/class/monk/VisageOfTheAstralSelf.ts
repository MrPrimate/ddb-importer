import DDBEnricherData from "../../data/DDBEnricherData";

export default class VisageOfTheAstralSelf extends DDBEnricherData {

  override get addAutoAdditionalActivities(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      rangeSelf: true,
      data: {
        duration: {
          units: "minute",
          value: "10",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        atlChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("truesight", 20, "ATL.sight.visionMode"),
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "ATL.sight.range"),
        ],
        options: {
          durationSeconds: 360,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "system.attributes.senses.truesight"),
          DDBEnricherData.ChangeHelper.advantageSkillChange("itm"),
          DDBEnricherData.ChangeHelper.advantageSkillChange("ins"),
        ],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }

}
