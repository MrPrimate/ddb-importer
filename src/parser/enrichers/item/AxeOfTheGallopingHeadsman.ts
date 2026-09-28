import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";

/**
 * Axe of the Galloping Headsman: +1 Rare, +2 Very Rare, +3 Legendary, each tier adding properties.
 *
 * - Fiery Smite (all): an extra 1d6 fire on every hit, 1d10 against a creature that damaged the
 *   wielder since the end of their last turn; the larger die is a second attack mode.
 * - Mark of Guilt and Sense Guilt (Very Rare+): a mark on a hit, and a bonus action Charisma save
 *   at DC 16 + the axe's bonus.
 * - Dark Binding and Executioner's Blade (Legendary): a Strength save for Paralyzed and Prone after
 *   a hit, and on any critical hit an extra 3d6 fire plus a Constitution save to survive at 20 or
 *   fewer hit points. The 19-20 critical range applies only against a prone target, which core
 *   dnd5e cannot condition, so it is an AC5e flag scoped to this axe.
 *
 * The parser builds the extra dice as "Restricted Attack" modes, reads the legendary paragraphs
 * as sections that roll the critical damage on the save, and links an auto Paralyzed status to
 * every activity; this replaces all of it.
 */
export default class AxeOfTheGallopingHeadsman extends DDBEnricherData {

  static DARK_BINDING = "Dark Binding";

  static MARK = "Mark of Guilt";

  /** The magic bonus values DDB grants this record; the "Varies" record carries all three. */
  get bonuses(): number[] {
    const modifiers = (foundry.utils.getProperty(this.ddbParser.ddbDefinition, "grantedModifiers") as IDDBModifier[] | undefined) ?? [];
    const values = modifiers
      .filter((mod) => mod.type === "bonus" && mod.subType === "magic" && Number.isInteger(mod.value))
      .map((mod) => Number(mod.value));
    return [...new Set(values)].sort((a, b) => a - b);
  }

  /** The tier this record is built at: its own bonus, or the lowest on the "Varies" record. */
  get bonus(): number {
    return this.bonuses[0] ?? 1;
  }

  get isVaries(): boolean {
    return this.bonuses.length > 1;
  }

  /** The dnd5e identifier the parser gives this record, which the AC5e condition matches. */
  get axeIdentifier(): string {
    return utils.referenceNameString(`${this.ddbParser.originalName}`.toLowerCase());
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      noeffect: true,
      data: {
        damage: {
          includeBase: true,
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["fire"] })],
        },
      },
    };
  }

  get creatureTarget(): IDDBActivityBuild["targetOverride"] {
    return {
      override: true,
      affects: { count: "1", type: "creature" },
      template: {},
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [
      {
        init: {
          name: "Fiery Smite (1d10)",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateRange: true,
          generateTarget: true,
          generateConsumption: false,
          includeBaseDamage: true,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 10, types: ["fire"] })],
        },
        overrides: {
          noeffect: true,
          activationCondition: "Against a creature that damaged you since the end of your last turn",
        },
      },
    ];

    if (this.bonus >= 2) {
      activities.push(
        {
          init: {
            name: AxeOfTheGallopingHeadsman.MARK,
            type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
          },
          build: {
            generateActivation: true,
            generateConsumption: false,
            generateTarget: true,
            activationOverride: {
              type: "special",
              value: null,
              condition: "When you hit a creature with the axe (no action required)",
            },
            targetOverride: this.creatureTarget,
          },
          overrides: {
            noConsumeTargets: true,
            noTemplate: true,
            data: {
              duration: {
                value: "",
                units: "spec",
                special: "Until the property is used again, the target dies, or it leaves the plane",
              },
            },
          },
        },
        {
          init: {
            name: "Sense Guilt",
            type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
          },
          build: {
            generateSave: true,
            generateDamage: false,
            generateActivation: true,
            generateConsumption: false,
            generateTarget: true,
            saveOverride: { ability: ["cha"], dc: { calculation: "", formula: `${16 + this.bonus}` } },
            activationOverride: {
              type: "bonus",
              value: 1,
              condition: "Hold the blade to a creature's neck; on a failure you learn something it feels guilty about. Immune for 24 hours after.",
            },
            targetOverride: this.creatureTarget,
          },
          overrides: {
            noConsumeTargets: true,
            noeffect: true,
            noTemplate: true,
          },
        },
      );
    }

    if (this.bonus >= 3) {
      activities.push(
        {
          init: {
            name: AxeOfTheGallopingHeadsman.DARK_BINDING,
            type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
          },
          build: {
            generateSave: true,
            generateDamage: false,
            generateActivation: true,
            generateConsumption: false,
            generateTarget: true,
            saveOverride: { ability: ["str"], dc: { calculation: "", formula: "19" } },
            activationOverride: {
              type: "bonus",
              value: 1,
              condition: "Once during your turn, immediately after you hit a creature with the axe",
            },
            targetOverride: this.creatureTarget,
          },
          overrides: {
            noConsumeTargets: true,
            noTemplate: true,
          },
        },
        {
          init: {
            name: "Executioner's Blade Damage",
            type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
          },
          build: {
            generateDamage: true,
            generateActivation: true,
            generateConsumption: false,
            generateTarget: true,
            damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["fire"] })],
            activationOverride: {
              type: "special",
              value: null,
              condition: "On a Critical Hit with the axe",
            },
            targetOverride: this.creatureTarget,
          },
          overrides: {
            noConsumeTargets: true,
            noeffect: true,
            noTemplate: true,
          },
        },
        {
          init: {
            name: "Executioner's Blade Save",
            type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
          },
          build: {
            generateSave: true,
            generateDamage: false,
            generateActivation: true,
            generateConsumption: false,
            generateTarget: true,
            saveOverride: { ability: ["con"], dc: { calculation: "", formula: "10" } },
            activationOverride: {
              type: "special",
              value: null,
              condition: "The Critical Hit left the creature with 20 or fewer Hit Points; on a failure it dies",
            },
            targetOverride: this.creatureTarget,
          },
          overrides: {
            noConsumeTargets: true,
            noeffect: true,
            noTemplate: true,
          },
        },
      );
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    const effects: IDDBEffectHint[] = [];
    if (this.bonus >= 2) {
      effects.push({
        name: "Mark of Guilt",
        activityMatch: AxeOfTheGallopingHeadsman.MARK,
        options: {
          transfer: false,
          durationSeconds: null,
          description: "Marked for punishment: the axe's wielder knows your direction and distance, and your destination plane if you leave this one.",
        },
      });
    }
    if (this.bonus >= 3) {
      effects.push(
        {
          name: "Dark Binding",
          activityMatch: AxeOfTheGallopingHeadsman.DARK_BINDING,
          statuses: ["Paralyzed", "Prone"],
          options: {
            transfer: false,
            expiry: "sourceStart",
            description: "Paralyzed and Prone until the start of the axe wielder's next turn.",
          },
        },
        {
          name: "Executioner's Blade",
          ac5eOnly: true,
          options: {
            transfer: true,
            description: "The axe scores a Critical Hit on a 19 or 20 against a Prone creature.",
          },
          ac5eChanges: [
            DDBEnricherData.ChangeHelper.ac5eChange(
              `set=19; opponentActor.statuses.prone && item.identifier === '${this.axeIdentifier}'`,
              20,
              "flags.automated-conditions-5e.attack.criticalThreshold",
            ),
          ],
        },
      );
    }
    return effects;
  }

  override get override(): IDDBOverrideData {
    if (!this.isVaries) return {};
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbGallopingHeadsman">
<p><strong>Implementation Details</strong></p>
<p>This is the "Varies" record, so it is built at the Rare tier (+${this.bonus}, Fiery Smite only). Import the Very Rare or Legendary version for Mark of Guilt, Sense Guilt, Dark Binding and Executioner's Blade.</p>
</section>`,
    };
  }

}
