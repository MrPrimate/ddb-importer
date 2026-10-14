import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The target's Wisdom save is modified by how well the caster knows it and by the connection held,
 * so, as in the official data, each knowledge and connection pair is its own cast with the save
 * modifier folded into the DC. On a failure the spell makes an invisible sensor near the target,
 * which the dnd5e SRD pack offers as a second, slot-free summon; it is the same invisible sensor
 * Clairvoyance places, so that actor is reused.
 */
export default class Scrying extends DDBEnricherData {

  // a save bonus of +5 / +0 / -5 for the knowledge, -2 / -4 / -10 for the connection
  get #knowledge(): [string, number][] {
    return [["Secondhand", -5], ["Firsthand", 0], [this.is2014 ? "Familiar" : "Extensive", 5]];
  }

  static CONNECTIONS: [string, number][] = [["Picture", 2], ["Garment", 4], ["Body Part", 10]];

  static #dcFormula(knowledge: number, connection: number): string {
    const total = knowledge + connection;
    if (total === 0) return "@attributes.spell.dc";
    return `@attributes.spell.dc ${total < 0 ? "-" : "+"} ${Math.abs(total)}`;
  }

  get #modes(): { name: string; formula: string }[] {
    return this.#knowledge.flatMap(([knowledge, kMod]) =>
      Scrying.CONNECTIONS.map(([connection, cMod]) => ({
        name: `${knowledge} and ${connection}`,
        formula: Scrying.#dcFormula(kMod, cMod),
      })),
    );
  }

  override get activity(): IDDBActivityData {
    const first = this.#modes[0];
    return {
      name: first.name,
      data: {
        save: { ability: ["wis"], dc: { calculation: "", formula: first.formula } },
      },
    };
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getClairvoyance;
  }

  override get generateSummons(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const modes: IDDBAdditionalActivity[] = this.#modes.slice(1).map((mode) => ({
      duplicate: true,
      overrides: {
        name: mode.name,
        data: {
          save: { ability: ["wis"], dc: { calculation: "", formula: mode.formula } },
        },
      },
    }));
    return [
      ...modes,
      {
        init: {
          name: "Create Sensor",
          type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
        },
        build: {
          generateSummon: true,
          noSpellslot: true,
          // made after the save fails, while the spell is already being concentrated on
          noConcentration: true,
        },
        overrides: {
          noTemplate: true,
          profileKeys: [{ count: 1, name: "Clairvoyance" }],
        },
      },
    ];
  }

}
