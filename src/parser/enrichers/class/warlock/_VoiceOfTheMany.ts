import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Coven Patron (OTFY) "Voice of the Many: <Coven>" option documents, each a once per Long Rest
 * benefit. Crowsworn and Cloud Cap roll three d6 to assign to AC and two saves (the split is the
 * player's, so only the roll is automated); Fish Head and the Gilded Gourd cast an Evocation spell
 * the player chooses; Patchwork Robe and The Tall Hats redirect a spell as a Reaction.
 */
export default class _VoiceOfTheMany extends DDBEnricherData {

  get benefitKind(): "defense" | "evocation" | "share" {
    const name = this.ddbParser.originalName;
    if ((/Crowsworn|Cloud Cap/i).test(name)) return "defense";
    if ((/Fish Head|Gilded Gourd/i).test(name)) return "evocation";
    return "share";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    const base: IDDBActivityData = {
      addItemConsume: true,
      targetType: "self",
    };
    switch (this.benefitKind) {
      case "defense":
        return {
          ...base,
          name: "Voice of the Many: Defensive Rolls",
          activationType: "bonus",
          activationCondition: "Assign the three rolls as bonuses to your AC and two saving throws of your choice",
          data: {
            duration: { value: "1", units: "minute", override: true },
            roll: {
              prompt: false,
              visible: true,
              formula: "3d6",
              name: "Defensive Rolls",
            },
          },
        };
      case "evocation":
        return {
          ...base,
          name: "Voice of the Many: Channel Evocation",
          activationType: "action",
          activationCondition: "Cast a level 6 or lower Druid or Wizard Evocation spell (no Reaction casting time) without a spell slot or Material components",
        };
      default:
        return {
          ...base,
          name: "Voice of the Many: Share Spell",
          activationType: "reaction",
          activationCondition: "You or a creature you can see is targeted by a spell of level 6 or lower: it also targets another creature you can see",
          targetType: "creature",
          targetCount: 1,
          overrideTarget: true,
        };
    }
  }

  // DDB names the League of the Gilded Gourd option with a double space, so the action is matched by
  // prefix; a character has one coven, so one Voice of the Many action
  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Voice of the Many:",
        max: "1",
        period: "lr",
        includesName: true,
      }),
    };
  }

}
