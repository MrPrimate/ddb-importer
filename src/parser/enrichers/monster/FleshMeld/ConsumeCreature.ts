import DDBEnricherData from "../../data/DDBEnricherData";

const SWALLOW = "Swallow";
const DIGEST = "Digest";
const REGURGITATE = "Regurgitate Save";

/**
 * A grappled creature that fails the Dexterity save is swallowed: nothing is rolled then. The
 * 3d6 necrotic lands at the start of each of the flesh meld's turns while it stays swallowed, so
 * it is its own damage activity rather than damage on the failed save. The Constitution save is
 * the flesh meld's own, made at the end of a turn in which the swallowed creature dealt it 30 or
 * more damage; failing it frees the creature.
 */
export default class ConsumeCreature extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: SWALLOW,
      activationType: "bonus",
      removeDamageParts: true,
      data: {
        damage: { parts: [] },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: DIGEST,
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateActivation: true,
          generateTarget: true,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["necrotic"] })],
          activationOverride: {
            type: "special",
            value: null,
            condition: "At the start of each of the flesh meld's turns, to the creature it has swallowed",
          },
          targetOverride: {
            override: true,
            affects: { count: "1", type: "creature" },
            template: {},
          },
        },
        overrides: {
          noConsumeTargets: true,
          noeffect: true,
        },
      },
      {
        init: {
          name: REGURGITATE,
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateConsumption: false,
          generateActivation: true,
          generateTarget: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "15" } },
          activationOverride: {
            type: "special",
            value: null,
            condition: "End of a turn in which the swallowed creature dealt the flesh meld 30 or more damage; on a failure the creature is regurgitated and falls prone within 5 feet",
          },
          targetOverride: {
            override: true,
            affects: { type: "self" },
            template: {},
          },
        },
        overrides: {
          noConsumeTargets: true,
          noeffect: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Consume Creature: Swallowed",
        activityMatch: SWALLOW,
        statuses: ["Blinded", "Restrained"],
        options: {
          transfer: false,
          description: "Swallowed by the flesh meld: blinded, restrained, total cover from outside, and takes 3d6 necrotic damage at the start of each of the flesh meld's turns.",
        },
      },
    ];
  }

}
