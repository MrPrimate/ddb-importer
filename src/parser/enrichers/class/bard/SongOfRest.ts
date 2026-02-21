import DDBEnricherData from "../../data/DDBEnricherData";

export default class SongOfRest extends DDBEnricherData {

  get type() {
    return "heal";
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
