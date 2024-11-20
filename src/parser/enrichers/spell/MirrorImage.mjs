/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class MirrorImage extends DDBEnricherData {

  get effects() {
    return [
      {
        tokenMagicChanges: [
          DDBEnricherData.ChangeHelper.tokenMagicFXChange("images"),
        ],
      },
    ];
  }

}
