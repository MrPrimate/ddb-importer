import DDBEnricherData from "../data/DDBEnricherData";

export default class Darkvision extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    const value = this.is2014 ? 60 : 150;
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange(`${value}`, 20, "system.attributes.senses.ranges.darkvision"),
        ],
      },
    ];
  }

}
