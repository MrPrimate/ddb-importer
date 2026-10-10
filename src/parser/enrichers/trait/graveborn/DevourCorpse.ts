import DDBEnricherData from "../../data/DDBEnricherData";

/** Graveborn: a minute eating a corpse rolls a Hit Point Die without spending it and heals the roll plus your Constitution modifier (minimum 1). */
export default class DevourCorpse extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "minute",
      activationCondition: "Eat flesh from the corpse of a Small or larger creature that isn't a Construct",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "max(1, @attributes.hd.largest + @abilities.con.mod)",
          types: ["healing"],
        }),
      },
    };
  }

}
