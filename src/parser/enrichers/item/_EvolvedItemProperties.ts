import { utils } from "../../../lib/_module";
import ChangeHelper from "../effects/ChangeHelper";

/**
 * The Arcana Unleashed "Evolving Magic Items" property tables (Rare, Very Rare and Legendary).
 *
 * Every property is expressed the way dnd5e models an enchantment: a `type: "enchantment"`
 * effect that rewrites the item (name prefix, rarity, magical, attunement, description),
 * optional rider effects that transfer to the wearer for the passive properties, and optional
 * rider activities (spell casts, once-a-day utilities). Three things are built from the one
 * table:
 *
 * - standalone copies of the enchantment and rider effects for the effects compendium;
 * - a host feat per property for the "Effect Items" folder of the items compendium, carrying
 *   an enchant activity whose profile lists the riders, so any item can be evolved with it;
 * - the applied form on a munched "<Property> <Base>" item, whose riders and activities hang
 *   off the enchantment through `flags.dnd5e.dependentOn` and whose origin is the host
 *   activity, exactly as dnd5e's own `applyEnchantment` / `collectRiderEnchantments` leave it.
 */

export type TEvolvedTier = "rare" | "veryRare" | "legendary";

export interface IEvolvedSpell {
  name: string;
  /** Fixed save DC printed with the property; the item is not a spellcaster. */
  dc?: number;
  /** Fixed spell attack bonus (Withering only). */
  attack?: number;
  /** Extra activity description, e.g. Mind Blank's self-only restriction. */
  note?: string;
}

export interface IEvolvedUse {
  /** Activity name, e.g. "Studious: Add 1d6". */
  name: string;
  max: number;
  activation: TActivationCost;
  condition?: string;
  /** Utility roll formula (Amicable / Studious). */
  roll?: string;
  /** Duration of the effect the activity applies (Quickening / Vanishing). */
  durationSeconds?: number;
  concentration?: boolean;
}

export interface IEvolvedProperty {
  name: string;
  tier: TEvolvedTier;
  /** Paraphrase of the rule; `EvolvedItemProperties.text` prefers the proxy-served printed text. */
  text: string;
  /** Property text opens with "While attuned", so the enchantment also requires attunement. */
  attuned?: boolean;
  /** One cast activity per spell, each with its own daily use. */
  spells?: IEvolvedSpell[];
  /** The spells are cast together with one Magic action and share the single daily use (Restorative). */
  sharedSpellUse?: boolean;
  /** A limited-use utility activity. */
  use?: IEvolvedUse;
}

/** A rider activity in raw dnd5e shape, before the enricher or host item wraps it. */
export interface IEvolvedRawActivity {
  id: string;
  name: string;
  type: "cast" | "utility";
  /** Spell name of a cast activity; the caller resolves it to a compendium uuid. */
  spell?: string;
  data: Partial<I5eActivity>;
}

/** Which optional module channels to emit on hand-built effects. */
export interface IEvolvedModules {
  ac5e?: boolean;
  midi?: boolean;
}

const DAWN_RECOVERY = [{ period: "dawn" as TLimitedUsePeriod, type: "recoverAll" }];

const RESISTANT_TYPES = ["acid", "cold", "fire", "lightning", "necrotic", "poison", "psychic", "radiant", "thunder"];

const ABILITIES: Record<string, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

const ENCHANTMENT_IMG = "systems/dnd5e/icons/svg/activity/enchant.svg";

const RIDER_IMG: Record<string, string> = {
  "Vigilant": "icons/svg/eye.svg",
  "All-Seeing": "icons/svg/eye.svg",
  "Psionic": "icons/svg/book.svg",
  "Spellguarding": "icons/svg/aura.svg",
  "Empowering": "icons/svg/upgrade.svg",
  "Resistant": "icons/svg/aura.svg",
  "Quickening": "icons/svg/wing.svg",
  "Vanishing": "icons/svg/invisible.svg",
};

const TIER_LABELS: Record<TEvolvedTier, string> = {
  rare: "Rare",
  veryRare: "Very Rare",
  legendary: "Legendary",
};


function castOnce(spell: string, dc?: number): string {
  return `Cast ${spell}${dc ? ` (save DC ${dc})` : ""} from the item once per dawn.`;
}

function castEach(spells: string, dc?: number): string {
  return `Cast ${spells}${dc ? ` (save DC ${dc})` : ""} from the item, each spell once per dawn.`;
}

export const EVOLVED_PROPERTIES: IEvolvedProperty[] = [
  // Rare
  {
    name: "Amicable",
    tier: "rare",
    text: "Three times per dawn, add 1d6 to a failed ability check made to influence a creature.",
    use: { name: "Amicable: Add 1d6", max: 3, activation: "special", condition: "You fail an ability check made to influence a creature", roll: "1d6" },
  },
  { name: "Conversational", tier: "rare", text: castOnce("Tongues"), spells: [{ name: "Tongues" }] },
  { name: "Crusading", tier: "rare", text: castOnce("Crusader's Mantle"), spells: [{ name: "Crusader's Mantle" }] },
  { name: "Displacing", tier: "rare", text: castOnce("Blur"), spells: [{ name: "Blur" }] },
  { name: "Frightening", tier: "rare", text: castOnce("Fear", 15), spells: [{ name: "Fear", dc: 15 }] },
  { name: "Fulminating", tier: "rare", text: castOnce("Lightning Bolt", 15), spells: [{ name: "Lightning Bolt", dc: 15 }] },
  { name: "Immolating", tier: "rare", text: castOnce("Fireball", 15), spells: [{ name: "Fireball", dc: 15 }] },
  {
    name: "Quickening",
    tier: "rare",
    text: "Once per dawn, as a Bonus Action, double your Speed for 1 minute (Concentration); Opportunity Attacks against you have Disadvantage while it lasts.",
    use: { name: "Quickening: Infuse Velocity", max: 1, activation: "bonus", durationSeconds: 60, concentration: true },
  },
  {
    name: "Restorative",
    tier: "rare",
    text: "Once per dawn, take a Magic action to cast Cure Wounds and Lesser Restoration on the same creature.",
    spells: [{ name: "Cure Wounds" }, { name: "Lesser Restoration" }],
    sharedSpellUse: true,
  },
  { name: "Skulking", tier: "rare", text: castOnce("Pass without Trace"), spells: [{ name: "Pass without Trace" }] },
  {
    name: "Studious",
    tier: "rare",
    text: "Three times per dawn, add 1d6 to a failed ability check made as part of the Study action.",
    use: { name: "Studious: Add 1d6", max: 3, activation: "special", condition: "You fail an ability check made as part of the Study action", roll: "1d6" },
  },
  {
    name: "Vigilant",
    tier: "rare",
    text: "Advantage on Initiative rolls and Wisdom (Perception) checks.",
  },
  // Very Rare
  { name: "Chilling", tier: "veryRare", text: castOnce("Cone of Cold", 17), spells: [{ name: "Cone of Cold", dc: 17 }] },
  { name: "Deceptive", tier: "veryRare", text: castOnce("Mislead", 17), spells: [{ name: "Mislead", dc: 17 }] },
  { name: "Far-Seeing", tier: "veryRare", text: castOnce("Scrying", 17), spells: [{ name: "Scrying", dc: 17 }] },
  {
    name: "Fortunate",
    tier: "veryRare",
    text: "Twice per dawn, reroll a failed D20 Test and use the new roll (requires attunement).",
    attuned: true,
    use: { name: "Fortunate: Reroll", max: 2, activation: "special", condition: "You fail a D20 Test" },
  },
  {
    name: "Lunar",
    tier: "veryRare",
    text: castEach("Fount of Moonlight or Moonbeam", 17),
    spells: [{ name: "Fount of Moonlight", dc: 17 }, { name: "Moonbeam", dc: 17 }],
  },
  { name: "Paralyzing", tier: "veryRare", text: castOnce("Hold Monster", 17), spells: [{ name: "Hold Monster", dc: 17 }] },
  {
    name: "Psionic",
    tier: "veryRare",
    text: "Telepathy with a range of 30 feet; cast Synaptic Static (save DC 17) from the item once per dawn.",
    spells: [{ name: "Synaptic Static", dc: 17 }],
  },
  { name: "Regal", tier: "veryRare", text: castOnce("Yolande's Regal Presence", 17), spells: [{ name: "Yolande's Regal Presence", dc: 17 }] },
  { name: "Resilient", tier: "veryRare", text: castOnce("Otiluke's Resilient Sphere", 17), spells: [{ name: "Otiluke's Resilient Sphere", dc: 17 }] },
  {
    name: "Resistant",
    tier: "veryRare",
    text: "Resistance to one damage type of the DM's choice: acid, cold, fire, lightning, necrotic, poison, psychic, radiant or thunder (requires attunement).",
    attuned: true,
  },
  {
    name: "Traversing",
    tier: "veryRare",
    text: castEach("Dimension Door or Freedom of Movement"),
    spells: [{ name: "Dimension Door" }, { name: "Freedom of Movement" }],
  },
  {
    name: "Withering",
    tier: "veryRare",
    text: "Cast Blight or Vampiric Touch (save DC 17, +9 to hit) from the item, each spell once per dawn.",
    spells: [{ name: "Blight", dc: 17, attack: 9 }, { name: "Vampiric Touch", dc: 17, attack: 9 }],
  },
  // Legendary
  {
    name: "All-Seeing",
    tier: "legendary",
    text: "Truesight with a range of 30 feet (requires attunement).",
    attuned: true,
  },
  {
    name: "Empowering",
    tier: "legendary",
    text: "One ability score of the DM's choice increases by 2, to a maximum of 24 (requires attunement).",
    attuned: true,
  },
  { name: "Gravitational", tier: "legendary", text: castOnce("Reverse Gravity", 18), spells: [{ name: "Reverse Gravity", dc: 18 }] },
  { name: "Heliacal", tier: "legendary", text: castOnce("Sunburst", 18), spells: [{ name: "Sunburst", dc: 18 }] },
  { name: "Prismatic", tier: "legendary", text: castOnce("Prismatic Spray", 18), spells: [{ name: "Prismatic Spray", dc: 18 }] },
  {
    name: "Spellguarding",
    tier: "legendary",
    text: "Advantage on saving throws against spells and other magical effects.",
  },
  { name: "Stupefying", tier: "legendary", text: castOnce("Power Word Stun", 18), spells: [{ name: "Power Word Stun", dc: 18 }] },
  { name: "Subjugating", tier: "legendary", text: castOnce("Dominate Monster", 18), spells: [{ name: "Dominate Monster", dc: 18 }] },
  {
    name: "Tranquil",
    tier: "legendary",
    text: "Cast Mind Blank on yourself from the item once per dawn.",
    spells: [{ name: "Mind Blank", note: "Targeting yourself only." }],
  },
  {
    name: "Vanishing",
    tier: "legendary",
    text: "Once per dawn, take a Magic action to become Invisible for 1 hour or until you end it (no action required).",
    use: { name: "Vanishing: Vanish", max: 1, activation: "action", durationSeconds: 3600 },
  },
];

interface IRiderSpec {
  /** Distinguishes the DM's-choice toggles (damage type, ability). */
  variant?: string;
  label: string;
  description: string;
  changes: IActiveEffectChangeData[];
  midiChanges?: IActiveEffectChangeData[];
  ac5eChanges?: IAC5eActiveEffectChangeData[];
  /** Toggle effects ship disabled; the player enables the one the DM picked. */
  disabled?: boolean;
}

/** An effect a rider activity applies (Quickening's velocity, Vanishing's invisibility). */
interface IActivityEffectSpec {
  activityName: string;
  label: string;
  description: string;
  durationSeconds: number;
  changes: IActiveEffectChangeData[];
  ac5eChanges?: IAC5eActiveEffectChangeData[];
  statuses?: string[];
}

export default class EvolvedItemProperties {

  static PROPERTIES = EVOLVED_PROPERTIES;

  /** The compendium folder every shared property effect files under. */
  static PARENT: IDDBStandaloneEffectParent = {
    name: "Evolved Magic Item Properties",
    type: "item",
    bookCode: "AU",
    isLegacy: false,
  };

  /** The "Effect Items" sub-folder the host feats file under. */
  static EFFECT_ITEM_FOLDER = "Evolved Magic Item Properties";

  /** The printed property text when the official proxy has served it, else the module's paraphrase. */
  static text(property: IEvolvedProperty): string {
    const served = typeof CONFIG !== "undefined" ? CONFIG.DDB?.EVOLVED_PROPERTIES?.[property.name] : undefined;
    return served && served.trim() !== "" ? served : property.text;
  }

  /** The property as one description paragraph: on the enchantment, the host feat and every rider activity, so a copy carries its rule. */
  static descriptionHtml(property: IEvolvedProperty): string {
    return `<p><strong>${property.name} (${TIER_LABELS[property.tier]}).</strong> ${EvolvedItemProperties.text(property)}</p>`;
  }

  static byName(name: string): IEvolvedProperty | undefined {
    return EVOLVED_PROPERTIES.find((property) => property.name.toLowerCase() === name.toLowerCase());
  }

  /** An evolved item is named "<Property> <Base Item>"; the family root ("Blade of the Guardian") has no property. */
  static find(itemName: string): IEvolvedProperty | undefined {
    const prefix = itemName.trim().split(/\s+/)[0] ?? "";
    return EvolvedItemProperties.byName(prefix);
  }

  /** Every spell any property casts, for one compendium lookup. */
  static spellNames(): string[] {
    return [...new Set(EVOLVED_PROPERTIES.flatMap((property) => (property.spells ?? []).map((spell) => spell.name)))];
  }

  // -- Ids -------------------------------------------------------------------
  // Deterministic so re-munching updates the compendium copies in place.

  static enchantmentId(property: IEvolvedProperty): string {
    return utils.namedIDStub(`Evolved ${property.name}`);
  }

  static riderId(property: IEvolvedProperty, variant?: string): string {
    return utils.namedIDStub(`Rider ${property.name}${variant ? ` ${variant}` : ""}`);
  }

  static activityEffectId(property: IEvolvedProperty): string {
    return utils.namedIDStub(`Fx ${property.name}`);
  }

  static activityId(property: IEvolvedProperty, index: number): string {
    return utils.namedIDStub(`Act ${property.name} ${index}`);
  }

  static enchantActivityId(property: IEvolvedProperty): string {
    return utils.namedIDStub(`Apply ${property.name}`);
  }

  static hostItemId(property: IEvolvedProperty): string {
    return utils.namedIDStub(`Host ${property.name}`);
  }

  // -- Effects ---------------------------------------------------------------

  static #baseEffect({ id, name, img, description, transfer, disabled = false }: {
    id: string; name: string; img: string; description: string; transfer: boolean; disabled?: boolean;
  }): I5eEffectData {
    return {
      _id: id,
      name,
      img,
      description,
      transfer,
      disabled,
      statuses: [],
      duration: {},
      tint: "",
      showIcon: 1,
      system: { changes: [] },
      flags: {
        dae: { transfer, stackable: "noneNameOnly" },
        ddbimporter: { disabled, parent: { ...EvolvedItemProperties.PARENT } },
        "midi-qol": { forceCEOff: true },
        core: {},
      },
    };
  }

  /**
   * The enchantment as it sits in the compendium: prefixes the name, bumps the rarity,
   * makes the item magical, requires attunement where the property says so and appends the
   * property text to the description.
   */
  static enchantmentEffect(property: IEvolvedProperty): I5eEffectData {
    const effect = EvolvedItemProperties.#baseEffect({
      id: EvolvedItemProperties.enchantmentId(property),
      name: property.name,
      img: ENCHANTMENT_IMG,
      description: EvolvedItemProperties.descriptionHtml(property),
      transfer: false,
    });
    effect.type = "enchantment";
    (effect.system as I5eEnchantmentEffectSystem).magical = true;
    const changes: IActiveEffectChangeData[] = [
      ChangeHelper.addChange(`${property.name} {}`, 20, "name"),
      // a bare string override on the rarities SetField becomes Set{tier}
      ChangeHelper.overrideChange(property.tier, 20, "system.rarities"),
      ChangeHelper.addChange("mgc", 20, "system.properties"),
      ChangeHelper.overrideChange(`{}<p><strong>${property.name}.</strong> ${EvolvedItemProperties.text(property)}</p>`, 20, "system.description.value"),
    ];
    if (property.attuned) changes.push(ChangeHelper.overrideChange("required", 20, "system.attunement"));
    effect.system!.changes = changes;
    return effect;
  }

  /**
   * The enchantment applied to a munched evolved item. DDB already bakes the name prefix and
   * the property text into the item, so those two changes are dropped; the rest are
   * idempotent. `enchantmentOrigin` is resolved to the host feat's enchant activity at import.
   */
  static appliedEnchantmentEffect(property: IEvolvedProperty): I5eEffectData {
    const effect = EvolvedItemProperties.enchantmentEffect(property);
    effect.transfer = true;
    effect.flags!.dae!.transfer = true;
    effect.system!.changes = (effect.system!.changes ?? []).filter((change) => !["name", "system.description.value"].includes(change.key));
    delete effect.flags!.ddbimporter!.parent;
    effect.flags!.ddbimporter!.enchantmentOrigin = {
      itemId: EvolvedItemProperties.hostItemId(property),
      activityId: EvolvedItemProperties.enchantActivityId(property),
      profileId: EvolvedItemProperties.enchantmentId(property),
    };
    return effect;
  }

  static #riderSpecs(property: IEvolvedProperty): IRiderSpec[] {
    switch (property.name) {
      case "Vigilant":
        return [{
          label: "Vigilant Awareness",
          description: "<p>Advantage on Initiative rolls and Wisdom (Perception) checks.</p>",
          changes: [
            ChangeHelper.advantageInitiativeChange(),
            ChangeHelper.advantageSkillChange("prc"),
          ],
        }];
      case "All-Seeing":
        return [{
          label: "All-Seeing Truesight",
          description: "<p>Truesight with a range of 30 feet.</p>",
          changes: [ChangeHelper.upgradeChange("30", 20, "system.attributes.senses.ranges.truesight")],
        }];
      case "Psionic":
        return [{
          label: "Psionic Telepathy",
          description: "<p>Telepathy with a range of 30 feet.</p>",
          changes: [ChangeHelper.upgradeChange("30", 20, "system.traits.languages.communication.telepathy.value")],
        }];
      case "Spellguarding":
        return [{
          label: "Spellguarding Ward",
          description: "<p>Advantage on saving throws against spells and other magical effects. Without Midi-QOL or Automated Conditions 5e the advantage is only applied against spells.</p>",
          changes: [ChangeHelper.ruleAdvantageChange("save", { conditions: ChangeHelper.SPELL_FILTER })],
          midiChanges: [ChangeHelper.customChange("1", 5, "flags.midi-qol.magicResistance.all")],
          ac5eChanges: [ChangeHelper.ac5eChange("isSpell || isMagical", 20, "flags.automated-conditions-5e.save.advantage")],
        }];
      case "Empowering":
        return Object.entries(ABILITIES).map(([key, label]) => ({
          variant: label,
          label: `Empowering (${label})`,
          description: `<p>${label} increases by 2, to a maximum of 24. Enable the effect for the ability the DM chose.</p>`,
          disabled: true,
          changes: [
            ChangeHelper.upgradeChange("24", 20, `system.abilities.${key}.max`),
            ChangeHelper.addChange("2", 20, `system.abilities.${key}.value`),
          ],
        }));
      case "Resistant":
        return RESISTANT_TYPES.map((type) => ({
          variant: utils.capitalize(type),
          label: `Resistant (${utils.capitalize(type)})`,
          description: `<p>Resistance to ${type} damage. Enable the effect for the damage type the DM chose.</p>`,
          disabled: true,
          changes: [ChangeHelper.damageResistanceChange(type)],
        }));
      default:
        return [];
    }
  }

  static #riderEffect(property: IEvolvedProperty, spec: IRiderSpec): I5eEffectData {
    const raw = EvolvedItemProperties.#baseEffect({
      id: EvolvedItemProperties.riderId(property, spec.variant),
      name: spec.label,
      img: RIDER_IMG[property.name] ?? "icons/svg/aura.svg",
      description: spec.description,
      transfer: true,
      disabled: spec.disabled,
    });
    raw.system!.changes = [...spec.changes];
    return raw;
  }

  /**
   * Transfer effects carrying the passive half of a property.
   */
  static riderHints(property: IEvolvedProperty, { applied = false }: { applied?: boolean } = {}): IDDBEffectHint[] {
    return EvolvedItemProperties.#riderSpecs(property).map((spec) => {
      const raw = EvolvedItemProperties.#riderEffect(property, spec);
      if (applied) {
        delete raw.flags!.ddbimporter!.parent;
        foundry.utils.setProperty(raw, "flags.dnd5e.dependentOn", EvolvedItemProperties.enchantmentId(property));
      }
      return {
        raw,
        midiChanges: spec.midiChanges,
        ac5eChanges: spec.ac5eChanges,
        ...(applied ? {} : { standalone: true, standaloneKey: `Rider ${property.name}${spec.variant ? ` ${spec.variant}` : ""}` }),
      };
    });
  }

  static #activityEffectSpec(property: IEvolvedProperty): IActivityEffectSpec | null {
    const use = property.use;
    if (!use?.durationSeconds) return null;
    if (property.name === "Quickening") {
      return {
        activityName: use.name,
        label: "Magical Velocity",
        description: "<p>Speed doubled; Opportunity Attacks against you have Disadvantage.</p>",
        durationSeconds: use.durationSeconds,
        changes: [ChangeHelper.movementMultiplierChange(2)],
        // AC5e has no opportunity-attack marker; a reaction attack is the closest match
        ac5eChanges: [ChangeHelper.ac5eChange("activity.activation.type === 'reaction'", 20, "flags.automated-conditions-5e.grants.attack.disadvantage")],
      };
    }
    if (property.name === "Vanishing") {
      return {
        activityName: use.name,
        label: "Vanishing (Invisible)",
        description: "<p>Invisible for 1 hour or until you end it (no action required).</p>",
        durationSeconds: use.durationSeconds,
        changes: [],
        statuses: ["invisible"],
      };
    }
    return null;
  }

  /** Every property's enchantment and rider effects, destined for the effects compendium. */
  static standaloneHints(): IDDBEffectHint[] {
    return EVOLVED_PROPERTIES.flatMap((property) => [
      { raw: EvolvedItemProperties.enchantmentEffect(property), standalone: true, standaloneKey: `Evolved ${property.name}` },
      ...EvolvedItemProperties.riderHints(property),
    ]);
  }

  /** The effects embedded on a munched evolved item: the applied enchantment, its riders and any activity effects. */
  static appliedHints(property: IEvolvedProperty): IDDBEffectHint[] {
    const enchantmentId = EvolvedItemProperties.enchantmentId(property);
    const hints: IDDBEffectHint[] = [
      { raw: EvolvedItemProperties.appliedEnchantmentEffect(property) },
      ...EvolvedItemProperties.riderHints(property, { applied: true }),
    ];
    const spec = EvolvedItemProperties.#activityEffectSpec(property);
    if (spec) {
      hints.push({
        name: spec.label,
        type: "item",
        activityMatch: spec.activityName,
        options: { transfer: false, durationSeconds: spec.durationSeconds, description: spec.description },
        changes: spec.changes,
        ac5eChanges: spec.ac5eChanges,
        statuses: spec.statuses as IDDBEffectHint["statuses"],
        data: { _id: EvolvedItemProperties.activityEffectId(property), flags: { dnd5e: { dependentOn: enchantmentId } } } as I5eEffectData,
      });
    }
    return hints;
  }

  // -- Activities --------------------------------------------------------------

  static #dailyUses(max: number): I5eSystemLimitedUses {
    return { spent: 0, max: `${max}`, recovery: DAWN_RECOVERY };
  }

  /** Consume one of the activity's own uses (an empty target is "this activity" in dnd5e). */
  static #ownUseConsumption(): Partial<I5eActivity> {
    return {
      consumption: {
        targets: [{ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
        scaling: { allowed: false, max: "" },
        spellSlot: false,
      },
    } as Partial<I5eActivity>;
  }

  /**
   * The rider activities of a property in raw dnd5e shape: spell casts with their own daily
   * use and the printed DC, and the limited-use utilities. `skipSpells` names spells DDB
   * already ships on the item (the wand family carries its casts as item spells), which the
   * item-spell path turns into cast activities of its own.
   */
  static rawActivities(property: IEvolvedProperty, { skipSpells = [] }: { skipSpells?: string[] } = {}): IEvolvedRawActivity[] {
    const activities: IEvolvedRawActivity[] = [];
    const skipped = new Set(skipSpells.map((name) => name.toLowerCase()));
    let index = 0;
    for (const spell of property.spells ?? []) {
      const first = index === 0;
      const shared = property.sharedSpellUse === true;
      const id = EvolvedItemProperties.activityId(property, index);
      index++;
      if (skipped.has(spell.name.toLowerCase())) continue;
      const description = [
        shared ? `Cast together with ${property.spells!.map((s) => s.name).filter((n) => n !== spell.name).join(" and ")} as one Magic action, targeting the same creature.` : null,
        spell.note ?? null,
      ].filter((line) => line !== null).join(" ");
      const challenge = spell.dc || spell.attack
        ? { challenge: { ...(spell.dc ? { save: `${spell.dc}` } : {}), ...(spell.attack ? { attack: `${spell.attack}` } : {}), override: true } }
        : {};
      // Restorative shares one daily use between its two casts; every other property tracks
      // each spell separately
      const ownsUse = !shared || first;
      activities.push({
        id,
        name: `Cast ${spell.name}`,
        type: "cast",
        spell: spell.name,
        data: {
          activation: { type: "action", value: null, condition: "" },
          description: { ...(description ? { chatFlavor: description } : {}), value: EvolvedItemProperties.descriptionHtml(property) },
          spell: challenge,
          ...(ownsUse ? { uses: EvolvedItemProperties.#dailyUses(1), ...EvolvedItemProperties.#ownUseConsumption() } : {}),
        } as Partial<I5eActivity>,
      });
    }
    const use = property.use;
    if (use) {
      activities.push({
        id: EvolvedItemProperties.activityId(property, index),
        name: use.name,
        type: "utility",
        data: {
          activation: { type: use.activation, value: null, condition: use.condition ?? "" },
          description: { value: EvolvedItemProperties.descriptionHtml(property) },
          target: { affects: { type: "self", count: "" } },
          uses: EvolvedItemProperties.#dailyUses(use.max),
          ...EvolvedItemProperties.#ownUseConsumption(),
          ...(use.roll ? { roll: { name: use.name, formula: use.roll, prompt: false, visible: true } } : {}),
          ...(use.durationSeconds
            ? { duration: { value: `${use.durationSeconds / 60}`, units: "minute", concentration: use.concentration ?? false, override: true } }
            : {}),
        } as Partial<I5eActivity>,
      });
    }
    return activities;
  }

  /** The rider activities as enricher hints for a munched evolved item, hanging off its applied enchantment. */
  static activities(property: IEvolvedProperty, options: { skipSpells?: string[] } = {}): IDDBAdditionalActivity[] {
    const dependentOn = EvolvedItemProperties.enchantmentId(property);
    return EvolvedItemProperties.rawActivities(property, options).map((raw) => ({
      init: { name: raw.name, type: raw.type },
      build: {
        generateActivation: false,
        generateConsumption: false,
        generateTarget: false,
        generateRange: false,
        generateRoll: false,
        generateDuration: false,
        generateCast: raw.type === "cast",
      },
      overrides: {
        id: raw.id,
        ...(raw.spell ? { addSpellUuid: raw.spell } : {}),
        data: { ...raw.data, flags: { dnd5e: { dependentOn } } } as Partial<I5eActivity>,
      },
    }));
  }

  // -- Host items ---------------------------------------------------------------

  /**
   * The host feat for one property: an enchant activity whose profile is the enchantment
   * effect with every rider activity and effect listed, so using it on any item evolves that
   * item the way dnd5e's own enchantment application does. Rider effects transfer on the
   * evolved item but are suppressed here by `flags.dnd5e.riders`.
   */
  static hostItem(property: IEvolvedProperty, { spellUuids = {}, modules = {} }: {
    spellUuids?: Record<string, string>;
    modules?: IEvolvedModules;
  } = {}): I5eFeatItem {
    const name = `${property.name} (Evolved Item Property)`;
    const enchantment = EvolvedItemProperties.enchantmentEffect(property);
    const riders = EvolvedItemProperties.#riderSpecs(property).map((spec) => {
      const effect = EvolvedItemProperties.#riderEffect(property, spec);
      if (modules.midi && spec.midiChanges) effect.system!.changes!.push(...spec.midiChanges);
      if (modules.ac5e && spec.ac5eChanges) effect.system!.changes!.push(...spec.ac5eChanges);
      return effect;
    });
    const effects = [enchantment, ...riders];
    for (const effect of effects) delete effect.flags!.ddbimporter!.parent;

    const activities: Record<string, Partial<I5eActivity>> = {};
    const rawActivities = EvolvedItemProperties.rawActivities(property);
    const activityEffect = EvolvedItemProperties.#activityEffectSpec(property);
    for (const raw of rawActivities) {
      const data: Partial<I5eActivity> = {
        _id: raw.id,
        type: raw.type,
        name: raw.name,
        ...raw.data,
      };
      if (raw.spell) {
        const uuid = spellUuids[raw.spell.toLowerCase()];
        const cast = data as Partial<I5eCastActivity>;
        cast.spell = { ...(cast.spell ?? {}), properties: ["vocal", "somatic", "material"], spellbook: true, ...(uuid ? { uuid } : {}) } as I5eActivitySpell;
      }
      if (activityEffect && activityEffect.activityName === raw.name) {
        const effect = EvolvedItemProperties.#baseEffect({
          id: EvolvedItemProperties.activityEffectId(property),
          name: activityEffect.label,
          img: RIDER_IMG[property.name] ?? "icons/svg/aura.svg",
          description: activityEffect.description,
          transfer: false,
        });
        delete effect.flags!.ddbimporter!.parent;
        effect.duration = { value: activityEffect.durationSeconds, units: "seconds", expiry: "turnStart" };
        effect.statuses = (activityEffect.statuses ?? []) as I5eEffectData["statuses"];
        effect.system!.changes = [
          ...activityEffect.changes,
          ...(modules.ac5e ? activityEffect.ac5eChanges ?? [] : []),
        ];
        effects.push(effect);
        data.effects = [{ _id: effect._id, level: { min: null, max: null } }];
      }
      activities[raw.id] = data;
    }

    const enchantActivityId = EvolvedItemProperties.enchantActivityId(property);
    activities[enchantActivityId] = {
      _id: enchantActivityId,
      type: "enchant",
      name: `Apply ${property.name}`,
      img: ENCHANTMENT_IMG,
      description: { value: EvolvedItemProperties.descriptionHtml(property) },
      activation: { type: "special", value: null, condition: "The DM evolves a magic item" },
      target: { affects: { type: "object", count: "1" } },
      effects: [{
        _id: enchantment._id,
        level: { min: null, max: null },
        riders: {
          activity: rawActivities.map((raw) => raw.id),
          effect: riders.map((effect) => effect._id as string),
          item: [],
        },
      }],
      restrictions: { allowMagical: true, type: "", categories: [], properties: [] },
      enchant: { self: false },
    } as unknown as Partial<I5eActivity>;

    const item = {
      _id: EvolvedItemProperties.hostItemId(property),
      name,
      type: "feat",
      img: ENCHANTMENT_IMG,
      system: {
        identifier: utils.referenceNameString(name),
        description: {
          value: `${EvolvedItemProperties.descriptionHtml(property)}<p>Use <em>Apply ${property.name}</em> on a magic item to evolve it with this property; the property's activities and effects come along and are removed with the enchantment.</p>`,
          chat: "",
        },
        source: { revision: 1, rules: "2024" },
        type: { value: "enchantment", subtype: "" },
        activities,
      },
      effects,
      flags: {
        ddbimporter: {
          isEffectItem: true,
          effectName: EvolvedItemProperties.EFFECT_ITEM_FOLDER,
          evolvedProperty: property.name,
          is2014: false,
          is2024: true,
        },
        dnd5e: {
          riders: {
            activity: rawActivities.map((raw) => raw.id),
            effect: riders.map((effect) => effect._id as string),
          },
        },
      },
    };
    return item as unknown as I5eFeatItem;
  }

  /** Every property's host feat. */
  static hostItems(options: { spellUuids?: Record<string, string>; modules?: IEvolvedModules } = {}): I5eFeatItem[] {
    return EVOLVED_PROPERTIES.map((property) => EvolvedItemProperties.hostItem(property, options));
  }

}
