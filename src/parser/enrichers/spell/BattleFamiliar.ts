import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The companion factory builds the Brute, Flyer and Stalker stat blocks and the summon activity.
 * Casting while you have a Find Familiar familiar empowers it instead: it takes the Battle
 * Familiar statistics but keeps its creature type and Hit Points, gaining the battle familiar's Hit
 * Points as Temporary Hit Points. That is the Empower Familiar transform onto the same stored stat
 * blocks.
 *
 * The stored stat blocks hold the base values; a summon adds the spell-level parts as it places the
 * creature, but a transform never runs that step and dnd5e reads its temp HP and minimum AC
 * formulas with only the familiar's and the stat block's roll data. So the cast carries the "Spell
 * Level" effect as a cast-level rider: the CastLevelRider enhancer applies it to the targeted
 * familiar with the cast level baked in. It records the level as a flag the transform formulas
 * read, and adds the level to Rend's damage through AC5e (dnd5e 5.x cannot scope a damage bonus to
 * one item, and an actor-wide melee bonus would reach the familiar's own attacks; without AC5e Rend
 * misses the level). Without the effect (enhancer off, nothing targeted) the flag resolves to 0 and
 * the base values apply. The effect is inert on the familiar's own form, so it does no harm if it
 * outlasts the transformation. It links to no activity: the enhancer applies it, so the chat tray
 * does not offer it a second time.
 */
export default class BattleFamiliar extends DDBEnricherData {

  static TRANSFORM_ID = "ddbBattleFamTrns";

  static RIDER_EFFECT_NAME = "Battle Familiar: Spell Level";

  static LEVEL_FLAG = "flags.ddbimporter.battleFamiliarLevel";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          id: BattleFamiliar.TRANSFORM_ID,
          name: "Empower Familiar",
          type: DDBEnricherData.ACTIVITY_TYPES.TRANSFORM,
        },
        build: {
          generateDuration: true,
          durationOverride: { value: "1", units: "hour", concentration: false },
          generateTarget: true,
          generateRange: true,
          rangeOverride: { units: "any" },
          targetOverride: {
            override: true,
            affects: { count: "1", type: "creature", choice: false, special: "Your familiar from Find Familiar" },
            template: {},
          },
        },
        overrides: {
          activationCondition: "Target your familiar from Find Familiar when casting, then select it to Transform",
          data: {
            flags: {
              ddbimporter: {
                castLevelRider: BattleFamiliar.RIDER_EFFECT_NAME,
              },
            },
            transform: {
              customize: true,
              mode: "",
              preset: "polymorph",
            },
            settings: {
              effects: ["origin", "otherOrigin", "spell"],
              keep: ["bio", "type", "hp"],
              // the stat blocks give 5 extra Hit Points per spell level above 2nd and add the spell
              // level to AC; max() keeps a missing flag (no rider applied) at the base values
              tempFormula: `@source.attributes.hp.max + 5 * max(0, @${BattleFamiliar.LEVEL_FLAG} - 2)`,
              minimumAC: `@source.attributes.ac.value + @${BattleFamiliar.LEVEL_FLAG}`,
              preset: "polymorph",
              transformTokens: true,
            },
            profiles: [],
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: BattleFamiliar.RIDER_EFFECT_NAME,
        options: {
          durationSeconds: 3600,
          description: "Carries the Battle Familiar spell level into Empower Familiar: extra Temporary Hit Points and AC on the transformation, and the spell level added to Rend damage.",
        },
        data: {
          flags: {
            ddbimporter: {
              noeffect: true,
            },
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("@item.level", 20, BattleFamiliar.LEVEL_FLAG),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=@item.level; item.identifier === 'rend'",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbBattleFamiliar">
<p><strong>Implementation Details</strong></p>
<p>Use Summon to conjure a new battle familiar. If you already have a familiar from Find Familiar, use Empower Familiar instead: its Transform button turns your familiar into the chosen Battle Familiar form, keeping its creature type and Hit Points and giving it the form's Hit Points as Temporary Hit Points.</p>
<p>Target your familiar when you cast Empower Familiar. The cast then applies the ${BattleFamiliar.RIDER_EFFECT_NAME} effect to it, which carries the spell level into the transformation: the extra Temporary Hit Points for a higher-level slot, the spell level added to AC, and the spell level added to Rend damage. If the familiar is not targeted on cast, the transformation uses the 2nd level values. Select the familiar's token before pressing Transform.</p>
<p>The effect is applied by the "Apply Spell Level Effects to Targets When Casting" enhancer, which needs an active GM for familiars you do not own.</p>
</section>`,
    };
  }

  /** The stored stat blocks are only known once the summon activity has its profiles. */
  override async cleanup(): Promise<void> {
    const activities = (this.data?.system?.activities ?? {}) as Record<string, I5eActivity>;
    const summon = Object.values(activities).find((a): a is I5eSummonActivity => a.type === "summon");
    const transform = Object.values(activities).find((a): a is I5eTransformActivity => a.type === "transform");
    if (!summon || !transform) return;
    transform.profiles = (summon.profiles ?? [])
      .filter((profile) => profile.uuid)
      .map((profile) => ({
        _id: foundry.utils.randomID(),
        name: profile.name,
        uuid: profile.uuid,
        cr: "",
        level: { min: null, max: null },
        sizes: [],
        types: [],
        movement: [],
      }));
  }

}
