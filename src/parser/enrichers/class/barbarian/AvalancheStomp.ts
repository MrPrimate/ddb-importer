import DDBEnricherData from "../../data/DDBEnricherData";

export default class AvalancheStomp extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "action",
      rangeSelf: true,
      data: {
        save: {
          ability: ["dex"],
          dc: {
            calculation: "str",
            formula: "",
          },
        },
        target: {
          affects: {
            type: "creature",
            choice: true,
          },
          template: {
            type: "radius",
            size: "15",
            units: "ft",
            contiguous: false,
          },
        },
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "3d6 + @abilities.str.mod",
              types: ["bludgeoning"],
            }),
          ],
        },
      },
    };
  }

}
