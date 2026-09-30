import DDBEnricherData from "../data/DDBEnricherData";

/**
 * 2014: 5d12 necrotic or 5d12 temp HP for Undead; AU 2024: 3d10 + 25 necrotic or 3d10 temp HP.
 * A creature the damage kills rises as a Zombie at the start of the caster's next turn; it is not
 * under the caster's control, so the summon keeps no matched disposition. The Zombie is the one
 * Animate Dead imports.
 */
export default class NegativeEnergyFlood extends DDBEnricherData {

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getAnimateDead;
  }

  override get generateSummons(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      stopHealSpellActivity: true,
      name: "Living Target",
      data: {
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: this.is2014 ? 5 : 3,
              denomination: this.is2014 ? 12 : 10,
              bonus: this.is2014 ? "" : "25",
              type: "necrotic",
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Undead Target",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateActivation: true,
          generateConsumption: true,
          generateRange: true,
          generateTarget: true,
          healingPart: DDBEnricherData.basicDamagePart({
            number: this.is2014 ? 5 : 3,
            denomination: this.is2014 ? 12 : 10,
            types: ["temphp"],
            scalingMode: "none",
          }),
        },
        overrides: {
          targetType: "creature",
          noTemplate: true,
        },
      },
      {
        init: {
          name: "Raise Zombie",
          type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
        },
        build: {
          generateSummon: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "At the start of your next turn, a creature killed by the necrotic damage rises as a Zombie",
          },
        },
        overrides: {
          noTemplate: true,
          noConsumeTargets: true,
          removeSpellSlotConsume: true,
          profileKeys: [{ count: 1, name: this.is2014 ? "AnimatedZombie2014" : "AnimatedZombie2024" }],
          summons: {
            match: {
              proficiency: false,
              attacks: false,
              saves: false,
              disposition: false,
            },
          },
        },
      },
    ];
  }

}
