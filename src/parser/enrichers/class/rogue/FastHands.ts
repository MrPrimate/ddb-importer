import DDBEnricherData from "../../data/DDBEnricherData";

export default class FastHands extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {

    return [
      { action: { name: "Fast Hands: Sleight of Hand", type: "class", rename: ["Sleight of Hand"] } },
      { action: { name: "Fast Hands: Utilize", type: "class", rename: ["Utilize"] } },
      { action: { name: "Fast Hands: Use Magic Item", type: "class", rename: ["Use Magic Item"] } },
    ];
  }

}
