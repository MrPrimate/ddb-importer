import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The duplicate copies a creature the table already has, so the summon carries one blank profile
 * for the caster to point at that actor (the shape the dnd5e SRD pack ships on the 2014 spell).
 * Both rulesets say the same three things about the copy, all of which the summon applies:
 * its hit point maximum is half the original's, it is a construct, and it is friendly.
 */
export default class Simulacrum extends DDBEnricherData {

  /**
   * dnd5e adds this to the summoned actor's hit points and exposes that actor as `@summon`, so
   * taking away the rounded-up half leaves half the original's maximum, rounded down.
   */
  static HALF_HP = "-ceil(@summon.attributes.hp.max / 2)";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Create Simulacrum",
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      data: {
        summon: {
          mode: "",
          prompt: true,
        },
        // a single entry is applied without asking: the copy's type becomes construct
        creatureTypes: ["construct"],
        match: {
          proficiency: false,
          attacks: false,
          saves: false,
          disposition: true,
        },
        bonuses: {
          ac: "",
          hp: Simulacrum.HALF_HP,
          attackDamage: "",
          saveDamage: "",
          healing: "",
        },
        profiles: [
          { name: "", count: "1" },
        ],
      },
    };
  }

}
