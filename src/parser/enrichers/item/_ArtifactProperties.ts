import { DICTIONARY } from "../../../config/_module";
import { CompendiumHelper, DDBCompendiumFolders, DDBEffectImporter, DDBItemImporter, logger, SystemHelpers, utils } from "../../../lib/_module";
import ChangeHelper from "../effects/ChangeHelper";
import { dawnUses, ownUseConsumption, PROPERTY_ENCHANTMENT_IMG, propertyBaseEffect } from "./_EnchantPropertyShared";

/**
 * The Dungeon Master's Guide artifact property tables (minor and major, beneficial and
 * detrimental), 2024 and 2014 printings. The rows are unnamed in the books, so each carries a
 * descriptive name here; a row both printings share keeps one name across them.
 *
 * Artifacts never name the properties the DM rolled for them, so nothing is applied at import.
 * Instead, munching an artifact that refers to the tables builds every property twice over, the
 * way the evolving-item table is built: standalone enchantment and rider effects in the effects
 * compendium, and a host feat per property under "Effect Items" in the items compendium whose
 * enchant activity carries the riders, so the DM can apply a property to the artifact.
 */

const ATTACK_ROLL_FILTER: IEffectChangeFilter = { k: "roll.attack.type", o: "in", v: ["melee", "ranged"] };

/** A table row before its ruleset is stamped on. */
type TArtifactPropertySpec = Omit<IArtifactProperty, "rules">;

const TIER_LABELS: Record<TArtifactPropertyTier, string> = {
  minorBeneficial: "Minor Beneficial",
  majorBeneficial: "Major Beneficial",
  minorDetrimental: "Minor Detrimental",
  majorDetrimental: "Major Detrimental",
};

const ON_ATTUNEMENT = "You become attuned to the Artifact";

function abilityLabel(ability: DDBAbilityLookup): string {
  return utils.capitalize(ability.long);
}

function damageTypes(): string[] {
  return DICTIONARY.actions.damageType
    .map((type) => type.name)
    .filter((name): name is string => typeof name === "string");
}

/** One disabled skill proficiency toggle per skill. */
function skillToggles(): IArtifactPropertyRider[] {
  return DICTIONARY.actor.skills.map((skill) => ({
    // the dnd5e key: Perception, Performance and Persuasion clip to one id stub by label
    variant: skill.name,
    label: `Artifact Skill (${skill.label})`,
    description: `<p>Proficiency in ${skill.label}. Enable the effect for the skill the DM chose.</p>`,
    disabled: true,
    changes: [ChangeHelper.upgradeChange("1", 20, `system.skills.${skill.name}.value`)],
  }));
}

function resistanceToggles(): IArtifactPropertyRider[] {
  return damageTypes().map((type) => ({
    variant: utils.capitalize(type),
    label: `Artifact Resistance (${utils.capitalize(type)})`,
    description: `<p>Resistance to ${utils.capitalize(type)} damage. Enable the effect for the damage type the DM chose.</p>`,
    disabled: true,
    changes: [ChangeHelper.damageResistanceChange(type)],
  }));
}

function abilityIncreaseToggles(): IArtifactPropertyRider[] {
  return DICTIONARY.actor.abilities.map((ability) => ({
    variant: abilityLabel(ability),
    label: `Artifact Empowerment (${abilityLabel(ability)})`,
    description: `<p>${abilityLabel(ability)} increases by 2, to a maximum of 24. Enable the effect for the ability the DM chose.</p>`,
    disabled: true,
    changes: [
      ChangeHelper.upgradeChange("24", 20, `system.abilities.${ability.value}.max`),
      ChangeHelper.addChange("2", 20, `system.abilities.${ability.value}.value`),
    ],
  }));
}

/** The 2024 printing floors the reduced score at 3; the 2014 printing names no floor. */
function abilityDrainToggles(floor: number | null): () => IArtifactPropertyRider[] {
  return () => DICTIONARY.actor.abilities.map((ability) => ({
    variant: abilityLabel(ability),
    label: `Artifact Drain (${abilityLabel(ability)})`,
    description: `<p>${abilityLabel(ability)} is reduced by 2${floor ? `, to a minimum of ${floor}` : ""}. Enable the effect for the ability the attunement roll picked; a Greater Restoration spell restores it.</p>`,
    disabled: true,
    changes: [
      floor
        ? ChangeHelper.clampedSubtractChange("2", floor, 20, `system.abilities.${ability.value}.value`)
        : ChangeHelper.subtractChange("2", 20, `system.abilities.${ability.value}.value`),
    ],
  }));
}

/** Pick the ability a drain reduces: one d6, in the order the toggles list them. */
function abilityDrainRoll(): IArtifactPropertyActivity {
  return {
    name: "Ability Drain: Pick Ability",
    type: "utility",
    activation: "special",
    condition: ON_ATTUNEMENT,
    roll: "1d6",
    chatFlavor: "1 Strength, 2 Dexterity, 3 Constitution, 4 Intelligence, 5 Wisdom, 6 Charisma; enable that ability's effect.",
  };
}

function percentRoll(name: string, condition: string, chatFlavor: string): IArtifactPropertyActivity {
  return { name, type: "utility", activation: "special", condition, roll: "1d100", chatFlavor };
}

function textOnly(name: string, tier: TArtifactPropertyTier, text: string, attuned = true): TArtifactPropertySpec {
  return { name, tier, text, attuned };
}

function conditionImmunity(label: string, conditions: string[]): IArtifactPropertyRider {
  return {
    label,
    description: `<p>Immunity to the ${conditions.map((c) => utils.capitalize(c)).join(", ")} condition${conditions.length > 1 ? "s" : ""}.</p>`,
    changes: conditions.map((condition) => ChangeHelper.conditionImmunityChange(condition)),
  };
}

/** A condition that only applies away from the artifact: a disabled toggle the player switches on. */
function distanceCondition(label: string, status: string): IArtifactPropertyRider {
  return {
    label,
    description: `<p>${utils.capitalize(status)} while more than 10 feet away from the Artifact. Enable the effect while that is the case.</p>`,
    disabled: true,
    changes: [],
    statuses: [status],
  };
}

/**
 * The DM picks the spell, so there is nothing to link: dnd5e cannot use or even cache a Cast
 * activity without a spell. The cantrip is at will and needs no activity; a levelled spell gets a
 * utility that spends its daily use and rolls the 1d6, which a Cast activity the DM adds for the
 * chosen spell can consume instead.
 */
function spellProperty(tier: TArtifactPropertyTier, level: number, rules: T5eRulesVersion = "2024"): TArtifactPropertySpec {
  const levelText = rules === "2014" ? `${utils.ordinalSuffixOf(level)}-level spell` : `level ${level} spell`;
  if (level === 0) {
    return {
      name: "Cantrip",
      tier,
      attuned: true,
      text: "While attuned, cast one cantrip of the DM's choice from the Artifact.",
    };
  }
  return {
    name: `Level ${level} Spell`,
    tier,
    attuned: true,
    text: `While attuned, cast one ${levelText} of the DM's choice from the Artifact. After casting it, roll 1d6; on a 1-5 it can't be cast this way again until the next dawn.`,
    activities: [{
      name: `Level ${level} Spell: Recharge Roll`,
      type: "utility",
      activation: "special",
      condition: "You cast the spell from the Artifact",
      uses: 1,
      roll: "1d6",
      chatFlavor: "On a 6 the use is regained. Add a Cast activity for the spell the DM chose to the Artifact.",
    }],
  };
}

const PROPERTIES_2024: TArtifactPropertySpec[] = [
  // Minor Beneficial
  {
    name: "Skilled",
    tier: "minorBeneficial",
    attuned: true,
    text: "While attuned, proficiency in one skill of the DM's choice.",
    riders: skillToggles,
  },
  {
    name: "Poison Immunity",
    tier: "minorBeneficial",
    attuned: true,
    text: "While attuned, Immunity to the Poisoned condition.",
    riders: () => [conditionImmunity("Artifact Poison Immunity", ["poisoned"])],
  },
  {
    name: "Fearless",
    tier: "minorBeneficial",
    attuned: true,
    text: "While attuned, Immunity to the Charmed and Frightened conditions.",
    riders: () => [conditionImmunity("Artifact Fearlessness", ["charmed", "frightened"])],
  },
  {
    name: "Resistance",
    tier: "minorBeneficial",
    attuned: true,
    text: "While attuned, Resistance to one damage type of the DM's choice.",
    riders: resistanceToggles,
  },
  spellProperty("minorBeneficial", 0),
  spellProperty("minorBeneficial", 1),
  spellProperty("minorBeneficial", 2),
  spellProperty("minorBeneficial", 3),
  {
    name: "Protection",
    tier: "minorBeneficial",
    attuned: true,
    text: "While attuned, a +1 bonus to Armor Class.",
    riders: () => [{
      label: "Artifact Protection",
      description: "<p>+1 bonus to Armor Class.</p>",
      changes: [ChangeHelper.signedAddChange("1", 20, "system.attributes.ac.bonus")],
    }],
  },
  // Major Beneficial
  {
    name: "Empowerment",
    tier: "majorBeneficial",
    attuned: true,
    text: "While attuned, one ability score of the DM's choice increases by 2, to a maximum of 24.",
    riders: abilityIncreaseToggles,
  },
  {
    name: "Regeneration",
    tier: "majorBeneficial",
    attuned: true,
    text: "While attuned, regain 1d6 Hit Points at the start of each of your turns if you have at least 1 Hit Point.",
    activities: [{
      name: "Regenerate",
      type: "heal",
      activation: "turnStart",
      condition: "You have at least 1 Hit Point",
      formula: "1d6",
    }],
  },
  {
    name: "Force Strikes",
    tier: "majorBeneficial",
    attuned: true,
    text: "While attuned, a target you hit with an attack roll takes an extra 1d6 Force damage.",
    riders: () => [{
      label: "Artifact Force Strikes",
      description: "<p>A target you hit with an attack roll takes an extra 1d6 Force damage.</p>",
      changes: [ChangeHelper.ruleBonusChange("damage", "1d6[force]", { conditions: ATTACK_ROLL_FILTER })],
    }],
  },
  {
    name: "Swiftness",
    tier: "majorBeneficial",
    attuned: true,
    text: "While attuned, your Speed increases by 10 feet.",
    riders: () => [{
      label: "Artifact Swiftness",
      description: "<p>Speed increases by 10 feet.</p>",
      changes: [ChangeHelper.movementBonusChange("10")],
    }],
  },
  spellProperty("majorBeneficial", 4),
  spellProperty("majorBeneficial", 5),
  spellProperty("majorBeneficial", 6),
  spellProperty("majorBeneficial", 7),
  {
    name: "Unflinching",
    tier: "majorBeneficial",
    attuned: true,
    text: "While attuned, Immunity to the Blinded, Deafened, Petrified and Stunned conditions.",
    riders: () => [conditionImmunity("Artifact Unflinching", ["blinded", "deafened", "petrified", "stunned"])],
  },
  // Minor Detrimental
  {
    name: "Frailty",
    tier: "minorDetrimental",
    attuned: true,
    text: "While attuned, Disadvantage on ability checks and saving throws that use Strength or Constitution.",
    riders: () => [{
      label: "Artifact Frailty",
      description: "<p>Disadvantage on Strength and Constitution checks and saving throws.</p>",
      changes: ["str", "con"].flatMap((ability) => [
        ChangeHelper.disadvantageAbilityCheckChange(ability),
        ChangeHelper.disadvantageAbilitySaveChange(ability),
      ]),
    }],
  },
  {
    name: "Feeble Will",
    tier: "minorDetrimental",
    attuned: true,
    text: "While attuned, Disadvantage on Intelligence, Wisdom and Charisma saving throws.",
    riders: () => [{
      label: "Artifact Feeble Will",
      description: "<p>Disadvantage on Intelligence, Wisdom and Charisma saving throws.</p>",
      changes: ["int", "wis", "cha"].map((ability) => ChangeHelper.disadvantageAbilitySaveChange(ability)),
    }],
  },
  {
    name: "Poison Vulnerability",
    tier: "minorDetrimental",
    attuned: true,
    text: "While attuned, Vulnerability to Poison damage.",
    riders: () => [{
      label: "Artifact Poison Vulnerability",
      description: "<p>Vulnerability to Poison damage.</p>",
      changes: [ChangeHelper.damageVulnerabilityChange("poison")],
    }],
  },
  {
    name: "Tethered Sight",
    tier: "minorDetrimental",
    attuned: true,
    text: "While attuned, you have the Blinded condition while more than 10 feet away from the Artifact.",
    riders: () => [distanceCondition("Artifact Tethered Sight", "blinded")],
  },
  {
    name: "Tethered Hearing",
    tier: "minorDetrimental",
    attuned: true,
    text: "While attuned, you have the Deafened condition while more than 10 feet away from the Artifact.",
    riders: () => [distanceCondition("Artifact Tethered Hearing", "deafened")],
  },
  { name: "Scentless", tier: "minorDetrimental", attuned: true, text: "While attuned, you lose all sense of smell." },
  { name: "Altered Appearance", tier: "minorDetrimental", attuned: true, text: "While attuned, your appearance changes as the DM decides." },
  { name: "Stench", tier: "minorDetrimental", attuned: true, text: "While attuned, you give off a sour stench noticeable up to 10 feet away." },
  {
    name: "Devaluing Touch",
    tier: "minorDetrimental",
    attuned: true,
    text: "While attuned, a nonmagical gem or art object you touch loses half its value, once per object.",
  },
  { name: "Holy Water Bane", tier: "minorDetrimental", attuned: true, text: "While attuned, all Holy Water within 10 feet of you is destroyed." },
  { name: "Flame Smothering", tier: "minorDetrimental", attuned: true, text: "While attuned, nonmagical flames within 30 feet of you are extinguished." },
  {
    name: "Restless Presence",
    tier: "minorDetrimental",
    attuned: true,
    text: "While attuned, other creatures within 300 feet of you can't take Short or Long Rests.",
  },
  {
    name: "Blighting Touch",
    tier: "minorDetrimental",
    attuned: true,
    text: "While attuned, nonmagical vegetation you touch dies, unless it is a creature.",
  },
  {
    name: "Beast Hostility",
    tier: "minorDetrimental",
    attuned: true,
    text: "While attuned, Beasts of Challenge Rating 6 or lower within 30 feet of you are Hostile toward you.",
  },
  // Major Detrimental
  {
    name: "Exclusive Attunement",
    tier: "majorDetrimental",
    text: "Attuning to the Artifact ends your Attunement to other magic items, and you can't attune to others while attuned to it.",
  },
  {
    name: "Ability Drain",
    tier: "majorDetrimental",
    text: "On attuning, a random ability score is reduced by 2, to a minimum of 3, until a Greater Restoration spell restores it.",
    activities: [abilityDrainRoll()],
    riders: abilityDrainToggles(3),
  },
  {
    name: "Psychic Shock",
    tier: "majorDetrimental",
    text: "On attuning, you take 8d10 Psychic damage.",
    activities: [{
      name: "Psychic Shock",
      type: "damage",
      activation: "special",
      condition: ON_ATTUNEMENT,
      formula: "8d10",
      damageType: "psychic",
    }],
  },
  {
    name: "Quest-Bound",
    tier: "majorDetrimental",
    text: "The first time you attune, the Artifact gives you a quest set by the DM; its properties can't be used until the quest is complete.",
  },
  {
    name: "Divine Attention",
    tier: "majorDetrimental",
    text: "Each time you attune, there is a 10 percent chance that a god sends an avatar (an Empyrean) to take the Artifact from you.",
    activities: [{
      name: "Divine Attention: Roll",
      type: "utility",
      activation: "special",
      condition: ON_ATTUNEMENT,
      roll: "1d100",
      chatFlavor: "On a 1-10 a god notices and sends an avatar to take the Artifact.",
    }],
  },
  {
    name: "Deadly Attunement",
    tier: "majorDetrimental",
    text: "Each time you attune, succeed on a DC 10 Constitution saving throw or die, rising as a Wight under the DM's control that guards the Artifact.",
    activities: [{
      name: "Deadly Attunement",
      type: "save",
      activation: "special",
      condition: ON_ATTUNEMENT,
      save: { ability: "con", dc: 10 },
      chatFlavor: "On a failure you die and rise as a Wight under the DM's control.",
    }],
  },
  { name: "Potion Diluting", tier: "majorDetrimental", text: "Potions within 10 feet of the Artifact become nonmagical." },
  { name: "Scroll Erasing", tier: "majorDetrimental", text: "Scrolls within 10 feet of the Artifact are erased and become nonmagical." },
  {
    name: "Creature Enmity",
    tier: "majorDetrimental",
    attuned: true,
    text: "While attuned, creatures of one type other than Humanoid (DM's choice) are always Hostile toward you.",
  },
  {
    name: "Universal Vulnerability",
    tier: "majorDetrimental",
    attuned: true,
    text: "While attuned, Vulnerability to all damage.",
    riders: () => [{
      label: "Artifact Universal Vulnerability",
      description: "<p>Vulnerability to all damage.</p>",
      changes: [ChangeHelper.addChange("ALL", 20, "system.traits.dv.value")],
    }],
  },
  {
    name: "Imprisoned Slaad",
    tier: "majorDetrimental",
    text: "A Death Slaad is imprisoned in the Artifact; each time you attune, there is a 10 percent chance it escapes and attacks you.",
    activities: [{
      name: "Imprisoned Slaad: Roll",
      type: "utility",
      activation: "special",
      condition: ON_ATTUNEMENT,
      roll: "1d100",
      chatFlavor: "On a 1-10 the Death Slaad escapes into the nearest unoccupied space and attacks you.",
    }],
  },
  {
    name: "Withered Vitality",
    tier: "majorDetrimental",
    attuned: true,
    text: "While attuned, you can't spend Hit Point Dice or regain Hit Points.",
  },
];

const PROPERTIES_2014: TArtifactPropertySpec[] = [
  // Minor Beneficial
  {
    name: "Skilled",
    tier: "minorBeneficial",
    attuned: true,
    text: "While attuned, proficiency in one skill of the DM's choice.",
    riders: skillToggles,
  },
  {
    name: "Disease Immunity",
    tier: "minorBeneficial",
    attuned: true,
    text: "While attuned, you are immune to disease.",
    riders: () => [conditionImmunity("Artifact Disease Immunity", ["diseased"])],
  },
  {
    name: "Fearless",
    tier: "minorBeneficial",
    attuned: true,
    text: "While attuned, you can't be charmed or frightened.",
    riders: () => [conditionImmunity("Artifact Fearlessness", ["charmed", "frightened"])],
  },
  {
    name: "Resistance",
    tier: "minorBeneficial",
    attuned: true,
    text: "While attuned, resistance to one damage type of the DM's choice.",
    riders: resistanceToggles,
  },
  spellProperty("minorBeneficial", 0, "2014"),
  spellProperty("minorBeneficial", 1, "2014"),
  spellProperty("minorBeneficial", 2, "2014"),
  spellProperty("minorBeneficial", 3, "2014"),
  {
    name: "Protection",
    tier: "minorBeneficial",
    attuned: true,
    text: "While attuned, a +1 bonus to Armor Class.",
    riders: () => [{
      label: "Artifact Protection",
      description: "<p>+1 bonus to Armor Class.</p>",
      changes: [ChangeHelper.signedAddChange("1", 20, "system.attributes.ac.bonus")],
    }],
  },
  // Major Beneficial
  {
    name: "Empowerment",
    tier: "majorBeneficial",
    attuned: true,
    text: "While attuned, one ability score of the DM's choice increases by 2, to a maximum of 24.",
    riders: abilityIncreaseToggles,
  },
  {
    name: "Regeneration",
    tier: "majorBeneficial",
    attuned: true,
    text: "While attuned, regain 1d6 hit points at the start of your turn if you have at least 1 hit point.",
    activities: [{
      name: "Regenerate",
      type: "heal",
      activation: "turnStart",
      condition: "You have at least 1 hit point",
      formula: "1d6",
    }],
  },
  {
    name: "Weapon Strikes",
    tier: "majorBeneficial",
    attuned: true,
    text: "While attuned, a target you hit with a weapon attack takes an extra 1d6 damage of the weapon's type.",
    riders: () => [{
      label: "Artifact Weapon Strikes",
      description: "<p>A target you hit with a weapon attack takes an extra 1d6 damage of the weapon's type.</p>",
      // untyped dice take the damage type of the roll they join
      changes: [ChangeHelper.ruleBonusChange("damage", "1d6", { conditions: ChangeHelper.WEAPON_ATTACK_FILTER })],
    }],
  },
  {
    name: "Swiftness",
    tier: "majorBeneficial",
    attuned: true,
    text: "While attuned, your walking speed increases by 10 feet.",
    riders: () => [{
      label: "Artifact Swiftness",
      description: "<p>Walking speed increases by 10 feet.</p>",
      changes: [ChangeHelper.addChange("10", 20, "system.attributes.movement.walk")],
    }],
  },
  spellProperty("majorBeneficial", 4, "2014"),
  spellProperty("majorBeneficial", 5, "2014"),
  spellProperty("majorBeneficial", 6, "2014"),
  spellProperty("majorBeneficial", 7, "2014"),
  {
    name: "Unflinching",
    tier: "majorBeneficial",
    attuned: true,
    text: "While attuned, you can't be blinded, deafened, petrified or stunned.",
    riders: () => [conditionImmunity("Artifact Unflinching", ["blinded", "deafened", "petrified", "stunned"])],
  },
  // Minor Detrimental
  {
    name: "Spell Susceptibility",
    tier: "minorDetrimental",
    attuned: true,
    text: "While attuned, disadvantage on saving throws against spells.",
    riders: () => [{
      label: "Artifact Spell Susceptibility",
      description: "<p>Disadvantage on saving throws against spells. Needs Midi-QOL or Automated Conditions 5e: the dnd5e rules engine cannot tell what a saving throw is against.</p>",
      // a target's save roll data carries no item, so no core rule can single out saves against spells
      changes: [],
      midiChanges: [ChangeHelper.customChange("1", 5, "flags.midi-qol.magicVulnerability.all")],
      ac5eChanges: [ChangeHelper.ac5eChange("isSpell", 20, "flags.automated-conditions-5e.save.disadvantage")],
    }],
  },
  textOnly("Devaluing Touch", "minorDetrimental", "While attuned, the first time you touch a gem or piece of jewelry its value is halved."),
  {
    name: "Tethered Sight",
    tier: "minorDetrimental",
    attuned: true,
    text: "While attuned, you are blinded while more than 10 feet away from the artifact.",
    riders: () => [distanceCondition("Artifact Tethered Sight", "blinded")],
  },
  textOnly("Poison Susceptibility", "minorDetrimental", "While attuned, disadvantage on saving throws against poison."),
  textOnly("Stench", "minorDetrimental", "While attuned, you give off a sour stench noticeable up to 10 feet away."),
  textOnly("Holy Water Bane", "minorDetrimental", "While attuned, all holy water within 10 feet of you is destroyed."),
  {
    name: "Frailty",
    tier: "minorDetrimental",
    attuned: true,
    text: "While attuned, you are physically ill: disadvantage on ability checks and saving throws that use Strength or Constitution.",
    riders: () => [{
      label: "Artifact Frailty",
      description: "<p>Disadvantage on Strength and Constitution checks and saving throws.</p>",
      changes: ["str", "con"].flatMap((ability) => [
        ChangeHelper.disadvantageAbilityCheckChange(ability),
        ChangeHelper.disadvantageAbilitySaveChange(ability),
      ]),
    }],
  },
  textOnly("Weight Gain", "minorDetrimental", "While attuned, your weight increases by 1d4 x 10 pounds."),
  textOnly("Altered Appearance", "minorDetrimental", "While attuned, your appearance changes as the DM decides."),
  {
    name: "Tethered Hearing",
    tier: "minorDetrimental",
    attuned: true,
    text: "While attuned, you are deafened while more than 10 feet away from the artifact.",
    riders: () => [distanceCondition("Artifact Tethered Hearing", "deafened")],
  },
  textOnly("Weight Loss", "minorDetrimental", "While attuned, your weight drops by 1d4 x 5 pounds."),
  textOnly("Scentless", "minorDetrimental", "While attuned, you can't smell."),
  textOnly("Flame Smothering", "minorDetrimental", "While attuned, nonmagical flames within 30 feet of you are extinguished."),
  textOnly("Restless Presence", "minorDetrimental", "While attuned, other creatures within 300 feet of you can't take short or long rests."),
  textOnly("Blighting Touch", "minorDetrimental", "While attuned, you deal 1d6 necrotic damage to any plant you touch that isn't a creature."),
  textOnly("Animal Hostility", "minorDetrimental", "While attuned, animals within 30 feet of you are hostile toward you."),
  textOnly("Ravenous Hunger", "minorDetrimental", "While attuned, you must eat and drink six times the normal amount each day."),
  textOnly("Amplified Flaw", "minorDetrimental", "While attuned, your flaw is amplified in a way the DM decides."),
  // Major Detrimental
  textOnly("Rotting Body", "majorDetrimental", "While attuned, your body rots over four days, losing hair, then finger and toe tips, then lips and nose, then ears; a regenerate spell restores them."),
  {
    name: "Fickle Alignment",
    tier: "majorDetrimental",
    attuned: true,
    text: "While attuned, you determine your alignment daily at dawn by rolling a d6 twice: lawful, neutral or chaotic, then good, neutral or evil.",
    activities: [{
      name: "Fickle Alignment: Roll",
      type: "utility",
      activation: "special",
      condition: "Dawn",
      roll: "2d6",
      chatFlavor: "Roll each d6 separately. First die: 1-2 lawful, 3-4 neutral, 5-6 chaotic. Second die: 1-2 good, 3-4 neutral, 5-6 evil.",
    }],
  },
  textOnly("Geas Quest", "majorDetrimental", "When you first attune, the artifact gives you a quest set by the DM, which you must complete as if affected by the geas spell.", false),
  {
    name: "Hostile Life Force",
    tier: "majorDetrimental",
    text: "A hostile life force lives in the artifact. Each time you use an action to use one of its properties, there is a 50 percent chance it tries to possess you; on a failed DC 20 Charisma saving throw you become an NPC under the DM's control until it is banished.",
    activities: [
      percentRoll("Hostile Life Force: Roll", "You use an action to use one of the artifact's properties", "On a 1-50 the life force tries to enter your body; make the Charisma saving throw."),
      {
        name: "Hostile Life Force: Resist",
        type: "save",
        activation: "special",
        condition: "The life force tries to enter your body",
        save: { ability: "cha", dc: 20 },
        chatFlavor: "On a failure you become an NPC under the DM's control until the life force is banished, for example with dispel evil and good.",
      },
    ],
  },
  textOnly("Deadly Aura", "majorDetrimental", "Creatures with a challenge rating of 0, and plants that aren't creatures, drop to 0 hit points within 10 feet of the artifact.", false),
  {
    name: "Imprisoned Slaad",
    tier: "majorDetrimental",
    text: "A death slaad is imprisoned in the artifact; each time you use one of its properties as an action, there is a 10 percent chance it escapes within 15 feet of you and attacks you.",
    activities: [percentRoll("Imprisoned Slaad: Roll", "You use one of the artifact's properties as an action", "On a 1-10 the death slaad escapes within 15 feet of you and attacks you.")],
  },
  textOnly("Creature Enmity", "majorDetrimental", "While attuned, creatures of one type other than humanoid (DM's choice) are always hostile toward you."),
  textOnly("Potion Diluting", "majorDetrimental", "Magic potions within 10 feet of the artifact become nonmagical.", false),
  textOnly("Scroll Erasing", "majorDetrimental", "Magic scrolls within 10 feet of the artifact are erased and become nonmagical.", false),
  textOnly("Blood Price", "majorDetrimental", "Before using one of the artifact's properties as an action, you must use a bonus action to draw blood with a piercing or slashing melee weapon from yourself or a willing or incapacitated creature within reach, dealing 1d4 damage.", false),
  textOnly("Madness", "majorDetrimental", "When you become attuned, you gain a form of long-term madness.", false),
  {
    name: "Psychic Jolt",
    tier: "majorDetrimental",
    text: "On attuning, you take 4d10 psychic damage.",
    activities: [{ name: "Psychic Jolt", type: "damage", activation: "special", condition: ON_ATTUNEMENT, formula: "4d10", damageType: "psychic" }],
  },
  {
    name: "Psychic Shock",
    tier: "majorDetrimental",
    text: "On attuning, you take 8d10 psychic damage.",
    activities: [{ name: "Psychic Shock", type: "damage", activation: "special", condition: ON_ATTUNEMENT, formula: "8d10", damageType: "psychic" }],
  },
  textOnly("Kinslayer Attunement", "majorDetrimental", "Before you can attune to the artifact, you must kill a creature of your alignment.", false),
  {
    name: "Ability Drain",
    tier: "majorDetrimental",
    text: "On attuning, one of your ability scores is reduced by 2 at random, until a greater restoration spell restores it.",
    activities: [abilityDrainRoll()],
    riders: abilityDrainToggles(null),
  },
  {
    name: "Aging Attunement",
    tier: "majorDetrimental",
    text: "Each time you attune, you age 3d10 years and must succeed on a DC 10 Constitution saving throw or die, rising as a wight under the DM's control that protects the artifact.",
    activities: [
      { name: "Aging Attunement: Years", type: "utility", activation: "special", condition: ON_ATTUNEMENT, roll: "3d10" },
      {
        name: "Aging Attunement: Survive",
        type: "save",
        activation: "special",
        condition: ON_ATTUNEMENT,
        save: { ability: "con", dc: 10 },
        chatFlavor: "On a failure you die and rise as a wight under the DM's control.",
      },
    ],
  },
  textOnly("Mute", "majorDetrimental", "While attuned, you lose the ability to speak."),
  {
    name: "Universal Vulnerability",
    tier: "majorDetrimental",
    attuned: true,
    text: "While attuned, vulnerability to all damage.",
    riders: () => [{
      label: "Artifact Universal Vulnerability",
      description: "<p>Vulnerability to all damage.</p>",
      changes: [ChangeHelper.addChange("ALL", 20, "system.traits.dv.value")],
    }],
  },
  {
    name: "Divine Attention",
    tier: "majorDetrimental",
    text: "When you attune, there is a 10 percent chance a god sends an avatar (an empyrean) to take the artifact from you.",
    activities: [percentRoll("Divine Attention: Roll", ON_ATTUNEMENT, "On a 1-10 a god notices and sends an avatar to take the artifact.")],
  },
];

export const ARTIFACT_PROPERTIES: IArtifactProperty[] = [
  ...PROPERTIES_2024.map((property): IArtifactProperty => ({ ...property, rules: "2024" })),
  ...PROPERTIES_2014.map((property): IArtifactProperty => ({ ...property, rules: "2014" })),
];

/** Matches the artifact text that refers to the property tables ("1 minor beneficial property"). */
const PROPERTY_TABLE_REFERENCE = /\b(?:minor|major) (?:beneficial|detrimental) propert/i;

export default class ArtifactProperties {

  static PROPERTIES = ARTIFACT_PROPERTIES;

  /** The compendium folder each ruleset's shared property effects file under. */
  static parent(rules: T5eRulesVersion): IDDBStandaloneEffectParent {
    return rules === "2014"
      ? { name: "Artifact Properties", type: "item", bookCode: "DMG", isLegacy: true }
      : { name: "Artifact Properties", type: "item", bookCode: "DMG-2024", isLegacy: false };
  }

  /** The "Effect Items" sub-folder each ruleset's host feats file under; the two share names. */
  static effectItemFolder(rules: T5eRulesVersion): string {
    return rules === "2014" ? "Artifact Properties (2014)" : "Artifact Properties";
  }

  /** Whether an item description refers to the artifact property tables. */
  static mentionsPropertyTables(text: string | null | undefined): boolean {
    return PROPERTY_TABLE_REFERENCE.test(text ?? "");
  }

  /** The key the proxy serves a property's printed text under: the 2014 rows carry their ruleset. */
  static textKey(property: IArtifactProperty): string {
    return property.rules === "2014" ? `${property.name} (2014)` : property.name;
  }

  /** The printed property text when the proxy has served it, else the module's paraphrase. */
  static text(property: IArtifactProperty): string {
    const served = typeof CONFIG !== "undefined" ? CONFIG.DDB?.ARTIFACT_PROPERTIES?.[ArtifactProperties.textKey(property)] : undefined;
    return served && served.trim() !== "" ? served : property.text;
  }

  static tierLabel(property: IArtifactProperty): string {
    return TIER_LABELS[property.tier];
  }

  /** The property as one description paragraph: on the enchantment, the host feat and every activity, so a copy carries its rule. */
  static descriptionHtml(property: IArtifactProperty): string {
    return `<p><strong>${property.name} (${TIER_LABELS[property.tier]} Artifact Property).</strong> ${ArtifactProperties.text(property)}</p>`;
  }

  static byName(name: string, rules: T5eRulesVersion = "2024"): IArtifactProperty | undefined {
    return ARTIFACT_PROPERTIES.find((property) => property.rules === rules && property.name.toLowerCase() === name.toLowerCase());
  }

  static forRules(rules: T5eRulesVersion[]): IArtifactProperty[] {
    return ARTIFACT_PROPERTIES.filter((property) => rules.includes(property.rules));
  }

  // -- Ids -------------------------------------------------------------------
  // Deterministic so re-munching updates the compendium copies in place. The 2014 rows share
  // names with the 2024 ones, so their ids carry a ruleset postfix.

  static #id(property: IArtifactProperty, key: string): string {
    return utils.namedIDStub(key, { postfix: property.rules === "2014" ? "14" : null });
  }

  static enchantmentId(property: IArtifactProperty): string {
    return ArtifactProperties.#id(property, `Artifact ${property.name}`);
  }

  static riderId(property: IArtifactProperty, variant?: string): string {
    return ArtifactProperties.#id(property, `AR ${property.name}${variant ? ` ${variant}` : ""}`);
  }

  static activityId(property: IArtifactProperty, index: number): string {
    return ArtifactProperties.#id(property, `AA ${property.name} ${index}`);
  }

  static enchantActivityId(property: IArtifactProperty): string {
    return ArtifactProperties.#id(property, `AE ${property.name}`);
  }

  static hostItemId(property: IArtifactProperty): string {
    return ArtifactProperties.#id(property, `AH ${property.name}`);
  }

  // -- Effects ---------------------------------------------------------------

  /**
   * The enchantment: appends the property text to the artifact's description, keeps it magical
   * and requires attunement where the property says so. The artifact keeps its name and rarity.
   */
  static enchantmentEffect(property: IArtifactProperty): I5eEffectData {
    const effect = propertyBaseEffect({
      id: ArtifactProperties.enchantmentId(property),
      name: `${property.name} (${TIER_LABELS[property.tier]})`,
      img: PROPERTY_ENCHANTMENT_IMG,
      description: ArtifactProperties.descriptionHtml(property),
      transfer: false,
      parent: ArtifactProperties.parent(property.rules),
    });
    effect.type = "enchantment";
    (effect.system as I5eEnchantmentEffectSystem).magical = true;
    const changes: IActiveEffectChangeData[] = [
      ChangeHelper.addChange("mgc", 20, "system.properties"),
      ChangeHelper.overrideChange(`{}${ArtifactProperties.descriptionHtml(property)}`, 20, "system.description.value"),
    ];
    if (property.attuned) changes.push(ChangeHelper.overrideChange("required", 20, "system.attunement"));
    effect.system!.changes = changes;
    return effect;
  }

  /** The rider effects of a property; the optional module changes are added for the modules that are active. */
  static riderEffects(property: IArtifactProperty, modules: IEvolvedModules = {}): I5eEffectData[] {
    return (property.riders?.() ?? []).map((spec) => {
      const effect = propertyBaseEffect({
        id: ArtifactProperties.riderId(property, spec.variant),
        name: spec.label,
        img: "icons/svg/aura.svg",
        description: spec.description,
        transfer: true,
        disabled: spec.disabled,
        parent: ArtifactProperties.parent(property.rules),
      });
      effect.statuses = (spec.statuses ?? []) as I5eEffectData["statuses"];
      effect.system!.changes = [
        ...spec.changes,
        ...(modules.midi ? spec.midiChanges ?? [] : []),
        ...(modules.ac5e ? spec.ac5eChanges ?? [] : []),
      ];
      return effect;
    });
  }

  /** Every property's enchantment and rider effects, destined for the effects compendium. */
  static standaloneEffects(modules: IEvolvedModules = {}, rules: T5eRulesVersion[] = ["2014", "2024"]): I5eEffectData[] {
    return ArtifactProperties.forRules(rules).flatMap((property) => [
      ArtifactProperties.enchantmentEffect(property),
      ...ArtifactProperties.riderEffects(property, modules),
    ]);
  }

  // -- Activities --------------------------------------------------------------

  static #activityData(property: IArtifactProperty, spec: IArtifactPropertyActivity): Partial<I5eActivity> {
    const data: Record<string, unknown> = {
      activation: { type: spec.activation, value: null, condition: spec.condition ?? "" },
      description: { value: ArtifactProperties.descriptionHtml(property), ...(spec.chatFlavor ? { chatFlavor: spec.chatFlavor } : {}) },
      ...(spec.uses ? { uses: dawnUses(spec.uses), ...ownUseConsumption() } : {}),
    };
    const dice = (/^(\d+)d(\d+)$/).exec(spec.formula ?? "");
    const part = (types: string[]) => ({
      number: dice ? Number(dice[1]) : null,
      denomination: dice ? Number(dice[2]) : null,
      bonus: "",
      types,
      custom: { enabled: false, formula: "" },
      scaling: { mode: "", number: null, formula: "" },
    });
    switch (spec.type) {
      case "utility":
        data.target = { affects: { type: "self", count: "" } };
        if (spec.roll) data.roll = { name: spec.name, formula: spec.roll, prompt: false, visible: true };
        break;
      case "heal":
        data.target = { affects: { type: "self", count: "" } };
        data.healing = part(["healing"]);
        break;
      case "damage":
        data.target = { affects: { type: "self", count: "" } };
        data.damage = { critical: { allow: false }, parts: [part([spec.damageType ?? ""])] };
        break;
      case "save":
        data.target = { affects: { type: "self", count: "" } };
        data.save = { ability: [spec.save?.ability ?? "con"], dc: { calculation: "", formula: `${spec.save?.dc ?? 10}` } };
        data.damage = { onSave: "none", parts: [] };
        break;
      // no default
    }
    return data as Partial<I5eActivity>;
  }

  /** The activities a property grants, in dnd5e shape and keyed by their deterministic ids. */
  static activities(property: IArtifactProperty): Record<string, Partial<I5eActivity>> {
    const activities: Record<string, Partial<I5eActivity>> = {};
    (property.activities ?? []).forEach((spec, index) => {
      const id = ArtifactProperties.activityId(property, index);
      activities[id] = {
        _id: id,
        type: spec.type,
        name: spec.name,
        ...ArtifactProperties.#activityData(property, spec),
      } as Partial<I5eActivity>;
    });
    return activities;
  }

  // -- Host items ---------------------------------------------------------------

  /**
   * The host feat for one property: an enchant activity whose profile is the enchantment with
   * every rider activity and effect listed, so using it on an artifact gives the artifact the
   * property the way dnd5e's own enchantment application does. Rider effects transfer on the
   * enchanted artifact but are suppressed here by `flags.dnd5e.riders`.
   */
  static hostItem(property: IArtifactProperty, { modules = {} }: { modules?: IEvolvedModules } = {}): I5eFeatItem {
    const name = `${property.name} (${TIER_LABELS[property.tier]} Artifact Property)`;
    const enchantment = ArtifactProperties.enchantmentEffect(property);
    const riders = ArtifactProperties.riderEffects(property, modules);
    const effects = [enchantment, ...riders];
    for (const effect of effects) delete effect.flags!.ddbimporter!.parent;

    const activities = ArtifactProperties.activities(property);
    const riderActivityIds = Object.keys(activities);
    const riderEffectIds = riders.map((effect) => effect._id as string);
    const enchantActivityId = ArtifactProperties.enchantActivityId(property);
    activities[enchantActivityId] = {
      _id: enchantActivityId,
      type: "enchant",
      name: `Apply ${property.name}`,
      img: PROPERTY_ENCHANTMENT_IMG,
      description: { value: ArtifactProperties.descriptionHtml(property) },
      activation: { type: "special", value: null, condition: "The DM gives an Artifact this property" },
      target: { affects: { type: "object", count: "1" } },
      effects: [{
        _id: enchantment._id,
        level: { min: null, max: null },
        riders: { activity: riderActivityIds, effect: riderEffectIds, item: [] },
      }],
      restrictions: { allowMagical: true, type: "", categories: [], properties: [] },
      enchant: { self: false },
    } as unknown as Partial<I5eActivity>;

    const item = {
      _id: ArtifactProperties.hostItemId(property),
      name,
      type: "feat",
      img: PROPERTY_ENCHANTMENT_IMG,
      system: {
        identifier: utils.referenceNameString(name),
        description: {
          value: `${ArtifactProperties.descriptionHtml(property)}<p>Use <em>Apply ${property.name}</em> on an Artifact to give it this property; the property's activities and effects come along and are removed with the enchantment.</p>`,
          chat: "",
        },
        source: { book: property.rules === "2014" ? "DMG" : "DMG 2024", revision: 1, rules: property.rules },
        type: { value: "enchantment", subtype: "" },
        activities,
      },
      effects,
      flags: {
        ddbimporter: {
          isEffectItem: true,
          effectName: ArtifactProperties.effectItemFolder(property.rules),
          artifactProperty: property.name,
          is2014: property.rules === "2014",
          is2024: property.rules === "2024",
        },
        dnd5e: {
          riders: { activity: riderActivityIds, effect: riderEffectIds },
        },
      },
    };
    return item as unknown as I5eFeatItem;
  }

  /** Every property's host feat. */
  static hostItems({ modules = {}, rules = ["2014", "2024"] }: { modules?: IEvolvedModules; rules?: T5eRulesVersion[] } = {}): I5eFeatItem[] {
    return ArtifactProperties.forRules(rules).map((property) => ArtifactProperties.hostItem(property, { modules }));
  }

  // -- Compendium writes -------------------------------------------------------

  /**
   * Write the property effects for the given rulesets to the effects compendium and the host
   * feats to the items compendium under "Effect Items". Missing compendiums skip their half.
   */
  static async buildCompendiums({ updateBool = true, rules = ["2014", "2024"] }: {
    updateBool?: boolean;
    rules?: T5eRulesVersion[];
  } = {}): Promise<void> {
    if (!game.user?.isGM || rules.length === 0) return;
    const effectModules = SystemHelpers.effectModules();
    const modules: IEvolvedModules = { ac5e: effectModules.ac5eInstalled, midi: effectModules.midiQolInstalled };

    await DDBEffectImporter.importEffects(ArtifactProperties.standaloneEffects(modules, rules));

    if (!CompendiumHelper.getCompendiumType("items", false)) return;
    const hosts = ArtifactProperties.hostItems({ modules, rules });
    const folders = new DDBCompendiumFolders("items");
    await folders.loadCompendium("items");
    await folders.createEffectFoldersForItemDocuments(hosts);
    await folders.addCompendiumFolderIds(hosts);
    await DDBItemImporter.buildHandler("items", hosts, updateBool, {
      chrisPremades: false,
      filterDuplicates: false,
      deleteBeforeUpdate: false,
      matchFlags: ["artifactProperty", "is2014"],
      useCompendiumFolders: true,
      indexFilter: { fields: ["name", "flags.ddbimporter"] },
    });
    logger.debug(`Wrote ${hosts.length} artifact property host feats`);
  }

}
