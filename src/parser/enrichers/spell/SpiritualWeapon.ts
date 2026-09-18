import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The floating weapon is a summoned token under both rulesets (the dnd5e SRD pack ships the 2014
 * spell that way too); the weapon actors are ruleset-neutral. The caster rolls the attack from
 * the spell's own Attack activity, whose damage scaling is what differs between the rulesets.
 */
export default class SpiritualWeapon extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getSpiritualWeapons;
  }

  override get generateSummons(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "SpiritualWeaponShortSword" },
        { count: 1, name: "ArcaneSwordAstralBlue" },
      ],
      summons: {
        "match": {
          "proficiency": false,
          "attacks": true,
          "saves": false,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateAttack: true,
          onsave: false,
          noSpellslot: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              bonus: "@mod",
              type: "force",
              scalingMode: this.is2014 ? "half" : "whole",
              scalingNumber: 1,
            }),
          ],
          activationOverride: { type: "bonus", condition: "" },
        },
      },
    ];
  }
}
