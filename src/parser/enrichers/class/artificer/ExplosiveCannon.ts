import Generic from "../Generic";

export default class ExplosiveCannon extends Generic {

  get activity(): IDDBActivityData {
    if (!this.isAction) return null;
    return {
      data: {
        range: {
          value: 60,
        },
        target: {
          template: {
            size: 20,
          },
        },
      },
    };
  }

}
