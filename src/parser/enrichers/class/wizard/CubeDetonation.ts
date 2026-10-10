import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Materializer Minor Creation: a detonated Cube makes creatures within 10 feet save (Dexterity, spell
 * save DC) against 1d6 + half Wizard level Force, half on a success. Expending a level 1+ spell slot
 * restores detonations equal to the slot's level: the slot scales by level, and dnd5e grows the
 * negative use cost by one per step.
 */
export default class CubeDetonation extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      addItemConsume: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { type: "radius", size: "10", units: "ft", contiguous: false },
        },
        save: {
          ability: ["dex"],
          dc: { calculation: "spellcasting", formula: "" },
        },
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, bonus: "floor(@classes.wizard.levels / 2)", types: ["force"] })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Restore Detonations",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          activationOverride: { type: "special", value: 1, condition: "Expend a level 1+ spell slot (no action required)" },
        },
        overrides: {
          targetSelf: true,
          rangeSelf: true,
          noTemplate: true,
          addItemConsume: true,
          itemConsumeValue: "-1",
          addScalingMode: "amount",
          addConsumptionScalingMax: "9",
          additionalConsumptionTargets: [
            {
              type: "spellSlots",
              value: "1",
              target: "1",
              scaling: { mode: "level" },
            },
          ],
        },
      },
    ];
  }

}
