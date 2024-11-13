/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class Darkness extends DDBEnricherMixin {

  get type() {
    return "ddbmacro";
  }

  get activity() {
    return {
      data: {
        img: "icons/magic/unholy/orb-glowing-purple.webp",
        macro: {
          name: "Toggle Darkness",
          function: "ddb.spell.darkness",
          visible: false,
          parameters: "",
        },
      },
    };
  }

}
