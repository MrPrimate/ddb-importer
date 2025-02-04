/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class UnseenServant extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "UnseenServantSRD" },
      ],
      summons: {
      },
    };
  }

}
