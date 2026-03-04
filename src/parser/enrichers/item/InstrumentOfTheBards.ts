import DDBEnricherData from "../data/DDBEnricherData";

export default class InstrumentOfTheBards extends DDBEnricherData {


  get activity() {
    return {
      noConsumeTargets: true,
    };
  }

  // get override(): IDDBOverrideData {
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
