/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class CanaithMandolin extends DDBEnricherMixin {

  get override() {
    return {
      data: {
        "flags.magicitems": {
          charges: "1",
          chargeType: "c2",
          recharge: "1",
          rechargeType: "t1",
        },
      },
    };
  }

}
