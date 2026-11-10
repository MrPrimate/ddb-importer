import DDBEnricherData from "../../data/DDBEnricherData";
import { runesFor, type TRune } from "./_Runes";

/**
 * Runic Mastery (Oath of the Ebon Blade, World of Warcraft Death Knight): once per Long Rest, the
 * inscribed rune's power: Blood is a Reaction reducing an ally's damage by the Paladin levels (the
 * paladin then loses as many Hit Points), Frost replaces an attack with a 30 ft Cone Dex save for
 * 8d6 Cold, Unholy makes a Summon Undead casting concentration free (described only).
 */
export default class RunicMastery extends DDBEnricherData {

  get runes(): TRune[] {
    return runesFor({
      names: [
        ...(this.ddbParser._chosen ?? []).map((choice) => choice.label),
        this.data.name,
        this.ddbParser.originalName,
      ],
      html: this.ddbParser.ddbDefinition?.description,
      subclassName: this.ddbParser.subKlass,
    });
  }

  get levels(): string {
    return `@classes.${this.classIdentifier("Paladin")}.levels`;
  }

  // every option is its own activity, so the feature builds no default one
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  #activities(rune: TRune): IDDBAdditionalActivity[] {
    const overrides = { addItemConsume: true };
    if (rune === "Blood") {
      return [
        {
          init: { name: "Runic Mastery: Blood", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
          build: {
            generateActivation: true,
            generateTarget: true,
            generateConsumption: false,
            activationOverride: {
              type: "reaction",
              value: 1,
              condition: `A creature hits another creature you can see within 10 feet of you; reduce its damage by your levels`,
            },
            targetOverride: { override: true, affects: { count: "1", type: "ally" } },
          },
          overrides,
        },
        {
          init: { name: "Runic Mastery: Blood (Hit Points Lost)", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
          build: {
            generateActivation: true,
            generateTarget: true,
            generateDamage: true,
            generateConsumption: false,
            activationOverride: { type: "special", value: 1, condition: "After the Blood reaction" },
            targetOverride: { override: true, affects: { type: "self" } },
            damageParts: [DDBEnricherData.basicDamagePart({ customFormula: this.levels, types: [] })],
          },
        },
      ];
    } else if (rune === "Frost") {
      return [
        {
          init: { name: "Runic Mastery: Frost", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
          build: {
            generateActivation: true,
            generateTarget: true,
            generateDamage: true,
            generateSave: true,
            generateConsumption: false,
            activationOverride: { type: "special", value: 1, condition: "Replace one attack of the Attack action" },
            targetOverride: {
              override: true,
              affects: { type: "creature" },
              template: { contiguous: false, type: "cone", size: "30", units: "ft" },
            },
            saveOverride: { ability: ["dex"], dc: { calculation: "spellcasting", formula: "" } },
            onSave: "half",
            damageParts: [DDBEnricherData.basicDamagePart({ number: 8, denomination: 6, types: ["cold"] })],
          },
          overrides,
        },
      ];
    }
    return [
      {
        init: { name: "Runic Mastery: Unholy", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: 1, condition: "You cast Summon Undead" },
          targetOverride: { override: true, affects: { type: "self" } },
        },
        overrides,
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.runes.flatMap((rune) => this.#activities(rune));
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
