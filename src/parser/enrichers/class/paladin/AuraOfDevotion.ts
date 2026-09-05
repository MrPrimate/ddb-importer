import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Charmed immunity for the paladin and allies inside the Aura of Protection. With auraeffects
 * the transferred effect radiates on its own; otherwise the activity places a template whose
 * region applies the standalone effect.
 */
export default class AuraOfDevotion extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Aura",
      targetType: "ally",
      activationType: "special",
      data: {
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: "@scale.paladin.aura-of-protection",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: "Aura of Devotion",
            auraeffectsNever: true,
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Aura of Devotion",
        standalone: true,
        auraeffectsNever: true,
        changes: [
          DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
        ],
      },
      {
        name: "Aura of Devotion",
        auraeffectsOnly: true,
        options: {
          transfer: true,
        },
        daeStackable: "noneNameOnly",
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "@scale.paladin.aura-of-protection",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
        changes: [
          DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
        ],
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
