import DDBEnricherData from "../../data/DDBEnricherData";

export default class RelentlessAvenger extends DDBEnricherData {

  get activity() {
    return {
      name: "Reduce Speed",
      type: "utility",
      targetType: "creature",
    };
  }

  get effects() {
    return [{
      name: "Relentless Avenger: Speed Reduction",
      options: {
        durationSeconds: 6,
      },
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange("0", 90, "system.attributes.movement.walk"),
      ],
    }];
  }


}
