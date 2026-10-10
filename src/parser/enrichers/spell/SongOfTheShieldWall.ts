import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The name makes the generic parser treat this as a wall spell; it is really a
 * number of targets within range that gain an AC bonus, which grows at 6th and
 * 8th level.
 */
export default class SongOfTheShieldWall extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      noTemplate: true,
      overrideTemplate: true,
      overrideTarget: true,
      data: {
        range: {
          override: true,
          value: "30",
          units: "ft",
        },
        target: {
          override: true,
          affects: {
            type: "creature",
            count: "@mod",
            choice: true,
          },
          template: {},
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      { bonus: 2, min: null, max: 5 },
      { bonus: 3, min: 6, max: 7 },
      { bonus: 4, min: 8, max: null },
    ].map(({ bonus, min, max }) => ({
      name: `Shield Wall (+${bonus} AC)`,
      options: {
        durationSeconds: 60,
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${bonus}`, 20, "system.attributes.ac.bonus"),
      ],
      data: {
        flags: {
          ddbimporter: {
            effectIdLevel: { min, max },
          },
        },
      },
    }));
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        "system.target": {
          template: {
            contiguous: false,
            type: "",
            size: "",
            units: "",
          },
          affects: {
            type: "creature",
            count: "@mod",
            choice: true,
          },
        },
      },
    };
  }

}
