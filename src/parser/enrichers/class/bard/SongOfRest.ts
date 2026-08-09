import DDBEnricherData from "../../data/DDBEnricherData";

export default class SongOfRest extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        duration: {
          value: "1",
          units: "hour",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.bard.song-of-rest",
          types: ["healing"],
        }),
      },
    };
  }
}
