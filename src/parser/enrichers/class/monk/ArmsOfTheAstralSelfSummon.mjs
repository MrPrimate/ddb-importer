/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ArmsOfTheAstralSelfSummon extends DDBEnricherData {

  get activity() {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.monk.martial-arts.die",
              type: "force",
            }),
          ],
          onSave: "none",
        },
      },
    };
  }

}
