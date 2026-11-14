import DDBEnricherData from "../../data/DDBEnricherData";

interface INaturesSanctuaryLand {
  origin: string;
  type: string;
}

/**
 * Nature's Sanctuary (Circle of the Land, 2024). As in the PHB, one "Place Sanctuary" activity per
 * land type places the 15-foot cube for a use of Wild Shape; its region gives allies inside that
 * land's Nature's Ward (half cover plus the damage resistance). The wards are also linked to their
 * activity for applying by hand. Half cover is our own status rather than the PHB's stock effect,
 * which dnd5e only ships from 6.1. The 2014 feature (beasts and plants hesitate to attack you)
 * keeps the activity DDB's action gives it.
 */
export default class NaturesSanctuary extends DDBEnricherData {

  static LANDS: INaturesSanctuaryLand[] = [
    { origin: "Arid", type: "fire" },
    { origin: "Polar", type: "cold" },
    { origin: "Temperate", type: "lightning" },
    { origin: "Tropical", type: "poison" },
  ];

  static wardName(land: INaturesSanctuaryLand): string {
    return `Nature's Ward: ${land.origin}`;
  }

  static placeName(land: INaturesSanctuaryLand): string {
    return `Place Sanctuary (${land.origin})`;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return this.is2014;
  }

  override get type(): IDDBActivityType | null {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  placeActivity(land: INaturesSanctuaryLand): IDDBActivityData {
    return {
      name: NaturesSanctuary.placeName(land),
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
      data: {
        duration: {
          value: "1",
          units: "minute",
          override: true,
        },
        range: {
          value: "120",
          units: "ft",
          override: true,
        },
        target: {
          override: true,
          prompt: true,
          affects: {
            type: "ally",
          },
          template: {
            type: "cube",
            size: "15",
            units: "ft",
            contiguous: false,
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: NaturesSanctuary.wardName(land) }),
        ],
      },
    };
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return this.placeActivity(NaturesSanctuary.LANDS[0]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    return [
      ...NaturesSanctuary.LANDS.slice(1).map((land): IDDBAdditionalActivity => ({
        init: {
          name: NaturesSanctuary.placeName(land),
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
        },
        overrides: this.placeActivity(land),
      })),
      {
        init: {
          name: "Move Sanctuary",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: false,
          generateRange: true,
          generateConsumption: false,
          generateUtility: true,
          activationOverride: {
            type: "bonus",
            value: null,
            condition: "Move the sanctuary up to 60 feet",
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 120,
          noTemplate: true,
          noConsumeTargets: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) return [];
    return NaturesSanctuary.LANDS.flatMap((land) => {
      const ward = {
        name: NaturesSanctuary.wardName(land),
        statuses: ["coverHalf"],
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange(land.type),
        ],
        options: {
          durationSeconds: 60,
        },
      };
      return [
        { ...ward, activityMatch: NaturesSanctuary.placeName(land) },
        // the copy the sanctuary's region applies to allies inside it
        { ...ward, standalone: true },
      ];
    });
  }

}
