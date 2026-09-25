import DDBEnricherData from "../data/DDBEnricherData";

export default class BellOfTheDuskMother extends DDBEnricherData {

  /** the spell-save-dc bonus values DDB grants this record, ascending */
  get bonuses(): number[] {
    const modifiers = (foundry.utils.getProperty(this.ddbParser.ddbDefinition, "grantedModifiers") as IDDBModifier[] | undefined) ?? [];
    const values = modifiers
      .filter((mod) => mod.type === "bonus" && mod.subType === "spell-save-dc" && Number.isInteger(mod.value))
      .map((mod) => Number(mod.value));
    return [...new Set(values)].sort((a, b) => a - b);
  }

  get bonus(): number {
    return this.bonuses[0] ?? 1;
  }

  get isVeryRare(): boolean {
    return this.bonuses.some((bonus) => bonus >= 2);
  }

  get isLegendary(): boolean {
    return this.bonuses.includes(3);
  }

  static EMANATION_30: Partial<I5eActivityTarget> = {
    override: true,
    affects: {
      count: "",
      type: "creature",
      choice: true,
      special: "",
    },
    template: {
      count: "",
      contiguous: false,
      type: "radius",
      size: "30",
      width: "",
      height: "",
      units: "ft",
    },
  };

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Dolorous Tolling",
      targetType: "creature",
      activationType: "action",
      addActivityConsume: true,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 3, denomination: 10, type: "psychic" }),
      ],
      data: {
        range: {
          override: true,
          value: "",
          units: "self",
        },
        target: BellOfTheDuskMother.EMANATION_30 as I5eActivityTarget,
        damage: {
          onSave: "none",
        },
        save: {
          ability: ["wis"],
          dc: {
            calculation: "",
            formula: `${16 + this.bonus}`,
          },
        },
        uses: {
          spent: 0,
          max: "1",
          recovery: [{ period: "dusk", type: "recoverAll" }],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    if (this.isVeryRare) {
      activities.push({
        init: {
          name: "Call of the Bell",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateDuration: true,
          generateUses: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "Create a doll (Animated Armor stat block) from a 5-foot Cube of wood, clay or stone within 10 feet",
          },
          durationOverride: {
            value: "10",
            units: "minute",
            special: "",
          },
          usesOverride: {
            spent: 0,
            max: "1",
            recovery: [{ period: "dusk", type: "recoverAll" }],
          },
        },
        overrides: {
          targetType: "self",
          noTemplate: true,
          addActivityConsume: true,
        },
      });
    }
    if (this.isLegendary) {
      activities.push({
        init: {
          name: "Death Knell",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: true,
          generateTarget: true,
          generateRange: true,
          generateUses: true,
          includeBaseDamage: false,
          onSave: "half",
          activationOverride: {
            type: "action",
            value: 1,
            condition: "Bloodied creatures only; a creature that fails by 5 or more drops to 0 Hit Points",
          },
          saveOverride: {
            ability: ["con"],
            dc: {
              calculation: "",
              formula: "19",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 5, denomination: 10, type: "necrotic" }),
          ],
          targetOverride: BellOfTheDuskMother.EMANATION_30 as I5eActivityTarget,
          rangeOverride: {
            override: true,
            value: "",
            units: "self",
          },
          usesOverride: {
            spent: 0,
            max: "1",
            recovery: [{ period: "dusk", type: "recoverAll" }],
          },
        },
        overrides: {
          addActivityConsume: true,
        },
      });
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Dolorous Tolling",
        activityMatch: "Dolorous Tolling",
        options: {
          // a wondrous item's effects transfer by default, and a transferring effect never links to an activity
          transfer: false,
          durationSeconds: 60,
          description: "Subtract 1d4 from attack rolls and saving throws for 1 minute.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.mwak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.rwak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.msak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 0, "system.bonuses.rsak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 20, "system.bonuses.abilities.save"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    if (this.bonuses.length < 2) return {};
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbBell">
<p><strong>Implementation Details</strong></p>
<p>This is the "Varies" record, so Dolorous Tolling is built at the Rare tier (DC ${16 + this.bonus}). Raise the save DC by one per rarity tier above Rare.</p>
</section>`,
    };
  }

}
