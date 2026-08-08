import _Mutagen from "./_Mutagen";

/**
 * Immunity to grappled and restrained, plus paralyzed from 11th level, at the cost of
 * Strength checks.
 */
export default class FormulaMobility extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    const bands: { conditions: string[]; level: { min: number | null; max: number | null } }[] = [
      { conditions: ["grappled", "restrained"], level: { min: null, max: 10 } },
      { conditions: ["grappled", "restrained", "paralyzed"], level: { min: 11, max: null } },
    ];

    return bands.map((band, index) => this.mutagenEffect({
      idPostfix: index,
      level: band.level,
      changes: [
        ...band.conditions.map((condition) => _Mutagen.conditionImmunityChange(condition)),
        _Mutagen.disadvantageCheck("str"),
      ],
    }));
  }

}
