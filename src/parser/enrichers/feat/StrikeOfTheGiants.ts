import DDBEnricherData from "../data/DDBEnricherData";

export default class StrikeOfTheGiants extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    if (!this.isAction) return DDBEnricherData.ACTIVITY_TYPES.NONE;
    if ([
      "Strike of the Giants: Fire Strike",
    ].includes(this.name)) return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }


  override get activity(): IDDBActivityData {
    const nameArray = this.nameArray;
    return {
      name: nameArray[1].trim(),
      data: {
        damage: {
          onSave: "full",
        },
        effectConditionText: ["Cloud Strike"].includes(nameArray[1].trim()) ? "false" : "",
      },
    };
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return true;
  }

  get nameArray(): string[] {
    if (this.name.includes(":")) return this.name.split(":");
    return this.name.replace(")", "").split("(");
  }

  get defaultActionName(): string {
    const nameArray = this.nameArray;
    return `${nameArray[0].trim()}: ${nameArray[1].trim()}`;
  }

  override get builtFeaturesFromActionFilters(): any[] {
    if (this.isAction) return [];
    return [
      this.defaultActionName,
    ];
  }

  override get override(): IDDBOverrideData | null {
    if (this.isAction) return null;
    const activity = this.ddbEnricher.defaultActionFeatures[this.defaultActionName][0];

    return {
      data: {
        effects: activity.effects,
        system: {
          description: activity.system.description,
        },
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return !this.isAction;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    const results: IDDBEffectHint[] = [];

    const strikeDamage: Record<string, string> = {
      "Cloud Strike": "1d4[thunder]",
      "Fire Strike": "1d10[fire]",
      "Frost Strike": "1d6[cold]",
      "Hill Strike": "1d6",
      "Stone Strike": "1d6[force]",
      "Storm Strike": "1d6[lightning]",
    };
    const strikeName = this.nameArray[1].trim();
    const damage = strikeDamage[strikeName];
    if (damage) {
      results.push({
        name: `${this.name} (Automation)`,
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on a hit with a melee weapon attack or a thrown ranged weapon attack. Apply the save manually.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            `bonus=${damage}; oncePerTurn; optin; actionType.mwak || (actionType.rwak && itemProperties.thr)`,
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      });
    }

    switch (this.name) {
      case "Strike of the Giants: Cloud Strike":
        results.push({
          name: "Cloud Cover: Invisible to target",
          statuses: ["Invisible"],
          options: {
            // "you become invisible to it until the start of your next turn"
            expiry: "sourceStart",
          },
          daeSpecialDurations: ["1Attack", "1Spell"],
        });
        break;
      case "Strike of the Giants: Frost Strike":
        results.push({
          name: "Frost Struck: Speed Reduction",
          changes: [
            DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 100),
          ],
          options: {
            expiry: "sourceStart",
          },
        });
        break;
      case "Strike of the Giants: Storm Strike":
        results.push({
          name: "Storm Struck: Disadvantage on attack rolls",
          midiChanges: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("true", 20, "flags.midi-qol.disadvantage.attack.all"),
          ],
          ac5eChanges: [
            DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
          ],
          options: {
            expiry: "sourceStart",
          },
        });
        break;
      // no default
    }

    return results;
  }

}
