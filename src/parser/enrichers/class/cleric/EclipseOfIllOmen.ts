import DDBEnricherData from "../../data/DDBEnricherData";

export default class EclipseOfIllOmen extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      data: {
        target: {
          template: {
            type: "radius",
            size: "60",
            units: "ft",
            count: "",
            contiguous: false,
            width: "",
            height: "",
          },
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Eclipse of Ill Omen",
        options: {
          durationSeconds: 60,
          description: "Reddish dim light in a 60-ft radius; creatures of your choice in the area make saving throws with disadvantage. Concentration, up to 1 minute.",
        },
      },
      {
        name: "Cursed by Ill Omen",
        options: {
          durationSeconds: 60,
          description: "Speed halved and can't regain hit points until the eclipse ends.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.multiplyChange("0.5", 50, "system.attributes.movement.walk"),
        ],
      },
    ];
  }

}
