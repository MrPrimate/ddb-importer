import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArmsOfTheAstralSelfSummon extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      noConsumeTargets: true,
      addItemConsume: true,
      itemConsumeTargetName: this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus",
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
              customFormula: "2@scale.monk.die.die",
              type: "force",
            }),
          ],
          onSave: "none",
        },
      },
    };
  }

}
