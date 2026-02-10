/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ChannelDivinityRadianceOfTheDawn extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    return {
      targetType: "enemy",
      data: {
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "2d10 + @classes.cleric.levels",
              type: "radiant",
            }),
          ],
        },
        target: {
          template: {
            size: "30",
            units: "ft",
            type: "radius",
          },
        },
      },
    };
  }
}
