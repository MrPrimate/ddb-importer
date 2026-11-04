import DDBEnricherData from "../../data/DDBEnricherData";

export default class CompressionLock extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: `@scale.${this.subclassIdentifier("Squared Circle")}.groundwork + @abilities.str.mod`,
            }),
          ],
        },
      },
    };
  }

}
