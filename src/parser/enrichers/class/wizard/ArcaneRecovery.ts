import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneRecovery extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
      name: "Recover Spell Slots",
      // listed on the Short Rest chat card, as the slots are chosen when the rest ends
      activationType: "shortRest",
      data: {
        macro: {
          name: "Arcane Recovery",
          function: "ddb.feat.arcaneRecovery",
          visible: false,
          parameters: "",
        },
      },
    };
  }

}
