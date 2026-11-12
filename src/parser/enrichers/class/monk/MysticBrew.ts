import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Mystic Brew (Warrior of Mystic Brews, World of Warcraft; the WoW Monk's Brewmaster): a magical
 * beverage brewed at the end of a rest, lasting an hour (8 with a Focus Point). Each beverage is an
 * activity: Cinnamon Dragon (30 ft Cone, Dex save, four Martial Arts dice of Fire and Poisoned),
 * Heavenly Spirit (Resistance to two of Cold, Necrotic, Psychic, Radiant: one effect per type, pick
 * two), Refreshing Dip (a Martial Arts die of extra healing, Wis mod + half the Monk levels per brew),
 * and with Wizened Brewer (level 11) Blue Lightning, Drunkard's Luck and Stumbling Monk. DDB models the
 * beverages as a choice; the options are modelled here, so no option documents are built.
 */
export default class MysticBrew extends DDBEnricherData {

  static WIZENED_EFFECTS: IDDBEffectHint[] = [
    {
      name: "Blue Lightning",
      activityMatch: "Blue Lightning",
      options: {
        durationSeconds: 3600,
        description: "Whenever you take a Reaction that isn't an Opportunity Attack or a spell, you can make one Unarmed Strike as part of it.",
      },
    },
    {
      name: "Drunkard's Luck",
      activityMatch: "Drunkard's Luck",
      options: {
        durationSeconds: 3600,
        description: "You gain Heroic Inspiration if you lack it, and can give it to yourself when you make an ability check or saving throw without it.",
      },
    },
    {
      name: "Stumbling Monk",
      activityMatch: "Stumbling Monk",
      options: {
        durationSeconds: 3600,
        description: "When you take a Bonus Action other than Patient Defense, you can also use Patient Defense immediately after it.",
      },
    },
  ];

  get #die(): string {
    return `@scale.${this.classIdentifier("Monk")}.die`;
  }

  override get noChoiceBuild(): boolean {
    return true;
  }

  // the text's "Poisoned" belongs to Cinnamon Dragon's own effect
  override get clearAutoEffects(): boolean {
    return true;
  }

  get hasWizenedBrewer(): boolean {
    return this.hasClassFeature({ featureName: "Wizened Brewer" });
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Brew",
      activationType: "shortRest",
      activationCondition: "You finish a Short or Long Rest holding Brewer's Supplies",
      targetType: "self",
      noConsumeTargets: true,
    };
  }

  #wizenedBeverage(name: string): IDDBAdditionalActivity {
    return {
      init: { name, type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
      build: {
        generateActivation: true,
        generateTarget: true,
        generateConsumption: false,
        activationOverride: { type: "special", value: 1, condition: "You drink the beverage" },
        targetOverride: { override: true, affects: { type: "self" } },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const wizened = this.hasWizenedBrewer
      ? ["Blue Lightning", "Drunkard's Luck", "Stumbling Monk"].map((name) => this.#wizenedBeverage(name))
      : [];
    return [
      {
        init: { name: "Enhance Beverage", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: 1, condition: "You create a magical beverage" },
          targetOverride: { override: true, affects: { type: "self" } },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: "Monk's Focus",
        },
      },
      {
        init: { name: "Cinnamon Dragon", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateDamage: true,
          generateSave: true,
          generateConsumption: false,
          activationOverride: { type: "action", value: 1, condition: "" },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, type: "cone", size: "30", units: "ft" },
          },
          saveOverride: { ability: ["dex"], dc: { calculation: "wis", formula: "" } },
          onSave: "half",
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: `4${this.#die}.die`, types: ["fire"] })],
        },
      },
      {
        init: { name: "Heavenly Spirit", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: 1, condition: "You drink the beverage; choose two damage types" },
          targetOverride: { override: true, affects: { type: "self" } },
        },
        overrides: {
          // four alternative resistance effects; Midi applies only the ones picked
          data: { midiProperties: { chooseEffects: true } },
        },
      },
      {
        init: { name: "Refreshing Dip", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: 1, condition: "You regain Hit Points" },
          targetOverride: { override: true, affects: { type: "self" } },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: `1${this.#die}.die`, types: ["healing"] }),
        },
        overrides: {
          addActivityConsume: true,
          data: {
            uses: {
              spent: 0,
              max: `@abilities.wis.mod + floor(@classes.${this.classIdentifier("Monk")}.levels / 2)`,
              recovery: [
                { period: "sr", type: "recoverAll", formula: "" },
                { period: "lr", type: "recoverAll", formula: "" },
              ],
            },
          },
        },
      },
      ...wizened,
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Cinnamon Dragon: Poisoned",
        activityMatch: "Cinnamon Dragon",
        statuses: ["Poisoned"],
        options: { transfer: false, expiry: "targetEnd" },
      },
      ...["Cold", "Necrotic", "Psychic", "Radiant"].map((damage) => ({
        name: `Heavenly Spirit: ${damage}`,
        activityMatch: "Heavenly Spirit",
        options: { durationSeconds: 3600 },
        changes: [DDBEnricherData.ChangeHelper.damageResistanceChange(damage.toLowerCase())],
      })),
      ...(this.hasWizenedBrewer ? MysticBrew.WIZENED_EFFECTS : []),
    ];
  }

}
