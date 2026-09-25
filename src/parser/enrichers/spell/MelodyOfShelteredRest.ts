import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The 30-foot emanation follows the singer and gives every creature inside, the singer included,
 * Advantage on Perception checks. With an aura module the effect spreads from the singer; without
 * one it is applied by hand. Not being surprised has no active effect form and stays in the
 * effect's description.
 */
export default class MelodyOfShelteredRest extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Melody of Sheltered Rest",
        changes: [DDBEnricherData.ChangeHelper.advantageSkillChange("prc")],
        daeStackable: "noneNameOnly",
        options: {
          description: "Advantage on Perception checks and can't be surprised while in the aura.",
        },
        data: {
          flags: {
            ActiveAuras: {
              aura: "All",
              radius: "30",
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
          distanceFormula: "30",
          disposition: 0,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
