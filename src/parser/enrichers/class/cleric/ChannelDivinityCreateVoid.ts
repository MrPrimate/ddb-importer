import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityCreateVoid extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      data: {
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "1d8 + @classes.cleric.levels",
              type: "force",
            }),
          ],
        },
        range: {
          units: "ft",
          value: "60",
        },
        target: {
          template: {
            size: "15",
            units: "ft",
            type: "radius",
          },
        },
      },
    };
  }

}
