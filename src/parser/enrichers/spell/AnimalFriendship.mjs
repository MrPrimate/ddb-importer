/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AnimalFriendship extends DDBEnricherData {

  get effects() {
    return [
      {
        statuses: "Charmed",
      },
    ];
  }

}