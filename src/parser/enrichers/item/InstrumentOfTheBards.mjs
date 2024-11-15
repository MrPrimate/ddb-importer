/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class InstrumentOfTheBards extends DDBEnricherData {


  get activity() {
    return {
      noConsumeTargets: true,
    };
  }

  // get override() {
  //   return {
  //     data: {
  //       "flags.magicitems": {
  //         charges: "1",
  //         chargeType: "c2",
  //         recharge: "1",
  //         rechargeType: "t1",
  //       },
  //     },
  //   };
  // }

}
