/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Mislead extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "IllusionCreature" },
      ],
      data: {
        creatureSizes: [
          "tiny",
          "sm",
          "med",
          "lg",
        ],
      },
    };
  }

  get effects() {
    return [
      {
        name: "Invisible",
        statuses: "Invisible",
      },
    ];
  }

}
