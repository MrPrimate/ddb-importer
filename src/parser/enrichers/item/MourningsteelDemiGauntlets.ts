import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Mourningsteel Demi-Gauntlets: damage from the spells cast from them ignores Resistance to
 * Necrotic damage. Those casts roll as their own spell items, which dnd5e marks with
 * `flags.dnd5e.cachedFor`, so the rule matches the three spells only when cast from an item.
 */
export default class MourningsteelDemiGauntlets extends DDBEnricherData {

  static SPELLS = ["chill-touch", "inflict-wounds", "vampiric-touch"];

  override get effects(): IDDBEffectHint[] {
    return DDBEnricherData.ignoreDamageReductionEffect("Mourningsteel Demi-Gauntlets: Necrotic Spells", "necrotic", {
      immunity: false,
      conditions: [
        { k: "item.identifier", o: "in", v: MourningsteelDemiGauntlets.SPELLS },
        { k: "item.flags.dnd5e.cachedFor", o: "empty", v: false },
      ],
    });
  }

}
