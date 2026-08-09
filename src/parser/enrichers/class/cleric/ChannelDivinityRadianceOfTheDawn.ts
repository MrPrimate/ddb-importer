import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityRadianceOfTheDawn extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
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
