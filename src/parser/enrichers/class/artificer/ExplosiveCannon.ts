import Generic from "../Generic";

export default class ExplosiveCannon extends Generic {

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      data: {
        range: {
          value: 60,
        },
        target: {
          template: {
            size: "20",
          },
        },
      },
    };
  }

}
