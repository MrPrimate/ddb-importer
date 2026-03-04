import DDBEnricherData from "../../data/DDBEnricherData";

export default class AuraOfTheSentinel extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  /**
   * @returns {DDBEffectHint[]}
   */
  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        noCreate: true,
        daeStackable: "noneNameOnly",
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: `@scale.watchers.aura-of-the-sentinel`,
              isAura: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `@scale.watchers.aura-of-the-sentinel`,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];

  }
}
