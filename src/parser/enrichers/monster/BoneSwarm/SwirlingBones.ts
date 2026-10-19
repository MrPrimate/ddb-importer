import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * "36 (8d8) bludgeoning, 36 (8d8) piercing, or 36 (8d8) slashing damage (the bone swarm's choice),
 * or 18 (4d8) bludgeoning, 8 (4d8) piercing, or 8 (4d8) slashing damage (the bone swarm's choice)
 * if the swarm has half of its hp or fewer."
 *
 * Only the last type of each list is followed by "damage", so the parser reads one slashing roll
 * of each. Both rolls are one part offering all three types.
 */
export default class SwirlingBones extends DDBEnricherData {

  static TYPES: I5eDamageType[] = ["bludgeoning", "piercing", "slashing"];

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          includeBase: false,
          parts: [DDBEnricherData.basicDamagePart({ number: 8, denomination: 8, types: SwirlingBones.TYPES })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          activationCondition: "the swarm has half of its hit points or fewer",
          data: {
            name: "Bloodied Attack",
            damage: {
              includeBase: false,
              parts: [DDBEnricherData.basicDamagePart({ number: 4, denomination: 8, types: SwirlingBones.TYPES })],
            },
          },
        },
      },
    ];
  }

  override get noVersatile(): boolean {
    return true;
  }

}
