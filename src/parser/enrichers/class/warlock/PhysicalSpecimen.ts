import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

/** One Physical Specimen benefit, chosen by its own self-enchant activity. */
interface ISpecimenBenefit {
  /** Id-safe key, unique across the table. */
  key: string;
  name: string;
  description: string;
  changes?: IActiveEffectChangeData[];
  ac5eChanges?: IAC5eActiveEffectChangeData[];
  /** A benefit that grants an activity instead of an actor effect. */
  activity?: IDDBAdditionalActivity;
}

/**
 * Parasite Patron. Physical Specimen is a Bonus Action choosing benefits (up to the Charisma
 * modifier) that last until a Long Rest. Each benefit is a self-enchant activity on this feature
 * that spends its single use (1/SR); the enchantment carries the benefit as a rider (an actor
 * effect, or the reaction activity) and expires on a Long Rest. A self enchantment holds one
 * profile per activity, so several benefits at once need an activity each. While a benefit is
 * applied its activity is renamed "End <benefit>" and spends nothing, since using it again ends
 * the benefit. DDB records every benefit as a chosen option; those child documents are suppressed,
 * since their always-on effects would grant every benefit permanently.
 */
export default class PhysicalSpecimen extends DDBEnricherData {

  static REACTION_ACTIVITY_ID = utils.namedIDStub("Specimen React", { prefix: "phs", postfix: "act" });

  /** A getter: the change helpers read CONFIG, which is empty when the barrel is imported. */
  static get BENEFITS(): ISpecimenBenefit[] {
    return [
      {
        key: "HitPoints",
        name: "Increased Hit Point Maximum",
        description: "Your Hit Point maximum increases by an amount equal to your Warlock level.",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("@classes.warlock.levels", 14, "system.attributes.hp.bonuses.overall"),
        ],
      },
      {
        key: "Darkvision",
        name: "Darkvision",
        description: "You gain Darkvision with a range of 60 feet. If you already have Darkvision, its range increases by 30 feet.",
        // the add runs first, so existing Darkvision gains 30 feet and none at all ends at 60
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("30", 20, "system.attributes.senses.darkvision"),
          DDBEnricherData.ChangeHelper.upgradeChange("60", 30, "system.attributes.senses.darkvision"),
        ],
      },
      {
        key: "Speed",
        name: "Speed Increase",
        description: "Your Speed increases by 5 feet.",
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("5"),
        ],
      },
      {
        key: "Poisoned",
        name: "Advantage: Poisoned Saving Throws",
        description: "You have Advantage on saving throws to avoid or end the Poisoned condition.",
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("riderStatuses.poisoned", 20, "flags.automated-conditions-5e.save.advantage"),
        ],
      },
      {
        key: "JumpClimb",
        name: "Increased Jump and Climb Speed",
        description: "Your jump distance is tripled, and you gain a Climb Speed equal to your Speed.",
        // dnd5e 6 rewrites the jump distance as Strength / 2 after the initial phase, and its
        // formula field keeps a final-phase multiply or formula unevaluated, so only the climb
        // speed is automated; the tripled jump stays in the description
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.climb"),
        ],
      },
      {
        key: "Reaction",
        name: "Reaction: Bonus to Ability Check",
        description: "When you make a Strength (Athletics) check or Dexterity (Acrobatics) check, you can take a Reaction to add a bonus to the ability check equal to your Charisma modifier.",
        activity: {
          init: {
            name: "Bonus to Ability Check",
            type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
          },
          build: {
            noeffect: true,
            generateActivation: true,
            generateConsumption: false,
            generateRange: false,
            generateTarget: false,
            generateRoll: true,
            activationOverride: {
              type: "reaction",
              value: 1,
              condition: "When you make a Strength (Athletics) or Dexterity (Acrobatics) check",
            },
            rollOverride: {
              prompt: false,
              visible: true,
              formula: "@abilities.cha.mod",
              name: "Ability Check Bonus",
            },
          },
          overrides: {
            id: PhysicalSpecimen.REACTION_ACTIVITY_ID,
          },
        },
      },
    ];
  }

  static activityId(benefit: ISpecimenBenefit): string {
    return utils.namedIDStub(benefit.key, { prefix: "phs", postfix: "enc" });
  }

  static riderId(benefit: ISpecimenBenefit): string {
    return utils.namedIDStub(benefit.key, { prefix: "phs", postfix: "rdr" });
  }

  static enchantmentId(benefit: ISpecimenBenefit): string {
    return utils.namedIDStub(benefit.key, { prefix: "phs", postfix: "ech" });
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get noChoiceBuild(): boolean {
    return true;
  }

  override get noSuppressedChoiceModifiers(): boolean {
    return true;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const benefits = PhysicalSpecimen.BENEFITS;
    const enchants: IDDBAdditionalActivity[] = benefits.map((benefit) => ({
      init: {
        name: benefit.name,
        type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
      },
      build: {
        generateActivation: true,
        generateConsumption: false,
        generateRange: false,
        generateDuration: true,
        activationOverride: {
          type: "bonus",
          value: 1,
          condition: "",
        },
        durationOverride: {
          value: "",
          units: "spec",
          special: "Until you finish a Long Rest",
        },
      },
      overrides: {
        id: PhysicalSpecimen.activityId(benefit),
        targetType: "self",
        noTemplate: true,
        addItemConsume: true,
        data: {
          enchant: {
            self: true,
          },
        },
      },
    }));
    const riderActivities = benefits
      .map((benefit) => benefit.activity)
      .filter((activity): activity is IDDBAdditionalActivity => !!activity);
    return [...enchants, ...riderActivities];
  }

  /** The actor effect a benefit's enchantment copies onto this feature while it is applied. */
  static riderHint(benefit: ISpecimenBenefit): IDDBEffectHint {
    return {
      name: `Physical Specimen: ${benefit.name}`,
      options: {
        transfer: true,
        description: benefit.description,
      },
      changes: benefit.changes ?? [],
      ac5eChanges: benefit.ac5eChanges ?? [],
      data: {
        _id: PhysicalSpecimen.riderId(benefit),
      },
    };
  }

  /** The enchantment applied by a benefit's activity: the rider, the rename and the free end use. */
  static enchantmentHint(benefit: ISpecimenBenefit): IDDBEffectHint {
    const activityId = PhysicalSpecimen.activityId(benefit);
    return {
      name: `Specimen Benefit: ${benefit.name}`,
      type: "enchant",
      activityMatch: benefit.name,
      options: {
        expiry: "longRest",
        description: benefit.description,
      },
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange(`End ${benefit.name}`, 20, `system.activities.${activityId}.name`),
        DDBEnricherData.ChangeHelper.overrideChange("[]", 20, `system.activities.${activityId}.consumption.targets`),
      ],
      data: {
        _id: PhysicalSpecimen.enchantmentId(benefit),
        flags: {
          ddbimporter: benefit.activity
            ? { activityRiders: [PhysicalSpecimen.REACTION_ACTIVITY_ID] }
            : { effectRiders: [PhysicalSpecimen.riderId(benefit)] },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const benefits = PhysicalSpecimen.BENEFITS;
    return [
      ...benefits.filter((benefit) => !benefit.activity).map((benefit) => PhysicalSpecimen.riderHint(benefit)),
      ...benefits.map((benefit) => PhysicalSpecimen.enchantmentHint(benefit)),
    ];
  }

  // DDB ships no limited use for this feature; each benefit activation spends the one use
  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "1",
        recovery: [{ period: "sr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
