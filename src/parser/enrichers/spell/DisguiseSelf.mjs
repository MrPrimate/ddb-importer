/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class DisguiseSelf extends DDBEnricherData {

  get effects() {
    return [
      {
        statuses: "Disguised",
      },
    ];
  }

}
