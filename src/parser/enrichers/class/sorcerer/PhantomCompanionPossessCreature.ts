import DDBEnricherData from "../../data/DDBEnricherData";

export default class PhantomCompanionPossessCreature extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      addItemConsume: true,
      itemConsumeTargetName: "Phantom Possession",
      data: {
        range: {
          units: "ft",
          value: "5",
        },
      },
    };
  }

}
