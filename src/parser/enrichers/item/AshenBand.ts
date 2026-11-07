import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Ashen Verdict rings (Icecrown Citadel): Might, Vengeance, Wisdom, Courage and Destruction,
 * each in base, Greater, Unmatched and Endless versions. DDB's modifiers carry the ability scores,
 * the AC and save bonuses, the condition immunities and the spell attack and DC bonuses; the melee
 * and ranged weapon damage bonuses and the Courage rings' save Advantage are text only and are
 * added here. Treating a rolled 1 as a 2, ignoring Half Cover and the long range Disadvantage are
 * left to the player. None of the rings is activated, so the parser's bare activity is dropped.
 */
export default class AshenBand extends DDBEnricherData {

  override get stopDefaultActivity(): boolean {
    return true;
  }

  get ringText(): string {
    return (this.data.system?.description?.value ?? "").replace(/<[^>]+>/g, " ");
  }

  override get effects(): IDDBEffectHint[] {
    const name = this.data.name;
    const effects: IDDBEffectHint[] = [];
    if ((/Might/).test(name)) {
      const bonus = (/\+(\d+) bonus to damage rolls for melee weapon attacks/i).exec(this.ringText)?.[1] ?? "1";
      effects.push({
        name: `${name}: Melee Damage`,
        options: { transfer: true },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(bonus, 22, "system.rolls.damage.mwak.bonus"),
        ],
      });
    }
    if ((/Vengeance/).test(name)) {
      const bonus = (/\+(\d+) bonus to damage rolls made with ranged weapons/i).exec(this.ringText)?.[1] ?? "2";
      effects.push({
        name: `${name}: Ranged Damage`,
        options: { transfer: true },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(bonus, 22, "system.rolls.damage.rwak.bonus"),
        ],
      });
    }
    if ((/Courage/).test(name) && (/Advantage on saving throws/i).test(this.ringText)) {
      effects.push({
        name: `${name}: Courage`,
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Advantage on saving throws against the Charmed or Frightened condition. Automated for the initial save only.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("riderStatuses.charmed || riderStatuses.frightened", 20, "flags.automated-conditions-5e.save.advantage"),
        ],
      });
    }
    return effects;
  }

}
