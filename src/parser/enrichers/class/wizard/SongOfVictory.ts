import DDBEnricherData from "../../data/DDBEnricherData";

export default class SongOfVictory extends DDBEnricherData {

  override get type() {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.NONE : null;
  }

  override get addAutoAdditionalActivities() {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return this.is2014
      ? [
        {
          name: "Song of Victory",
          options: {
            durationSeconds: 60,
          },
          changes: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("max(@abilities.int.mod,1)", 20, "system.bonuses.mwak.damage"),
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
      ]
      : [];
  }

}
