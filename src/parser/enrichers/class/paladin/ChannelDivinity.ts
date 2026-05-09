import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinity extends DDBEnricherData {

  get activity(): IDDBActivityData | null {
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

  get _additionalActivitiesPaladin2014(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Channel Divinity: Sacred Weapon", type: "class" } },
      { action: { name: "Channel Divinity: Turn the Unholy", type: "class" } },
      { action: { name: "Channel Divinity: Conquering Presence", type: "class" } },
      { action: { name: "Channel Divinity: Guided Strike", type: "class" } },
      { action: { name: "Channel Divinity: Peerless Athlete", type: "class" } },
      { action: { name: "Channel Divinity: Inspiring Smite", type: "class" } },
      { action: { name: "Channel Divinity: Emissary of Peace", type: "class" } },
      { action: { name: "Channel Divinity: Rebuke the Violent", type: "class" } },
      { action: { name: "Channel Divinity: Nature’s Wrath", type: "class" } },
      { action: { name: "Channel Divinity: Turn the Faithless", type: "class" } },
      { action: { name: "Channel Divinity: Champion Challenge", type: "class" } },
      { action: { name: "Channel Divinity: Turn the Tide", type: "class" } },
      { action: { name: "Channel Divinity: Watcher's Will", type: "class" } },
      { action: { name: "Channel Divinity: Abjure the Extraplanar", type: "class" } },
      { action: { name: "Channel Divinity: Abjure Enemy", type: "class" } },
      { action: { name: "Channel Divinity: Vow of Enmity", type: "class" } },
      { action: { name: "Channel Divinity: Control Undead", type: "class" } },
      { action: { name: "Channel Divinity: Dreadful Aspect", type: "class" } },
      { action: { name: "Channel Divinity: Vow of Sustenance", type: "class" } },
      { action: { name: "Channel Divinity: Share Vitality", type: "class" } },
      { action: { name: "Channel Divinity: Marine Layer", type: "class" } },
      { action: { name: "Channel Divinity: Fury of the Tides", type: "class" } },
      { action: { name: "Channel Divinity: Absorb Magic", type: "class" } },
      { action: { name: "Channel Divinity: Expeditious Command", type: "class" } },
      { action: { name: "Channel Divinity: Mark of the Heretic", type: "class" } },
      { action: { name: "Channel Divinity: Inquisitor's Eye", type: "class" } },
    ];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return this._additionalActivitiesPaladin2014;
    } else if (this.is2024) {
      return this._additionalActivitiesPaladin2024;
    }
  }

  get _effectPaladin2024() {
    return {
      name: "Divine Sense",
      options: {
        durationSeconds: 600,
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    if (this.is2014) {
      return [];
    } else if (this.is2024) {
      return [this._effectPaladin2024];
    }
  }

  get override(): IDDBOverrideData {
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
