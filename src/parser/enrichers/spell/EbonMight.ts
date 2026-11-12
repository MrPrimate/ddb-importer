import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Evoker): creatures of your choice in a 10-foot Emanation are empowered until the
 * end of your next turn, their attack hits dealing an extra 1d4 Force. DDB builds a 1d4 damage roll
 * on the caster's area instead.
 */
export default class EbonMight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Empower",
      data: {
        target: {
          override: true,
          affects: { type: "creature", choice: true },
          template: { contiguous: false, type: "radius", size: "10", units: "ft" },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ebon Might: Empowered",
        options: {
          transfer: false,
          expiry: "sourceEnd",
          description: "When you hit a target with an attack roll, the attack deals an extra 1d4 Force damage.",
        },
        changes: ["mwak", "rwak", "msak", "rsak"].map((type) =>
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4[force]", 22, `system.bonuses.${type}.damage`),
        ),
      },
    ];
  }

}
