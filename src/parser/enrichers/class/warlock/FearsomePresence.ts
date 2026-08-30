import DDBEnricherData from "../../data/DDBEnricherData";

export default class FearsomePresence extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      targetType: "enemy",
      data: {
        range: {
          units: "self",
        },
        target: {
          template: {
            type: "radius",
            size: "30",
            units: "ft",
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Fearsome Presence: Frightened",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 60,
          description: "Frightened for 1 minute; repeats the Wisdom save at the end of each of its turns, ending the effect on itself on a success.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Fearsome Presence (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=wis,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
      {
        name: "Fearsome Presence: Restrained",
        statuses: ["Restrained"],
        options: {
          expiry: "sourceEnd",
          description: "Restrained until the end of the warlock's next turn.",
        },
      },
    ];
  }

}
