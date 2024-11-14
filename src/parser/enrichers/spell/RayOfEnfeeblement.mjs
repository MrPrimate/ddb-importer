/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class RayOfEnfeeblement extends DDBEnricherMixin {

  get type() {
    return "attack";
  }

  get effects() {
    return [
      {
        name: "Enfeebled",
        options: {
          description: this.ddbParser?.ddbDefinition?.description ?? "",
        },
      },
    ];
  }

}
