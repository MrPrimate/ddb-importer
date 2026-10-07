import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The caster's hand detaches and becomes a Spider, summoned as a "Creeping Hand" actor built from
 * the Spider stat block of the importing ruleset. If the spider dies or cannot return the caster
 * takes 1d6 psychic damage, which is a separate damage activity.
 */
export default class CreepingTouch extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getCreepingTouch;
  }

  override get generateSummons(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Detach Hand",
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: [
        { count: "1", name: `CreepingHand${this.is2014 ? "2014" : "2024"}` },
      ],
      summons: {
        match: {
          proficiency: false,
          attacks: false,
          saves: false,
          disposition: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spider Slain",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          noSpellslot: true,
          onsave: false,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "The spider is killed or prevented from returning to you",
          },
          targetOverride: { override: true, affects: { type: "self" }, template: {} },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: ["psychic"],
              scalingMode: "none",
            }),
          ],
        },
      },
    ];
  }

}
