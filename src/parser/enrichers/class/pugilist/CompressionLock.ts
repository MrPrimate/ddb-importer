import DDBEnricherData from "../../data/DDBEnricherData";

export default class CompressionLock extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.squared-circle.groundwork + @abilities.str.mod",
            }),
          ],
        },
      },
    };
  }

}
