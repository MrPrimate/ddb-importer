import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityCreateVoid extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      data: {
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: `1d8 + @classes.${this.classIdentifier("Cleric")}.levels`,
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
