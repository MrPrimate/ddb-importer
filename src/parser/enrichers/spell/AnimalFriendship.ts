import DDBEnricherData from "../data/DDBEnricherData";

export default class AnimalFriendship extends DDBEnricherData {

  get effects() {
    return [
      {
        statuses: ["Charmed"],
      },
    ];
  }

}
