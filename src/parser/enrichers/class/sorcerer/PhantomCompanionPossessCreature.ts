import DDBEnricherData from "../../data/DDBEnricherData";

export default class PhantomCompanionPossessCreature extends DDBEnricherData {

  override get activity(): IDDBActivityData {
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
