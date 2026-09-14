import DDBEnricherData from "../../data/DDBEnricherData";

interface IStatusRider {
  name: string;
  statuses?: string[];
  changes?: IActiveEffectChangeData[];
  durationSeconds?: number | null;
  description?: string;
}

/**
 * Condition and modifier riders on monster features whose stat-block text the feature parser
 * does not turn into an effect (it catches "the target has the X condition" phrasings, not
 * "is Frightened until..." or speed and AC adjustments). The table matches
 * Monster Manual effects for features whose names are distinctive enough to carry the same
 * rider on every monster that has them; generic names shared by unrelated features (Gore,
 * Claws, Rally, Protection) are deliberately absent. Registered through
 * DDBMonsterFeatureEnricher.GENERIC_FEATURE_NAME as "Status Rider".
 */
export default class StatusRider extends DDBEnricherData {

  static riders(): Record<string, IStatusRider[]> {
    const C = DDBEnricherData.ChangeHelper;
    const MOVES = ["walk", "burrow", "climb", "fly", "swim"];
    const speedPenalty = (value: string) => MOVES.map((m) => C.unsignedAddChange(value, 20, `system.attributes.movement.${m}`));
    const speedOverride = (value: string) => MOVES.map((m) => C.overrideChange(value, 20, `system.attributes.movement.${m}`));
    const chaos = (): IStatusRider[] => [
      { name: "Chaos: 1 Charmed", statuses: ["Charmed"], durationSeconds: 60, description: "Roll a d4: on a 1 the target is Charmed." },
      { name: "Chaos: 2 Frightened", statuses: ["Frightened"], durationSeconds: 60, description: "Roll a d4: on a 2 the target is Frightened." },
      { name: "Chaos: 3 Poisoned", statuses: ["Poisoned"], durationSeconds: 60, description: "Roll a d4: on a 3 the target is Poisoned." },
      { name: "Chaos: 4 Incapacitated", statuses: ["Incapacitated"], durationSeconds: 60, description: "Roll a d4: on a 4 the target is Incapacitated." },
    ];
    return {
      "Baleful Command": [{ name: "Frightened and Incapacitated", statuses: ["Frightened", "Incapacitated"] }],
      "Brutal Gore": [{ name: "Prone", statuses: ["Prone"] }],
      "Burn": [{ name: "Burning", statuses: ["Burning"] }],
      "Chaos Blade": chaos(),
      "Chaos Claw": chaos(),
      "Chaos Staff": chaos(),
      "Charming": [{ name: "Charmed and Incapacitated", statuses: ["Charmed", "Incapacitated"], durationSeconds: 60 }],
      "Curse of the Riddle": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: null }],
      "Cursed Touch": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: null }],
      "Euphoria Breath": [{ name: "Incapacitated", statuses: ["Incapacitated"], durationSeconds: 60 }],
      "Faerie Dust": [
        { name: "Charmed", statuses: ["Charmed"], durationSeconds: 60 },
        { name: "Poisoned", statuses: ["Poisoned"], durationSeconds: 60 },
      ],
      "Fiendish Blood": [{ name: "Cursed", statuses: ["Cursed"], changes: speedPenalty("-10"), durationSeconds: null }],
      "First Roar": [{ name: "Frightened", statuses: ["Frightened"], durationSeconds: 600 }],
      "Second Roar": [{ name: "Paralyzed", statuses: ["Paralyzed"], durationSeconds: 60 }],
      "Third Roar": [{ name: "Prone", statuses: ["Prone"] }],
      "Freezing Burst": [{ name: "Speed 0", changes: speedOverride("0"), durationSeconds: 6 }],
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
      "Great Bow": [{ name: "Speed -10 ft", changes: [C.unsignedAddChange("-10", 20, "system.attributes.movement.walk")], durationSeconds: 6 }],
      "Ice Spear": [{ name: "Speed -10 ft", changes: [C.unsignedAddChange("-10", 20, "system.attributes.movement.walk")], durationSeconds: 6 }],
      "Icy Bite": [{ name: "Speed -5 ft", changes: [C.unsignedAddChange("-5", 20, "system.attributes.movement.walk")], durationSeconds: 6 }],
      "Ocean Spear": [{ name: "Speed -10 ft", changes: [C.unsignedAddChange("-10", 20, "system.attributes.movement.walk")], durationSeconds: 6 }],
      "Inferno Blast": [{ name: "Exhaustion", statuses: ["Exhaustion:1"], durationSeconds: null }],
      "Invitation": [{ name: "Total Cover", statuses: ["coverTotal"] }],
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
      "Ravage": [{ name: "Prone", statuses: ["Prone"] }],
      "Repulsion Breath": [{ name: "Prone", statuses: ["Prone"] }],
      "Restless Touch": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: null }],
      "Rotting Fist": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: null }],
      "Scorching Sands": [{ name: "Half Speed", changes: MOVES.map((m) => C.multiplyChange("0.5", 20, `system.attributes.movement.${m}`)), durationSeconds: 6 }],
      "Shadow Stealth": [{ name: "Hiding", statuses: ["Hiding"], durationSeconds: null }],
      "Shadowy Teleport": [{ name: "Invisible", statuses: ["Invisible"], durationSeconds: 60 }],
      "Shimmering Shield": [{ name: "Shielded", changes: [C.unsignedAddChange("2", 20, "system.attributes.ac.bonus")], durationSeconds: 6 }],
      "Spiteful Escape": [{ name: "Cursed", statuses: ["Cursed"], durationSeconds: null, description: "Disadvantage on ability checks and saving throws until the curse ends." }],
      "Stake to the Heart": [{ name: "Paralyzed", statuses: ["Paralyzed"], durationSeconds: null }],
      "Steal Body": [{ name: "Total Cover", statuses: ["coverTotal"], durationSeconds: null }],
      "Stench Spray": [{ name: "Poisoned", statuses: ["Poisoned"], durationSeconds: 60 }],
      "Tendril": [{ name: "Poisoned", statuses: ["Poisoned"], durationSeconds: 60 }],
      "Tentacle Slam": [{ name: "Stunned", statuses: ["Stunned"], durationSeconds: 6 }],
      "Thunderbolt": [{ name: "Blinded and Deafened", statuses: ["Blinded", "Deafened"], durationSeconds: 6 }],
      "Thunderous Bellow": [{ name: "Deafened and Frightened", statuses: ["Deafened", "Frightened"], durationSeconds: 60 }],
      "Unnerving Gaze": [{ name: "Frightened", statuses: ["Frightened"], durationSeconds: 6 }],
      "Warping Hex": [{ name: "Exhaustion", statuses: ["Exhaustion:1"], durationSeconds: null }],
      "Water Jet": [{ name: "Prone", statuses: ["Prone"] }],
      "Web Strand": [{ name: "Restrained", statuses: ["Restrained"], durationSeconds: null }],
      "Weight of Years": [{ name: "Exhaustion", statuses: ["Exhaustion:1"], durationSeconds: null }],
      "Whirlwind": [{ name: "Prone", statuses: ["Prone"] }],
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

  /** The parser's own "Status: X" effect duplicates a rider on some monsters; the table replaces it. */
  override get clearAutoEffects(): boolean {
    return (StatusRider.riders()[this.riderKey] ?? []).length > 0;
  }

  override get effects(): IDDBEffectHint[] {
    const riders = StatusRider.riders()[this.riderKey] ?? [];
    return riders.map((rider) => ({
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
