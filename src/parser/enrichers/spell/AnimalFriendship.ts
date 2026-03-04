import DDBEnricherData from "../data/DDBEnricherData";

export default class AnimalFriendship extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        statuses: ["Charmed"],
      },
    ];
  }

}
