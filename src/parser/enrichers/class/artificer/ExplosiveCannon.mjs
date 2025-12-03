import Generic from "../Generic.mjs";

export default class ExplosiveCannon extends Generic {

  get activity() {
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
