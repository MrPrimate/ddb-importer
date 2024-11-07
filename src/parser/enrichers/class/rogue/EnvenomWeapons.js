/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class EnvenomWeapons extends DDBEnricherMixin {

  get type() {
    return "none";
  }


  get additionalActivities() {
    return [
      { action: { name: "Sneak Attack: Poison (Envenom)", type: "class" } },
    ];
  }

}