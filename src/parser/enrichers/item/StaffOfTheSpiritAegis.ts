import DDBEnricherData from "../data/DDBEnricherData";

const AURA_NAME = "Aura of Haunted Power";

function auraChanges(): IActiveEffectChangeData[] {
  return [
    DDBEnricherData.ChangeHelper.damageResistanceChange("cold"),
    DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic"),
    DDBEnricherData.ChangeHelper.damageResistanceChange("psychic"),
    DDBEnricherData.ChangeHelper.ruleAdvantageChange("save", {
      conditions: { k: "roll.reason", o: "exact", v: "frightened" },
    }),
  ];
}

/**
 * AUD. DDB's resistance modifiers are restricted to the aura, so the automatic transfer effect is
 * replaced by the always-on Necrotic resistance plus the aura in its two arms.
 */
export default class StaffOfTheSpiritAegis extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: AURA_NAME, type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: { generateActivation: true, generateConsumption: false, generateTarget: true },
        overrides: {
          targetType: "ally",
          activationType: "action",
          data: {
            target: {
              override: true,
              affects: { type: "ally", choice: true },
              template: { type: "radius", size: "30", units: "ft" },
            },
            behaviors: [
              DDBEnricherData.BehaviorHelper.applyEffect({ effects: AURA_NAME, auraeffectsNever: true }),
            ],
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Staff of the Spirit Aegis: Necrotic Resistance",
        options: { transfer: true },
        changes: [DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic")],
      },
      {
        name: AURA_NAME,
        standalone: true,
        auraeffectsNever: true,
        changes: auraChanges(),
        options: { description: "Undead have Disadvantage on attack rolls against creatures in the aura." },
      },
      {
        name: AURA_NAME,
        activityMatch: AURA_NAME,
        auraeffectsOnly: true,
        daeStackable: "none",
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "30",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
        },
        changes: auraChanges(),
      },
    ];
  }

}
