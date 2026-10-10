import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";
import { itemActivity, itemCast, itemProperty } from "./_ItemActivities";

type TPrecipitState = "Gas" | "Liquid" | "Solid";

interface IPrecipitStateData {
  /** the benefits while holding the staff in this state, as a transferring effect */
  changes: IActiveEffectChangeData[];
  description: string;
  /** spell name and charge cost */
  spells: [string, number][];
  /** the spells' printed attack bonus, when the state lists one */
  spellAttack?: number;
  /** the state's own activated properties */
  activities: IDDBAdditionalActivity[];
}

/**
 * Precipit, the Formless: a staff of 15 charges whose water takes a Gas, Liquid or Solid state.
 * Each state grants its own resistances and movement, its own spells (save DC 18) and a command
 * word action, so a state is a profile of one "State Change" self-enchantment: its benefits are an
 * effect rider and its spells and actions are activity riders, which dnd5e only adds to the staff
 * while that profile is applied. Choosing another profile swaps the state; choosing the current one
 * ends it. The Reaction version (1 charge) forwards to the same activity.
 *
 * DDB ships a copy per state beside the base item. Every copy imports as the same staff; on a
 * character import the copies take the base name, a state copy arrives in its state (while
 * equipped and attuned) and only one copy is kept (STATE_COPIES in parser/character/inventory.ts).
 * Munched copies keep DDB's names, as the compendium matches items by name, type and ruleset.
 *
 * Not automated: water breathing, moving through creatures and Disadvantage on Opportunity
 * Attacks (Gas), walking on liquid (Liquid), halved pushes and the temporary hit points vanishing
 * on a state change (Solid). Ray of Frost's 1 charge level 5 cast is an attack of its own
 * (rayOfFrostLevelFive).
 */
export default class PrecipitTheFormless extends DDBEnricherData {

  static BASE_NAME = "Precipit, the Formless";

  static STATE_CHANGE = "State Change";

  static STATE_CHANGE_ID = utils.namedIDStub(PrecipitTheFormless.STATE_CHANGE, { prefix: "ddbItem" });

  static STATES: TPrecipitState[] = ["Gas", "Liquid", "Solid"];

  static DC = 18;

  /** The enchantment profile that puts the staff in a state. */
  static profileId(state: TPrecipitState): string {
    return utils.namedIDStub(`Precipit ${state}`, { prefix: "ench", postfix: "ef" });
  }

  /** The transferring effect, a rider of the state's profile, that grants the state's benefits. */
  static stateEffectId(state: TPrecipitState): string {
    return utils.namedIDStub(`Precipit ${state} State`, { prefix: "ddb" });
  }

  /** The state of DDB's per-state copy, null for the base item. */
  get copyState(): TPrecipitState | null {
    const match = utils.nameString(this.name ?? "").match(/\((Gas|Liquid|Solid)\)$/);
    return match ? match[1] as TPrecipitState : null;
  }

  /** "Speed equal to your Speed": the walking speed before dnd5e adds the movement bonus. */
  get walkSpeed(): string {
    return `${DDBEnricherData.AutoEffects.effectModules().daeInstalled ? "##" : "@"}attributes.movement.walk`;
  }

  get states(): Record<TPrecipitState, IPrecipitStateData> {
    const helper = DDBEnricherData.ChangeHelper;
    return {
      Gas: {
        changes: [
          helper.damageResistanceChange("bludgeoning"),
          helper.damageResistanceChange("piercing"),
          // dnd5e adds the movement bonus to every speed after they resolve, the fly speed included
          helper.movementBonusChange("10"),
          helper.upgradeChange(this.walkSpeed, 5, "system.attributes.movement.fly"),
        ],
        description: "Resistance to Bludgeoning and Piercing damage, +10 ft Speed and a Fly Speed equal to your Speed. You can move through any creature's space, and Opportunity Attacks against you have Disadvantage.",
        spells: [["Cloudkill", 5], ["Fog Cloud", 1], ["Gaseous Form", 3], ["Misty Step", 2], ["Wind Walk", 6]],
        activities: [
          itemProperty("Tailwind", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
            activationType: "action",
            condition: "Command word. Until the end of your next turn, you and your allies within 30 feet can take the Dash action as a Bonus Action and don't provoke Opportunity Attacks by moving",
            template: { type: "radius", size: "30" },
            range: { value: null, units: "self" },
            charges: "2",
            noeffect: true,
          }),
        ],
      },
      Liquid: {
        changes: [
          helper.damageResistanceChange("bludgeoning"),
          helper.damageResistanceChange("slashing"),
          helper.movementBonusChange("10"),
          helper.upgradeChange(this.walkSpeed, 5, "system.attributes.movement.swim"),
        ],
        description: "Resistance to Bludgeoning and Slashing damage, +10 ft Speed and a Swim Speed equal to your Speed. You can stand on and move across any liquid surface.",
        spells: [["Blur", 2], ["Control Water", 4], ["Create or Destroy Water", 1], ["Mirror Image", 2], ["Water Breathing", 3]],
        activities: [
          itemProperty("Tide Turner", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
            save: { ability: ["str"], formula: `${PrecipitTheFormless.DC}` },
            damageParts: [DDBEnricherData.basicDamagePart({ number: 4, denomination: 8, types: ["bludgeoning"] })],
            onSave: "half",
            activationType: "action",
            condition: "Command word. Each enemy of your choice you can see within 30 feet; on a failed save it is also pushed 20 feet toward or away from you",
            template: { type: "radius", size: "30" },
            range: { value: null, units: "self" },
            charges: "3",
            noeffect: true,
          }),
          itemProperty("Redirect Attack", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
            activationType: "reaction",
            condition: "An enemy you can see misses you with a melee attack roll: it repeats the attack against another creature of your choice (other than itself)",
            noeffect: true,
          }),
        ],
      },
      Solid: {
        changes: [
          helper.damageResistanceChange("piercing"),
          helper.damageResistanceChange("slashing"),
          helper.addChange("3", 20, "system.attributes.ac.bonus"),
          ...helper.speedCapChanges(5, 50, ["walk"]),
        ],
        description: "Resistance to Piercing and Slashing damage, +3 to Armor Class and a Speed of 5 feet. Pushes against your will are halved, and you gain 10 Temporary Hit Points at the start of each of your turns, which vanish if the staff changes state.",
        spells: [["Cone of Cold", 5], ["Ice Storm", 4], ["Ray of Frost", 0], ["Wall of Ice", 6]],
        spellAttack: 10,
        activities: [
          itemProperty("Deep Freeze", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
            save: { ability: ["con"], formula: `${PrecipitTheFormless.DC}` },
            damageParts: [DDBEnricherData.basicDamagePart({ number: 4, denomination: 8, types: ["cold"] })],
            onSave: "half",
            activationType: "action",
            condition: "Command word. Enemies of your choice you can see within 30 feet",
            template: { type: "radius", size: "30" },
            range: { value: null, units: "self" },
            charges: "4",
          }),
          this.rayOfFrostLevelFive,
          this.frozenShell,
        ],
      },
    };
  }

  static RAY_LEVEL_FIVE = "Ray of Frost (Level 5)";

  /**
   * Ray of Frost cast at level 5 for 1 charge. dnd5e scales a cantrip by the caster's character
   * level whatever level a cast activity asks for, so the level 5 ray is its own attack: the
   * staff's +10, 2d8 cold and the Speed reduction. From character level 5 the free cast matches it.
   */
  get rayOfFrostLevelFive(): IDDBAdditionalActivity {
    return itemActivity(PrecipitTheFormless.RAY_LEVEL_FIVE, DDBEnricherData.ACTIVITY_TYPES.ATTACK, {
      noeffect: false,
      addItemConsume: true,
      itemConsumeValue: "1",
      noConsumeTargets: false,
      data: {
        attack: { bonus: "10", flat: true, type: { value: "ranged", classification: "spell" } },
        damage: { includeBase: false, parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["cold"] })] },
      },
    }, {
      activationOverride: { type: "action", value: 1, condition: "" },
      rangeOverride: { value: "60", units: "ft" },
      targetOverride: { affects: { type: "creature", count: "1", choice: false }, template: { type: "" } },
      generateDuration: true,
      durationOverride: { override: true, value: "", units: "inst" },
    });
  }

  get frozenShell(): IDDBAdditionalActivity {
    const shell = itemProperty("Frozen Shell", DDBEnricherData.ACTIVITY_TYPES.HEAL, {
      activationType: "turnStart",
      condition: "The start of each of your turns. The Temporary Hit Points vanish if the staff changes state",
      selfTarget: true,
      noeffect: true,
    });
    return {
      ...shell,
      build: {
        ...shell.build,
        generateHealing: true,
        healingPart: DDBEnricherData.basicDamagePart({ bonus: "10", types: ["temphp"] }),
      },
    };
  }

  /** The state's spells and actions, which exist on the staff only while it is in that state. */
  stateActivities(state: TPrecipitState): IDDBAdditionalActivity[] {
    const data = this.states[state];
    return [
      ...data.spells.map(([spell, charges]) => itemCast(spell, { charges, dc: PrecipitTheFormless.DC, attack: data.spellAttack })),
      ...data.activities,
    ];
  }

  override get activity(): IDDBActivityData {
    return {
      // the parser stubs the id from the copy's name; one id keeps every copy the same staff
      id: utils.namedIDStub("Precipit", { prefix: "attack" }),
    };
  }

  // DDB's damage modifiers on the Liquid and Solid copies would otherwise become extra saves
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  // each copy carries only its own state's modifiers, so every effect is declared here instead
  override get clearAutoEffects(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity(PrecipitTheFormless.STATE_CHANGE, DDBEnricherData.ACTIVITY_TYPES.ENCHANT, {
        noeffect: false,
        activationType: "bonus",
        activationCondition: "Choose Gas, Liquid or Solid; choosing the current state ends it",
        data: {
          enchant: { self: true },
          restrictions: { type: "weapon", allowMagical: true },
          // an applied effect with no expiry inherits the activity's duration; a state lasts until changed
          duration: { value: "", units: "spec", special: "Until the staff changes state" },
        },
      }),
      itemActivity("State Change (Reaction)", DDBEnricherData.ACTIVITY_TYPES.FORWARD, {
        activationType: "reaction",
        activationCondition: "You are targeted by an attack or spell, before you know the result of the roll",
        noConsumeTargets: false,
        addItemConsume: true,
        itemConsumeValue: "1",
        data: {
          activity: { id: PrecipitTheFormless.STATE_CHANGE_ID },
        },
      }),
      ...PrecipitTheFormless.STATES.flatMap((state) => this.stateActivities(state)),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const profiles: IDDBEffectHint[] = PrecipitTheFormless.STATES.map((state) => ({
      name: `${PrecipitTheFormless.BASE_NAME}: ${state}`,
      type: "enchant",
      activityMatch: PrecipitTheFormless.STATE_CHANGE,
      changes: [
        // a munched copy keeps DDB's name ("... (Gas)"), which a "{} (Solid)" suffix would add to
        DDBEnricherData.ChangeHelper.overrideChange(
          this.ddbParser.isMuncher ? `${PrecipitTheFormless.BASE_NAME} (${state})` : `{} (${state})`, 20, "name",
        ),
        // State Change is the staff's only enchant activity: another state swaps, this one ends it
        DDBEnricherData.ChangeHelper.overrideChange(`Change or End ${state} State`, 20, "activities[enchant].name"),
      ],
      options: {
        showIcon: true,
        // the description's "100 years" would otherwise become the duration
        durationSeconds: null,
        description: `The staff is in its ${state.toLowerCase()} state.`,
      },
      data: {
        _id: PrecipitTheFormless.profileId(state),
        flags: {
          ddbimporter: {
            effectIdLevel: { min: null, max: null },
            activityRiders: this.stateActivities(state).map((activity) => activity.init?.id).filter((id): id is string => !!id),
            effectRiders: [PrecipitTheFormless.stateEffectId(state)],
          },
        },
      },
    }));
    const states: IDDBEffectHint[] = PrecipitTheFormless.STATES.map((state) => ({
      // a rider of the state's profile: dnd5e suppresses it here and creates a live copy with the
      // enchantment
      name: `${PrecipitTheFormless.BASE_NAME}: ${state} State`,
      options: {
        transfer: true,
        durationSeconds: null,
        description: this.states[state].description,
      },
      data: {
        _id: PrecipitTheFormless.stateEffectId(state),
      },
      changes: this.states[state].changes,
    }));
    return [
      ...profiles,
      ...states,
      {
        name: PrecipitTheFormless.BASE_NAME,
        options: {
          transfer: true,
          durationSeconds: null,
          description: "While attuned you can breathe underwater and ignore the drawbacks of a deep underwater environment, and while holding the staff you have Resistance to Cold damage.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("cold"),
        ],
      },
      {
        name: "Ray of Frost: Chilled",
        activityMatch: PrecipitTheFormless.RAY_LEVEL_FIVE,
        options: {
          transfer: false,
          expiry: "sourceStart",
          description: "Speed reduced by 10 feet until the start of the caster's next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("-10"),
        ],
      },
      {
        name: "Deep Freeze: Frozen",
        activityMatch: "Deep Freeze",
        options: {
          transfer: false,
          expiry: "targetEnd",
          description: "Speed 0 until the end of your next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 20, "system.attributes.movement.all"),
        ],
      },
      {
        name: "Deep Freeze: Slowed",
        activityMatch: "Deep Freeze",
        onSave: true,
        options: {
          transfer: false,
          expiry: "targetEnd",
          description: "Speed halved until the end of your next turn (a successful save).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange("/2", 20, "system.attributes.movement.all"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const state = this.copyState;
    // linkSelectedEnchantments only applies this while the staff is equipped and attuned
    const flags: IDDBImporterFlags = state && !this.ddbParser.isMuncher
      ? {
        transferEnchantment: {
          targetItemId: "self",
          effectId: PrecipitTheFormless.profileId(state),
          activityId: PrecipitTheFormless.STATE_CHANGE_ID,
        },
      }
      : {};
    return {
      data: {
        ...(this.ddbParser.isMuncher ? {} : { name: PrecipitTheFormless.BASE_NAME }),
        flags: {
          ddbimporter: flags,
        },
      },
    };
  }

}
