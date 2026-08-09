import DDBEnricherData from "../data/DDBEnricherData";

export default class BelashyrrasBeholderCrown extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange(120, 10, "system.attributes.senses.ranges.darkvision"),
        ],
      },
    ];
  }

}
