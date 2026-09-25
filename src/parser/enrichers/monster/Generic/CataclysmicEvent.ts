import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/**
 * Riders match the parser's numbered modes. Clinging Flames, the Speed of 0 and the storm cloud
 * apply on a successful save as well as a failed one; effect links here carry no on-save marker,
 * so apply those by hand after a success.
 */
export default class CataclysmicEvent extends _MonsterFeatureSupport {
  get modes(): boolean {
    return ["1: Clinging Flames", "2: Freezing Waves", "3: Raging Storm", "4: Swallowing Earth"].every((name) =>
      this.text.includes(name),
    );
  }

  override get clearAutoEffects(): boolean {
    return this.modes;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.modes) return [];
    return [
      { name: "Clinging Flames", statuses: ["Burning"], activityMatch: "1: Clinging Flames" },
      { name: "Waves: Prone", statuses: ["Prone"], activityMatch: "2: Freezing Waves" },
      {
        name: "Waves: Speed Zero",
        changes: [
          _MonsterFeatureSupport.ChangeHelper.customChange("*0", 20, "system.attributes.movement.all"),
          _MonsterFeatureSupport.ChangeHelper.overrideChange("0", 60, "system.attributes.movement.walk"),
        ],
        activityMatch: "2: Freezing Waves",
        options: { durationSeconds: 6, durationRounds: 1, expiry: "targetEnd" },
      },
      {
        name: "Inside Storm Cloud",
        statuses: ["Blinded", "Deafened"],
        activityMatch: "3: Raging Storm",
        options: {
          expiry: null,
          durationSeconds: null,
          description:
            "Apply only while entirely inside the cloud; verbal spell components are unavailable. Remove on leaving, after 1 minute, or when the source uses Cataclysmic Event again.",
        },
      },
      {
        name: "Buried",
        statuses: ["Prone", "Restrained", "coverTotal", "suffocation"],
        activityMatch: "4: Swallowing Earth",
        options: {
          expiry: null,
          durationSeconds: null,
          description:
            "A successful escape check ends burial, restraint, total cover, and suffocation. Resolve standing from Prone separately.",
        },
      },
    ];
  }

  override async cleanup(): Promise<void> {
    if (!this.modes) return;
    const check = this.check();
    if (!check) return;
    // Building this after the parser's modes preserves its automatic multi-save generation.
    const activity = this.parser._getCheckActivity(
      { name: "Buried: Escape Check" },
      {
        generateCheck: true,
        checkOverride: check,
        generateConsumption: false,
        generateDamage: false,
        includeBaseDamage: false,
        activationOverride: {
          type: "action",
          value: 1,
          condition: "The buried creature or another creature within 5 feet can attempt this check.",
        },
        targetOverride: { affects: { type: "creature", count: "1" }, template: { type: "" } },
        rangeOverride: { units: "any" },
      },
    );
    activity.data._id = "ddbBuriedCheck01";
    activity.data.effects = [];
    this.document.system.activities[activity.data._id] = activity.data;
  }
}
