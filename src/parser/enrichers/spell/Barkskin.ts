import DDBEnricherData from "../data/DDBEnricherData";

export default class Barkskin extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) {
      return [
        {
          changes: [
            DDBEnricherData.ChangeHelper.upgradeChange("16", 100, "system.attributes.ac.min"),
          ],
        },
      ];
    } else {
      return [
        {
          changes: [
            DDBEnricherData.ChangeHelper.upgradeChange("17", 100, "system.attributes.ac.min"),
          ],
        },
      ];
    }
  }

}
