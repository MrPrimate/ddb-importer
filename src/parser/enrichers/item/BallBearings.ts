import DDBEnricherData from "../data/DDBEnricherData";

export default class BallBearings extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spill Ball Bearings",
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "square",
            size: "10",
            units: "ft",
          },
        },
        range: {
          override: true,
          value: "10",
          units: "ft",
        },
        save: {
          ability: ["dex"],
          dc: {
            calculation: "",
            formula: "10",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter"],
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        statuses: ["Prone"],
      },
    ];
  }

}
