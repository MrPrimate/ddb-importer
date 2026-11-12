export {};

global {
  /**
   * Character-wide "keep from Foundry" defaults for matched items on re-import. Each one only
   * adds retention: a per-item retain flag of false does not opt the item back out.
   */
  /** The prepared uses a created item and its activities expose, read when clamping kept spent uses. */
  interface IPreparedUsesHolder {
    uses?: { spent?: number | null; max?: number | null };
    activities?: {
      values(): Iterable<{ id?: string | null; uses?: { spent?: number | null; max?: number | null } }>;
      get?(id: string): { uses?: { spent?: number | null; max?: number | null } } | undefined;
    };
  }

  /** A parsed item paired with the live owned item it will replace on re-import. */
  interface IPlayStatePair {
    item: I5ePCItem;
    existing: Item.Implementation;
  }

  /** One difference shown in the play-state review dialog; see PlayStateReview for the key forms. */
  interface IPlayStateRow {
    key: string;
    group: "actor" | "features" | "inventory";
    label: string;
    foundry: string;
    ddb: string;
    /** the radio's starting side, from the matching "Keep from Foundry" setting */
    keepFoundry: boolean;
    /** the per-item retain flag "Remember my choice" writes when Foundry is kept */
    remember?: {
      item: I5ePCItem;
      flag: "retainUseSpent" | "retainActivityUseSpent" | "retainQuantity";
      activityName?: string;
    };
  }

  interface IPlayStateActorInput {
    parsed: I5ePCData;
    classes: I5ePCItem[];
    original: I5ePCData;
    /** prepared hit points of the live actor before the import */
    liveHP: { value: number; max: number; temp: number } | null;
    policies: { hp: boolean; keepHPDamage: boolean; keepHPTemp: boolean; inspiration: boolean; hitDie: boolean; spellUse: boolean };
  }

  interface IPlayStateDialogResult {
    /** row key to true when the Foundry value is kept */
    decisions: Record<string, boolean>;
    remember: boolean;
  }

  interface IPlayStateRetainDefaults {
    useSpent: boolean;
    activityUseSpent: boolean;
    quantity: boolean;
  }

  /**
   * Which activities keep their spent uses on a re-import: all, none, the activities named in an
   * enricher's list, or the activity ids a play-state review chose (names can repeat on one item).
   */
  type TActivityUseSpentSelection = boolean | string[] | { activityIds: string[] };

  /** What restoreDDBMatchedFlags kept from Foundry on one matched item, re-applied after a compendium swap. */
  interface IRetainedSpentState {
    useSpent: boolean;
    activityUseSpent: TActivityUseSpentSelection;
  }

}
