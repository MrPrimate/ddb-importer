import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinity extends DDBEnricherData {

  override get activity(): IDDBActivityData | null {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.NONE,
    };
  }

  get _additionalActivitiesPaladin2024(): IDDBAdditionalActivity[] {
    return [
      {
        action: {
          name: "Channel Divinity: Divine Sense",
          type: "class",
          rename: ["Divine Sense"],
        },
        overrides: {
          addItemConsume: true,
        },
      },
    ];
  }

  /**
   * 2014 Channel Divinity options keyed by the oath that grants them. Oaths carry a source
   * suffix on some DDB builds ("Oath of Conquest (XGtE)") and not others, so they are matched
   * on the name before any parenthesis. Mark of the Heretic and Inquisitor's Eye have no known
   * oath and are included only when the character carries the action.
   */
  static OATH_OPTIONS_2014: Record<string, string[]> = {
    "Oath of Devotion": ["Sacred Weapon", "Turn the Unholy"],
    "Oath of the Ancients": ["Nature’s Wrath", "Turn the Faithless"],
    "Oath of Vengeance": ["Abjure Enemy", "Vow of Enmity"],
    "Oath of Glory": ["Peerless Athlete", "Inspiring Smite"],
    "Oathbreaker": ["Control Undead", "Dreadful Aspect"],
    "Oath of Conquest": ["Conquering Presence", "Guided Strike"],
    "Oath of Redemption": ["Emissary of Peace", "Rebuke the Violent"],
    "Oath of the Crown": ["Champion Challenge", "Turn the Tide"],
    "Oath of the Watchers": ["Watcher's Will", "Abjure the Extraplanar"],
    "Oath of the Harvest": ["Vow of Sustenance", "Share Vitality"],
    "Oath of the Open Sea": ["Marine Layer", "Fury of the Tides"],
    "Oath of the Spelldrinker": ["Absorb Magic", "Expeditious Command"],
    "": ["Mark of the Heretic", "Inquisitor's Eye"],
  };

  /** Subclass names of the character's classes, with any source suffix removed. */
  get _characterOathNames(): string[] {
    const classes = this.ddbParser?.ddbData?.character.classes ?? [];
    return classes
      .map((klass) => klass.subclassDefinition?.name)
      .filter((name): name is string => Boolean(name))
      .map((name) => name.split("(")[0].trim());
  }

  _characterHasClassAction(name: string): boolean {
    const wanted = utils.nameString(name);
    return (this.ddbParser?.ddbData?.character.actions.class ?? []).some((action) =>
      utils.nameString(action.name) === wanted,
    );
  }

  get _additionalActivitiesPaladin2014(): IDDBAdditionalActivity[] {
    const oaths = this._characterOathNames;
    const results: IDDBAdditionalActivity[] = [];
    for (const [oath, options] of Object.entries(ChannelDivinity.OATH_OPTIONS_2014)) {
      for (const option of options) {
        const name = `Channel Divinity: ${option}`;
        // the muncher wants every option; a character gets its own oath's, so a missing
        // action still warns for the oath it has and stays silent for the ones it does not
        const wanted = this.ddbParser.isMuncher
          || (oath !== "" && oaths.includes(oath))
          || this._characterHasClassAction(name);
        if (wanted) results.push({ action: { name, type: "class" } });
      }
    }
    return results;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return this._additionalActivitiesPaladin2014;
    } else if (this.is2024) {
      return this._additionalActivitiesPaladin2024;
    }

    // unreachable: a feature is always 2014 or 2024; the consumer treats undefined and [] identically
    return [];
  }

  get _effectPaladin2024(): IDDBEffectHint {
    return {
      name: "Divine Sense",
      options: {
        durationSeconds: 600,
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) {
      return [];
    } else if (this.is2024) {
      return [this._effectPaladin2024];
    }

    // unreachable: a feature is always 2014 or 2024; the consumer treats undefined and [] identically
    return [];
  }

  override get override(): IDDBOverrideData | null {
    if (this.is2014) return null;

    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Channel Divinity",
      max: "@scale.paladin.channel-divinity",
      period: "lr",
    });

    uses.recovery = [
      { period: "sr", type: "formula", formula: "1" },
      { period: "lr", type: "recoverAll", formula: undefined },
    ];

    return {
      uses,
    };
  }

}
