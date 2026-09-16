import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Circle of the Hive. The invigorated creature regains hit points equal to the druid level; the
 * free reaction movement is left to the activity description.
 */
export default class Honeydrenaline extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Honeydrenaline: Invigorate",
      useActivitySnippet: true,
      activationType: "bonus",
      addItemConsume: true,
      data: {
        range: { value: "30", units: "ft", special: "" },
        target: {
          affects: { count: "1", type: "willing", choice: false, special: "" },
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.druid.levels",
          types: ["healing"],
        }),
      },
    };
  }

}
