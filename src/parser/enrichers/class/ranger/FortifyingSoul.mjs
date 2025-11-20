/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FortifyingSoul extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Healing",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@classes.ranger.levels",
          types: ["healing"],
        }),
      },
    };
  }

  get effects() {
    return [{
      name: `${this.name}: Advantage vs saves against Frightened`,
      options: {
        description: "You have advantage on saving throws against Frightened.",
      },
    }];
  }

}
