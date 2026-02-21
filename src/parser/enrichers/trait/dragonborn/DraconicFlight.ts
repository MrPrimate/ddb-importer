import DDBEnricherData from "../../data/DDBEnricherData";

export default class DraconicFlight extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Draconic Flight",
        options: {
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

}
