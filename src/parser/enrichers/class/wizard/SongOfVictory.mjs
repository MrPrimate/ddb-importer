/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SongOfVictory extends DDBEnricherData {

  get type() {
    return this.is2024 ? "none" : null;
  }

  get addAutoAdditionalActivities() {
    return true;
  }

  get activity() {
    return {
      targetType: "self",
    };
  }

  get effects() {
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
