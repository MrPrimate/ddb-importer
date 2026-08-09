import DDBEnricherData from "../data/DDBEnricherData";

export default class Darkness extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DDBMACRO;
  }

  override get activity(): IDDBActivityData {
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
