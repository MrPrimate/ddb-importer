import DDBEnricherData from "../../data/DDBEnricherData";

export default class Inescapable extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      itemConsumeTargetName: "moxie",
      itemConsumeValue: 1,
    };
  }

}
