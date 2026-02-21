import DDBEnricherData from "../data/DDBEnricherData";

export default class BelashyrrasBeholderCrown extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange(120, 10, "system.attributes.senses.darkvision"),
        ],
      },
    ];
  }

}
