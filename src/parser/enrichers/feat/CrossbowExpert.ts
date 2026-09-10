import DDBEnricherData from "../data/DDBEnricherData";

export default class CrossbowExpert extends DDBEnricherData {

  /**
   * The Light property's extra attack is dnd5e's "offhand" attack mode, whose damage roll drops a
   * positive `@mod`. This rule change puts the modifier back for a crossbow with the Light property.
   * No "crossbow" property exists, so the weapon is matched on the three crossbow base items and
   * the Light property. dnd5e already keeps a negative modifier on off-hand damage, so the rule
   * only fires when the modifier is positive, which is the feat's "aren't already adding that
   * modifier" clause.
   * 2024 text only: the 2014 feat has no Light crossbow and grants a hand crossbow bonus attack instead.
   */
  private get lightCrossbowOffhandEffect(): IDDBEffectHint {
    return {
      name: "Crossbow Expert: Light Crossbow Extra Attack",
      options: {
        transfer: true,
        description: "Add your ability modifier to the damage of the Light property's extra attack when made with a crossbow.",
      },
      changes: [
        DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "@abilities.dex.mod", {
          priority: 22,
          conditions: [
            { k: "roll.attack.mode", o: "in", v: ["offhand"] },
            // roll.item is the crossbow being fired; plain item would be this feat (ChangeHelper.SPELL_FILTER)
            { k: "roll.item.type.baseItem", o: "in", v: ["handcrossbow", "heavycrossbow", "lightcrossbow"] },
            { k: "roll.item.properties", o: "has", v: "lgt" },
            { k: "abilities.dex.mod", o: "gte", v: 1 },
          ],
        }),
      ],
    };
  }

  override get effects(): IDDBEffectHint[] {
    const effects: IDDBEffectHint[] = [
      {
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.ignoreNearbyFoes"),
        ],
      },
    ];
    if (!this.is2014) effects.push(this.lightCrossbowOffhandEffect);
    return effects;
  }

}
