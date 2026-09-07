import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

/** One benefit the stone can carry: a self-enchantment profile and the actor effect it rides in. */
interface IStoneBenefit {
  /** Id-safe key, unique across the table. */
  key: string;
  label: string;
  text: string;
  /** Only offered once Potent Stone is known. */
  potent?: boolean;
  changes: IActiveEffectChangeData[];
}

const RESISTANCE_TYPES = ["Acid", "Cold", "Fire", "Lightning", "Poison", "Thunder"];

/**
 * Transmuter (AU 2024). The stone is modelled as a self-enchantment on this feature: "Create
 * Transmuter's Stone" spends the daily use and offers one profile per benefit; each profile
 * carries the bearer's effect as a rider (Constitution save proficiency plus the benefit) and,
 * while applied, renames the activity to "Change Stone Benefit" and blanks its consumption, since
 * the text lets the benefit change for free whenever a Transmutation spell is cast. Re-using the
 * activity with the same profile ends the stone (dnd5e's self-enchant toggle), a different one
 * swaps it. With Potent Stone a second, free enchant activity holds the second benefit and the
 * Mighty Build and Tremorsense profiles join both. The DDB choice children are suppressed: the
 * enchantment is the automation.
 *
 * The 2014 School of Transmutation feature shares the name and keeps its DDB defaults.
 */
export default class TransmutersStone extends DDBEnricherData {

  static CREATE_ACTIVITY_NAME = "Create Transmuter's Stone";

  static SECOND_ACTIVITY_NAME = "Add Second Stone Benefit";

  static CREATE_ACTIVITY_ID = utils.namedIDStub("Create Stone", { prefix: "ddb", postfix: "act" });

  static SECOND_ACTIVITY_ID = utils.namedIDStub("Second Stone", { prefix: "ddb", postfix: "act" });

  /** A getter: the roll-mode helpers read CONFIG, which is empty when the barrel is imported. */
  static get BENEFITS(): IStoneBenefit[] {
    return [
      {
        key: "Darkvision",
        label: "Darkvision",
        text: "The bearer gains Darkvision with a range of 60 feet or increases the range of its Darkvision by 60 feet.",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("60", 20, "system.attributes.senses.darkvision"),
        ],
      },
      ...RESISTANCE_TYPES.map((type) => ({
        key: `Resist ${type}`,
        label: `Resistance (${type})`,
        text: `The bearer gains Resistance to ${type} damage.`,
        changes: [DDBEnricherData.ChangeHelper.damageResistanceChange(type.toLowerCase())],
      })),
      {
        key: "Speed",
        label: "Speed",
        text: "The bearer's Speed increases by 10 feet.",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("10", 20, "system.attributes.movement.walk"),
        ],
      },
      {
        key: "Mighty Build",
        label: "Mighty Build",
        text: "The bearer has Advantage on Strength saving throws and counts as one size larger when determining its carrying capacity.",
        potent: true,
        changes: [
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("str"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.powerfulBuild"),
        ],
      },
      {
        key: "Tremorsense",
        label: "Tremorsense",
        text: "The bearer gains Tremorsense with a range of 30 feet.",
        potent: true,
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.senses.tremorsense"),
        ],
      },
    ];
  }

  static riderId(benefit: IStoneBenefit): string {
    return utils.namedIDStub(benefit.key, { prefix: "stn", postfix: "rdr" });
  }

  static enchantmentId(benefit: IStoneBenefit, second: boolean): string {
    return utils.namedIDStub(benefit.key, { prefix: "stn", postfix: second ? "en2" : "en1" });
  }

  get hasPotentStone(): boolean {
    return this.hasClassFeature({ featureName: "Potent Stone" });
  }

  get benefits(): IStoneBenefit[] {
    const potent = this.hasPotentStone;
    return TransmutersStone.BENEFITS.filter((benefit) => potent || !benefit.potent);
  }

  override get type(): IDDBActivityType | null {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.ENCHANT : null;
  }

  override get noChoiceBuild(): boolean {
    return this.is2024;
  }

  override get noSuppressedChoiceModifiers(): boolean {
    return this.is2024;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return this.is2014;
  }

  override get addAutoAdditionalActivities(): boolean {
    return this.is2014;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      name: TransmutersStone.CREATE_ACTIVITY_NAME,
      id: TransmutersStone.CREATE_ACTIVITY_ID,
      targetType: "self",
      noTemplate: true,
      activationType: "special",
      activationCondition: "When you finish a Long Rest",
      addItemConsume: true,
      data: {
        enchant: {
          self: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014 || !this.hasPotentStone) return [];
    return [
      {
        init: {
          name: TransmutersStone.SECOND_ACTIVITY_NAME,
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateConsumption: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "When you create your Transmuter's Stone",
          },
        },
        overrides: {
          id: TransmutersStone.SECOND_ACTIVITY_ID,
          noTemplate: true,
          targetType: "self",
          noConsumeTargets: true,
          data: {
            enchant: {
              self: true,
            },
          },
        },
      },
    ];
  }

  /** The bearer's effect for one benefit, copied onto this feature when its profile is applied. */
  riderHint(benefit: IStoneBenefit): IDDBEffectHint {
    return {
      name: `Transmuter's Stone: ${benefit.label}`,
      options: {
        transfer: true,
        description: `<p>${benefit.text} The bearer also has proficiency in Constitution saving throws.</p>`,
      },
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("1", 20, "system.abilities.con.proficient"),
        ...benefit.changes,
      ],
      data: {
        _id: TransmutersStone.riderId(benefit),
      },
    };
  }

  /**
   * One enchantment profile per benefit for an enchant activity. The rename and the blanked
   * consumption target that activity by id, so the first activity's profiles are distinct from the
   * second's even though they share riders.
   */
  enchantmentHint(benefit: IStoneBenefit, { second }: { second: boolean }): IDDBEffectHint {
    const activityId = second ? TransmutersStone.SECOND_ACTIVITY_ID : TransmutersStone.CREATE_ACTIVITY_ID;
    const changes = [
      DDBEnricherData.ChangeHelper.overrideChange(
        second ? "Change Second Benefit" : "Change Stone Benefit",
        20,
        `system.activities.${activityId}.name`,
      ),
    ];
    if (!second) {
      changes.push(DDBEnricherData.ChangeHelper.overrideChange("[]", 20, `system.activities.${activityId}.consumption.targets`));
    }
    return {
      name: `Stone Benefit: ${benefit.label}`,
      type: "enchant",
      activityMatch: second ? TransmutersStone.SECOND_ACTIVITY_NAME : TransmutersStone.CREATE_ACTIVITY_NAME,
      options: {
        description: `<p>${benefit.text}</p>`,
      },
      changes,
      data: {
        _id: TransmutersStone.enchantmentId(benefit, second),
        flags: {
          ddbimporter: {
            effectRiders: [TransmutersStone.riderId(benefit)],
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) return [];
    const benefits = this.benefits;
    const hints = benefits.map((benefit) => this.riderHint(benefit));
    hints.push(...benefits.map((benefit) => this.enchantmentHint(benefit, { second: false })));
    if (this.hasPotentStone) {
      hints.push(...benefits.map((benefit) => this.enchantmentHint(benefit, { second: true })));
    }
    return hints;
  }

  override get override(): IDDBOverrideData {
    if (this.is2014) return {};
    const second = this.hasPotentStone
      ? ` <em>${TransmutersStone.SECOND_ACTIVITY_NAME}</em> holds the second benefit Potent Stone allows and never spends the use.`
      : "";
    return {
      retainUseSpent: true,
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
      ignoredConsumptionActivities: [TransmutersStone.SECOND_ACTIVITY_NAME],
      descriptionSuffix: `<p><em>${TransmutersStone.CREATE_ACTIVITY_NAME}</em> spends the daily use and applies the chosen benefit to the bearer. While a stone exists the activity becomes <em>Change Stone Benefit</em> and costs nothing: pick a different benefit to swap it, or the same benefit to end the stone.${second}</p>`,
    };
  }

}
