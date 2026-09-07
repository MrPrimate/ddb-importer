import DDBEnricherData from "../../data/DDBEnricherData";

export default class PartiallyAmphibious extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      addItemConsume: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        data: {
          duration: {
            seconds: 3600,
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [
          {
            period: "lr",
            type: "recoverAll",
          },
        ],
      },
      data: {
        "flags.midiProperties.toggleEffect": true,
      },
    };
  }

}
