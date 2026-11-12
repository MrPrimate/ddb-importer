import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Demon Hunter): a 1 minute demonic form with one chosen benefit. Each benefit is
 * its own utility activity applying its effect: Devourer (Force dice of 1 or 2 count as 3, text only),
 * Havoc (melee weapon hits deal an extra 1d6 Fire, kept as a damage activity) and Vengeance (+2 AC and
 * +5 Hit Point maximum and current Hit Points).
 */
export default class Metamorphosis extends DDBEnricherData {

  // the forms are modelled here; the parsed "+5 Hit Points" heal would duplicate Vengeance's
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Devourer",
      targetType: "self",
      rangeSelf: true,
    };
  }

  #formActivity(name: string): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      },
      build: {
        generateActivation: true,
        generateTarget: true,
        generateConsumption: true,
        generateDuration: true,
        targetOverride: {
          override: true,
          affects: { type: "self" },
          template: {},
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this.#formActivity("Havoc"),
      this.#formActivity("Vengeance"),
      {
        init: {
          name: "Havoc: Fire Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "You hit with a melee weapon attack while in the Havoc form",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["fire"] }),
          ],
        },
      },
      {
        init: {
          name: "Vengeance: Hit Points",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "You take the Vengeance form",
          },
          targetOverride: {
            override: true,
            affects: { type: "self" },
          },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "5", types: ["healing"] }),
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Havoc: Fire Damage", "Vengeance: Hit Points"],
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Metamorphosis: Devourer",
        activityMatch: "Devourer",
        options: {
          durationSeconds: 60,
          description: "When you roll damage for a spell, weapon or feature that deals Force damage, you can treat any 1 or 2 on a damage die as a 3.",
        },
      },
      {
        name: "Metamorphosis: Havoc",
        activityMatch: "Havoc",
        options: {
          durationSeconds: 60,
          description: "Whenever you hit a creature with an attack roll using a Melee weapon, the target takes an extra 1d6 Fire damage.",
        },
      },
      {
        name: "Metamorphosis: Vengeance",
        activityMatch: "Vengeance",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("5", 20, "system.attributes.hp.tempmax"),
        ],
      },
    ];
  }

}
