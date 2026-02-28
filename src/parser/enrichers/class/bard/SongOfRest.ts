import DDBEnricherData from "../../data/DDBEnricherData";

export default class SongOfRest extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
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
