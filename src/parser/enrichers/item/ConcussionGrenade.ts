import DDBEnricherData from "../data/DDBEnricherData";

export default class ConcussionGrenade extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        range: {
          value: "60",
          units: "ft",
        },
      },
    };
  }

}
