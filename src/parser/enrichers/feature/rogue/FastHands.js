/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class FastHands extends DDBEnricherMixin {

  get type() {
    return "none";
  }

  get additionalActivities() {

    return [
      { action: { name: "Fast Hands: Sleight of Hand", type: "class", rename: ["Sleight of Hand"] } },
      { action: { name: "Fast Hands: Utilize", type: "class", rename: ["Utilize"] } },
      { action: { name: "Fast Hands: Use Magic Item", type: "class", rename: ["Use Magic Item"] } },
    ];
  }

}
