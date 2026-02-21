import DDBEnricherData from "../data/DDBEnricherData";

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
