import Generic from "../Generic";

/**
 * Heroic Sorcery: DDB's actions build the maneuvers; Wounding Strike's bleeding wound damage
 * (its "Wounding Strike: Necrotic" action) ignores Resistance and Immunity.
 */
export default class MysticalManeuvers extends Generic {

  override get effects(): IDDBEffectHint[] {
    return Generic.ignoreDamageReductionEffect("Mystical Maneuvers: Bleeding Wound", "necrotic", {
      conditions: this.selfActivityFilter("Wounding Strike: Necrotic"),
    });
  }

}
