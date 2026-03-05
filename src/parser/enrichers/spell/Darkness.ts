import DDBEnricherData from "../data/DDBEnricherData";

export default class Darkness extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DDBMACRO;
  }

  get activity(): IDDBActivityData {
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
