import DDBEnricherData from "../../data/DDBEnricherData";

export default class SmiteOfProtection extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        statuses: ["coverHalf"],
        options: {
          durationSeconds: 6,
        },
        daeStackable: "noneNameOnly",
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `@scale.paladin.${this.data.name.toLowerCase().replaceAll(" ", "-")}`,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }
}
