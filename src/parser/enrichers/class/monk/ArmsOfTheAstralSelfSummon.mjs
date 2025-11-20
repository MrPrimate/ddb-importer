/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ArmsOfTheAstralSelfSummon extends DDBEnricherData {

  get activity() {
    return {
      noConsumeTargets: true,
      addItemConsume: true,
      itemConsumeTargetName: "Ki",
      rangeSelf: true,
      data: {
        target: {
          affects: {
            type: "enemy",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "2@scale.monk.martial-arts.die",
              type: "force",
            }),
          ],
          onSave: "none",
        },
      },
    };
  }

}
