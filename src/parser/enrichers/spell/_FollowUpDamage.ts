import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A slot-free follow-up activity for a spell whose DDB damage list holds both the initial damage and
 * damage dealt later (a curse rider, a start-of-turn tick, a lingering area). It rolls the DDB
 * damage parts at `parts`, so the parsed upcast scaling stays with them. With `save` it is a saving
 * throw against the spell's DC; `onSave` defaults to half.
 */
export function followUpDamage({ name, parts, condition, save = null, onSave = "half", template = null }: {
  name: string;
  parts: number[];
  condition: string;
  save?: string | null;
  onSave?: string;
  template?: { type: TTemplate; size: string } | null;
}): IDDBAdditionalActivity {
  const targetOverride: I5eActivityTarget = template
    ? {
      override: true,
      affects: { type: "creature" },
      template: { contiguous: false, type: template.type, size: template.size, units: "ft" },
    }
    : { override: true, affects: { count: "1", type: "creature" } };
  return {
    init: {
      name,
      type: save ? DDBEnricherData.ACTIVITY_TYPES.SAVE : DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
    },
    build: {
      generateActivation: true,
      generateDamage: true,
      generateConsumption: false,
      generateTarget: true,
      generateDuration: true,
      generateSave: save !== null,
      noSpellslot: true,
      partialDamageParts: parts,
      activationOverride: { type: "special", value: null, condition },
      durationOverride: { units: "inst", concentration: false },
      targetOverride,
      ...(save
        ? { onSave, saveOverride: { ability: [save], dc: { calculation: "spellcasting", formula: "" } } }
        : {}),
    },
    overrides: {
      noeffect: true,
      noTemplate: template === null,
    },
  };
}
