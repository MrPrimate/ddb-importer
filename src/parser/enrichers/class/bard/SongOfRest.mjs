/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SongOfRest extends DDBEnricherData {
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
