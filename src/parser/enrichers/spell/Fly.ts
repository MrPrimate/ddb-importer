import DDBEnricherData from "../data/DDBEnricherData";

export default class Fly extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

}
