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
    // Far Realm zealot: "Any non-Aberration creature..."
    "Aberrant Form": { excludeTypes: ["aberration"] },
    // rutterkin, alkilith, Bael: "a creature that isn't a demon" / "other than a devil"
    "Immobilizing Fear": { excludeTypes: ["fiend"] },
    "Crippling Fear": { excludeTypes: ["fiend"] },
    "Foment Confusion": { excludeTypes: ["fiend"] },
    "Foment Madness": { excludeTypes: ["fiend"] },
    "Dread": { excludeTypes: ["fiend"] },
    "Dreadful": { excludeTypes: ["fiend"] },
    // swarm of ravens: "any creature (other than a Fiend) with a Fly Speed"
    "Wing Bind": { excludeTypes: ["fiend"] },
    // hag: "Any Humanoid that starts its turn within 60 feet"
    "Confounding Ugliness": { types: ["humanoid"] },
  };

  get behaviorFilters(): { sizes?: string[]; types?: string[]; excludeTypes?: string[] } {
    return TurnStartAuraSave.NAME_FILTERS[this.name] ?? {};
  }

  /**
   * The monster feature parser's raw trait text. The document description is
   * not built when the activity hook runs, so `this.document` is not usable here.
   */
  get traitText(): string {
    const parser = this.ddbParser as { strippedHtml?: string; html?: string } | undefined;
    return parser?.strippedHtml
      ?? parser?.html
      ?? ((this.document?.system?.description?.value ?? "") as string);
  }

  /**
   * Some feature names are shared between target-turn auras and owner-turn or
   * flavour-only variants on other monsters (Cold Aura, Drone). Only emit the
   * region trigger when this monster's wording is the target-turn shape.
   */
  get isTargetTurnAura(): boolean {
    return (/starts? (?:its|their|each) turn (?:within|in\b)/i).test(this.traitText);
  }

  /**
   * "...or enters that area for the first time on a turn" (Arcane Leak): the aura
   * also fires on entry, which the once-per-turn default keeps to one trigger.
   */
  get firesOnEntry(): boolean {
    return (/enters (?:that|the) (?:area|emanation)/i).test(this.traitText);
  }

  /**
   * The aura radius when the text names the monster ("within 30 feet of Rakdos",
   * "within 10 feet of Bael"): the parser's area regex only recognises a generic
   * referent ("of it", "of the mouther"), so those traits parse with no template
   * and the emanation would have no size. Null when the parser already found one.
   */
  get missingTemplateRadius(): string | null {
    const parser = this.ddbParser as { actionData?: { target?: { template?: { size?: string | number | null } } } } | undefined;
    if (parser?.actionData?.target?.template?.size) return null;
    const match = this.traitText.match(/starts? (?:its|their|each) turn (?:within|in an?) (\d+)[ -](?:feet|foot|ft)/i);
    return match ? match[1] : null;
  }

  override get activity(): IDDBActivityData {
    if (!this.isTargetTurnAura) return {};
    const radius = this.missingTemplateRadius;
    return {
      ...(radius ? { targetType: "creature" } : {}),
      data: {
        ...(radius
          ? {
            target: {
              override: true,
              affects: {
                type: "creature",
              },
              template: {
                count: "1",
                contiguous: false,
                type: "radius",
                size: radius,
                units: "ft",
              },
            },
          }
          : {}),
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: this.firesOnEntry ? ["tokenEnter", "tokenTurnStart"] : ["tokenTurnStart"],
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
