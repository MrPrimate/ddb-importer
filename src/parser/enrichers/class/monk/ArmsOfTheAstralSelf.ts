import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArmsOfTheAstralSelf extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.ATTACK : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData {
    return {
      noConsumeTargets: true,
      noeffect: true,
      data: {
        attack: {
          ability: "",
        },
        damage: {
          parts: [DDBEnricherData.basicDamagePart({
            customFormula: "@scale.monk.die.die + @mod",
            types: ["force"],
          })],
        },
      },
    };
  }

  /**
   * DDB has named the attack actions several ways over time ("(DEX/STR)", plain, "(WIS)", "(Wis)",
   * "(Wis.)") and a character only carries one name per attack, so ask for the names it has. When
   * it has none, the canonical name is still requested so the missing-action warning stays real.
   */
  _astralSelfActions(names: string[], rename: string): IDDBAdditionalActivity[] {
    const present = names.filter((name) => this.hasAction({ name, type: "class" }));
    return (present.length > 0 ? present : [names[0]]).map((name) => ({
      action: { name, type: "class", rename: [rename] },
    }));
  }

  override get additionalActivities() : IDDBAdditionalActivity[] {
    return this.isAction
      ? []
      : [
        ...this._astralSelfActions(["Arms of the Astral Self: Summon"], "Summon"),
        ...this._astralSelfActions(["Arms of the Astral Self (DEX/STR)", "Arms of the Astral Self"], "DEX/STR Attack"),
        ...this._astralSelfActions([
          "Arms of the Astral Self (WIS)",
          "Arms of the Astral Self (Wis)",
          "Arms of the Astral Self (Wis.)",
        ], "WIS Attack"),
      ];
  }

  override get effects(): IDDBEffectHint[] {
    return this.isAction
      ? []
      : [
        {
          activityMatch: "Summon",
          name: `${this.data.name} (Save Modifications)`,
          changes: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("- @abilities.str.mod + @abilities.wis.mod", 0, "system.abilities.str.bonuses.check"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("- @abilities.str.mod + @abilities.wis.mod", 0, "system.abilities.str.bonuses.save"),
          ],
          options: {
            durationSeconds: 600,
          },
        },
      ];
  }

  override get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
      data: {
        system: {
          properties: ["fin"],
          range: {
            units: "ft",
            value: 10,
          },
        },
        flags: {
          ddbimporter: {
            skipScale: true,
          },
        },
      },
    };
  }

}
