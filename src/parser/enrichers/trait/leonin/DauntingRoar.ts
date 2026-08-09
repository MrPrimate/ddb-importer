import DDBEnricherData from "../../data/DDBEnricherData";

export default class DauntingRoar extends DDBEnricherData {

  // get useDefaultAdditionalActivities() {
  //   return true;
  // }

  override get activity(): IDDBActivityData {
    return {
      rangeSelf: true,
      data: {
        target: {
          affects: {
            type: "enemy",
            choice: true,
          },
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "10",
            width: "",
            height: "",
            units: "ft",
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Daunting Roar: Frightened",
        statuses: ["Frightened"],
      },
      {
        midiOnly: true,
        noCreate: true,
        data: {
          duration: {
            value: 6,
            expiry: "turnEnd",
            units: "seconds",
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          "midi-qol": {
            effectCondition: "!target.effects.some((e) => e.name.toLowerCase().includes('deafened'))",
            AoETargetType: "enemy",
            AoETargetTypeIncludeSelf: false,
          },
        },
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
