/**
 * Building blocks shared by the property tables that ship as enchantments: the Arcana Unleashed
 * evolving-item properties (`_EvolvedItemProperties`) and the Dungeon Master's Guide artifact
 * properties (`_ArtifactProperties`).
 */

export const PROPERTY_ENCHANTMENT_IMG = "systems/dnd5e/icons/svg/activity/enchant.svg";

const DAWN_RECOVERY = [{ period: "dawn" as TLimitedUsePeriod, type: "recoverAll" }];

/** A bare effect in the shape every property enchantment, rider and activity effect starts from. */
export function propertyBaseEffect({ id, name, img, description, transfer, disabled = false, parent }: {
  id: string;
  name: string;
  img: string;
  description: string;
  transfer: boolean;
  disabled?: boolean;
  parent: IDDBStandaloneEffectParent;
}): I5eEffectData {
  return {
    _id: id,
    name,
    img,
    description,
    transfer,
    disabled,
    statuses: [],
    duration: {},
    tint: "",
    showIcon: 1,
    system: { changes: [] },
    flags: {
      dae: { transfer, stackable: "noneNameOnly" },
      ddbimporter: { disabled, parent: { ...parent } },
      "midi-qol": { forceCEOff: true },
      core: {},
    },
  };
}

/** Uses regained in full at dawn. */
export function dawnUses(max: number): I5eSystemLimitedUses {
  return { spent: 0, max: `${max}`, recovery: DAWN_RECOVERY };
}

/** Consume one of the activity's own uses (an empty target is "this activity" in dnd5e). */
export function ownUseConsumption(): Partial<I5eActivity> {
  return {
    consumption: {
      targets: [{ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
      scaling: { allowed: false, max: "" },
      spellSlot: false,
    },
  } as Partial<I5eActivity>;
}
