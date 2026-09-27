import DDBEnricherData from "../../data/DDBEnricherData";
import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

interface IStatusRider {
  name: string;
  statuses?: string[];
  changes?: IActiveEffectChangeData[];
  durationSeconds?: number | null;
  description?: string;
  /**
   * The wording the feature must carry for the rider to apply, for a name that unrelated monsters
   * share: a Roper's "Tendril" grapples, a Gas Spore's poisons.
   */
  requires?: RegExp;
  /** A 2024 stat block's rider; a 2014 feature of the same name works differently. */
  only2024?: boolean;
}

/**
 * Condition and modifier riders on monster features whose stat-block text the feature parser
 * does not turn into an effect (it catches "the target has the X condition" phrasings, not
 * "is Frightened until..." or speed and AC adjustments). The table matches Monster Manual effects
 * by feature name. A name shared by unrelated features is only matched with the wording it
 * requires (`requires`), and generic names with no such tell (Gore, Claws, Rally, Protection)
 * are absent. Registered through DDBMonsterFeatureEnricher.GENERIC_FEATURE_NAME as "Status Rider".
 */
export default class StatusRider extends _MonsterFeatureSupport {

  static riders(): Record<string, IStatusRider[]> {
    const C = DDBEnricherData.ChangeHelper;
    // "Speed is 0": every movement mode, the same as Sentinel
    const speedZero = () => [
      C.customChange("*0", 20, "system.attributes.movement.all"),
      ...["walk", "burrow", "climb", "fly", "swim"].map((mode) => C.overrideChange("0", 60, `system.attributes.movement.${mode}`)),
    ];
    const chaos = (): IStatusRider[] => [
      { name: "Chaos: 1 Charmed", statuses: ["Charmed"], durationSeconds: 60, description: "Roll a d4: on a 1 the target is Charmed." },
      { name: "Chaos: 2 Frightened", statuses: ["Frightened"], durationSeconds: 60, description: "Roll a d4: on a 2 the target is Frightened." },
      { name: "Chaos: 3 Poisoned", statuses: ["Poisoned"], durationSeconds: 60, description: "Roll a d4: on a 3 the target is Poisoned." },
      { name: "Chaos: 4 Incapacitated", statuses: ["Incapacitated"], durationSeconds: 60, description: "Roll a d4: on a 4 the target is Incapacitated." },
    ];
    return {
      "Baleful Command": [{ name: "Frightened and Incapacitated", statuses: ["Frightened", "Incapacitated"] }],
      "Brutal Gore": [{ name: "Prone", statuses: ["Prone"] }],
      "Burn": [{ name: "Burning", statuses: ["Burning"], requires: /starts burning|Burning condition/i }],
      "Chaos Blade": chaos(),
      "Chaos Claw": chaos(),
      "Chaos Staff": chaos(),
      "Charming": [{
        name: "Charmed and Incapacitated",
        statuses: ["Charmed", "Incapacitated"],
        durationSeconds: 60,
        requires: /Charmed condition[\s\S]{0,120}Incapacitated condition/i,
      }],
      "Curse of the Riddle": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: null }],
      "Cursed Touch": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: null }],
      "Euphoria Breath": [{ name: "Incapacitated", statuses: ["Incapacitated"], durationSeconds: 60 }],
      "Faerie Dust": [
        { name: "Charmed", statuses: ["Charmed"], durationSeconds: 60 },
        { name: "Poisoned", statuses: ["Poisoned"], durationSeconds: 60 },
      ],
      "Fiendish Blood": [{ name: "Cursed", statuses: ["Cursed"], changes: [C.customChange("-10", 20, "system.attributes.movement.all")], durationSeconds: null, only2024: true }],
      "First Roar": [{ name: "Frightened", statuses: ["Frightened"], durationSeconds: 600 }],
      "Second Roar": [{ name: "Paralyzed", statuses: ["Paralyzed"], durationSeconds: 60 }],
      "Third Roar": [{ name: "Prone", statuses: ["Prone"] }],
      "Freezing Burst": [{ name: "Speed 0", changes: speedZero(), durationSeconds: 6, only2024: true }],
      "Giggling Magic": [{
        name: "Giggling",
        changes: [
          C.unsignedAddChange("-1d6", 20, "system.bonuses.abilities.check"),
          C.unsignedAddChange("-1d6", 20, "system.bonuses.msak.attack"),
          C.unsignedAddChange("-1d6", 20, "system.bonuses.mwak.attack"),
          C.unsignedAddChange("-1d6", 20, "system.bonuses.rsak.attack"),
          C.unsignedAddChange("-1d6", 20, "system.bonuses.rwak.attack"),
        ],
        durationSeconds: 60,
      }],
      // 2024 speed penalties; the 2014 Ice Spear is a save with its own duration, left to the parser
      "Great Bow": [{ name: "Speed -10 ft", changes: [C.customChange("-10", 20, "system.attributes.movement.all")], durationSeconds: 6, only2024: true }],
      "Ice Spear": [{ name: "Speed -10 ft", changes: [C.customChange("-10", 20, "system.attributes.movement.all")], durationSeconds: 6, only2024: true }],
      "Icy Bite": [{ name: "Speed -5 ft", changes: [C.customChange("-5", 20, "system.attributes.movement.all")], durationSeconds: 6, only2024: true }],
      "Ocean Spear": [{ name: "Speed -10 ft", changes: [C.customChange("-10", 20, "system.attributes.movement.all")], durationSeconds: 6, only2024: true }],
      "Inferno Blast": [{ name: "Exhaustion", statuses: ["Exhaustion:1"], durationSeconds: null }],
      "Invitation": [{ name: "Total Cover", statuses: ["coverTotal"], requires: /Total Cover/i }],
      "Majestic Song": [
        { name: "Charmed", statuses: ["Charmed"] },
        { name: "Frightened", statuses: ["Frightened"] },
      ],
      "Misty Escape": [{ name: "Paralyzed", statuses: ["Paralyzed"], durationSeconds: null, description: "Paralyzed in the resting place until it regains at least 1 hit point." }],
      "Mucus Cloud": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: null }],
      "Nimble Escape": [{ name: "Hiding", statuses: ["Hiding"], durationSeconds: null }],
      "Noxious Miasma": [{ name: "AC -2", changes: [C.unsignedAddChange("-2", 20, "system.attributes.ac.bonus")], durationSeconds: 6 }],
      "Ooze Cube": [{ name: "Total Cover", statuses: ["coverTotal"], durationSeconds: null }],
      "Psychic Warp": [
        { name: "Charmed", statuses: ["Charmed"], durationSeconds: 60 },
        { name: "Prone", statuses: ["Prone"] },
      ],
      "Rapport Spores": [{ name: "Telepathy 30 ft", changes: [C.upgradeChange("30", 20, "system.traits.languages.communication.telepathy.value")], durationSeconds: 3600 }],
      "Ravage": [{ name: "Prone", statuses: ["Prone"], requires: /Prone condition/i }],
      "Repulsion Breath": [{ name: "Prone", statuses: ["Prone"] }],
      "Restless Touch": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: null }],
      "Rotting Fist": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: null }],
      "Scorching Sands": [{ name: "Half Speed", changes: [C.customChange("/2", 20, "system.attributes.movement.all")], durationSeconds: 6, only2024: true }],
      "Shadow Stealth": [{ name: "Hiding", statuses: ["Hiding"], durationSeconds: null }],
      "Shadowy Teleport": [{ name: "Invisible", statuses: ["Invisible"], durationSeconds: 60 }],
      "Shimmering Shield": [{ name: "Shielded", changes: [C.unsignedAddChange("2", 20, "system.attributes.ac.bonus")], durationSeconds: 6 }],
      "Spiteful Escape": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: null, description: "Disadvantage on ability checks and saving throws until the curse ends." }],
      "Stake to the Heart": [{ name: "Paralyzed", statuses: ["Paralyzed"], durationSeconds: null }],
      "Steal Body": [{ name: "Total Cover", statuses: ["coverTotal"], durationSeconds: null }],
      "Crackling Wave": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: 6 }],
      "Injecting Claw": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: null }],
      "Mutating Claw": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: null }],
      "Silver Needle": [{ name: "Cursed", statuses: ["Cursed", "Poisoned"], durationSeconds: 60 }],
      "Tongue Twister": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: 6 }],
      "Stench Spray": [{ name: "Poisoned", statuses: ["Poisoned"], durationSeconds: 60 }],
      "Tendril": [{ name: "Poisoned", statuses: ["Poisoned"], durationSeconds: 60, requires: /Poisoned condition/i }],
      "Tentacle Slam": [{ name: "Stunned", statuses: ["Stunned"], durationSeconds: 6 }],
      "Thunderbolt": [{ name: "Blinded and Deafened", statuses: ["Blinded", "Deafened"], durationSeconds: 6, requires: /Blinded and Deafened conditions/i }],
      "Thunderous Bellow": [{ name: "Deafened and Frightened", statuses: ["Deafened", "Frightened"], durationSeconds: 60 }],
      "Unnerving Gaze": [{ name: "Frightened", statuses: ["Frightened"], durationSeconds: 6 }],
      "Warping Hex": [{ name: "Exhaustion", statuses: ["Exhaustion:1"], durationSeconds: null }],
      "Water Jet": [{ name: "Prone", statuses: ["Prone"], requires: /\bprone\b/i }],
      "Web Strand": [{ name: "Restrained", statuses: ["Restrained"], durationSeconds: null }],
      "Weight of Years": [{ name: "Exhaustion", statuses: ["Exhaustion:1"], durationSeconds: null }],
      "Whirlwind": [{ name: "Prone", statuses: ["Prone"], requires: /\bprone\b/i }],
      "Whirlwind of Sand": [
        { name: "AC +2", changes: [C.unsignedAddChange("2", 20, "system.attributes.ac.bonus")], durationSeconds: 6 },
        { name: "Blinded", statuses: ["Blinded"], durationSeconds: 6 },
      ],
      "World-Shaking Movement": [{ name: "Prone", statuses: ["Prone"] }],
    };
  }

  /** Feature names are keyed without any parenthetical suffix ("Charming (Recharge 5-6)"). */
  get riderKey(): string {
    return (this.name ?? "").split("(")[0].trim();
  }

  /** The riders this feature carries: its name's entry, kept to this ruleset and wording. */
  get riders(): IStatusRider[] {
    return (StatusRider.riders()[this.riderKey] ?? []).filter((rider) =>
      (!rider.only2024 || !this.is2014) && (!rider.requires || rider.requires.test(this.text)));
  }

  /**
   * The parser's own "Status: X" effect duplicates a rider on some monsters; the table replaces
   * it. A feature the table does not apply to keeps what the parser made.
   */
  override get clearAutoEffects(): boolean {
    return this.riders.length > 0;
  }

  override get effects(): IDDBEffectHint[] {
    return this.riders.map((rider) => ({
      name: `${this.name}: ${rider.name}`,
      statuses: rider.statuses,
      changes: rider.changes,
      options: {
        ...(rider.durationSeconds !== undefined ? { durationSeconds: rider.durationSeconds } : {}),
        ...(rider.description ? { description: rider.description } : {}),
      },
    }));
  }

}
