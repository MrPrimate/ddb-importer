export {};

declare global {
  /** A generic DDB item that holds one spell, see DICTIONARY.magicitems.spellCarriers. */
  interface IDDBSpellCarrier {
    kind: "scroll" | "tattoo" | "enspelled" | "gem";
    ddbName: RegExp;
    words: RegExp;
    ignoredProperties: ("vocal" | "somatic" | "material")[];
    printedValues: boolean;
    /** The activation the item casts with instead of the spell's casting time ("as an action"). */
    activation?: TActivationCost;
    /** The item holds a single casting: without uses of its own it gets one, which the cast spends. */
    singleUse?: boolean;
  }
}
