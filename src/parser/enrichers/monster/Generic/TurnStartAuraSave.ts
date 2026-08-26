import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Aura traits whose rules text is "any creature that starts its turn within
 * X feet / in an X-foot Emanation must save..." (Stench, Fear Aura, Lordly
 * Presence...). The monster feature parser already extracts the radius
 * template, save and rider status; this wires the region trigger so the save
 * fires for tokens that start their turn inside, excluding the monster the
 * emanation originates from. Owner-turn auras (Fire Aura
 * and friends, "at the start/end of each of the MONSTER's turns") are NOT
 * registered here as region events cannot express them.
 */
export default class TurnStartAuraSave extends DDBEnricherData {

  /**
   * Size/creature-type filters for auras whose text exempts a type ("to which
   * demons are immune", "other than a devil"). Creature types are top level only,
   * so demon/devil exemptions are approximated at the fiend type.
   */
  static NAME_FILTERS: Record<string, { sizes?: string[]; types?: string[]; excludeTypes?: string[] }> = {
    // Chasme: "produces a horrid droning sound to which demons are immune"
    "Drone": { excludeTypes: ["fiend"] },
    // Nupperibo: "Any creature, other than a devil..."
    "Cloud of Vermin": { excludeTypes: ["fiend"] },
  };

  get behaviorFilters(): { sizes?: string[]; types?: string[]; excludeTypes?: string[] } {
    return TurnStartAuraSave.NAME_FILTERS[this.name] ?? {};
  }

  /**
   * Some feature names are shared between target-turn auras and owner-turn or
   * flavour-only variants on other monsters (Cold Aura, Drone). Only emit the
   * region trigger when this monster's wording is the target-turn shape.
   */
  get isTargetTurnAura(): boolean {
    // the document description is not built when the activity hook runs, so read the
    // monster feature parser's raw trait text
    const parser = this.ddbParser as { strippedHtml?: string; html?: string } | undefined;
    const description = parser?.strippedHtml
      ?? parser?.html
      ?? ((this.document?.system?.description?.value ?? "") as string);
    return (/starts? (?:its|their|each) turn (?:within|in\b)/i).test(description);
  }

  override get activity(): IDDBActivityData {
    if (!this.isTargetTurnAura) return {};
    return {
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            // the emanation originates from the monster, which does not save
            // against its own stench/presence/thing
            excludeSelf: true,
            ...this.behaviorFilters,
          }),
        ],
      },
    };
  }

}
