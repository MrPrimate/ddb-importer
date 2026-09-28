import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * Scorching Cleaver: an extra 1d6 fire on a hit while it has a charge. Erupting Slash spends 3 or
 * more charges on a 5 x 30 foot line: a Dexterity save against 8 + proficiency + the charges spent,
 * or 1d6 fire per charge. Spending 4 or more and leaving none overheats it: an extra 3d6 fire, and
 * half damage on a success.
 *
 * The charge count rides on consumption scaling: the base use spends 3 and each scaling step one
 * more. `@scaling` is dnd5e's scaling value, 1 on an unscaled use, so the charges spent are
 * 2 + `@scaling`: DC 10 + proficiency + `@scaling`, (2 + `@scaling`)d6.
 */
export default class ScorchingCleaver extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      noeffect: true,
      data: {
        damage: {
          includeBase: true,
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["fire"] })],
        },
      },
    };
  }

  slash(name: string, overheat: boolean): IDDBAdditionalActivity {
    const activity = itemProperty(name, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
      save: { ability: ["dex"], formula: "10 + @prof + @scaling" },
      damageParts: [
        DDBEnricherData.basicDamagePart({ customFormula: "(2 + @scaling)d6", types: ["fire"] }),
        ...(overheat ? [DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["fire"] })] : []),
      ],
      onSave: overheat ? "half" : "none",
      activationType: "action",
      condition: overheat
        ? "Expend 4 or more charges, leaving the battleaxe with none: it overheats"
        : "Expend 3 or more charges",
      template: { type: "line", size: "30", width: "5" },
      range: { value: null, units: "self" },
      charges: "3",
      noeffect: true,
    });
    activity.overrides = {
      ...activity.overrides,
      addScalingMode: "amount",
      addScalingFormula: "1",
      addConsumptionScalingMax: "@item.uses.value - 2",
    };
    return activity;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this.slash("Erupting Slash", false),
      this.slash("Erupting Slash (Overheat)", true),
    ];
  }

}
