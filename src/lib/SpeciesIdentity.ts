/** DDB allocates species and subrace IDs in separate entity-type namespaces. */
export function speciesKey(
  species: { entityRaceId?: unknown; entityRaceTypeId?: unknown } | null | undefined,
): string | null {
  const id = species?.entityRaceId;
  const type = species?.entityRaceTypeId;
  if (
    typeof id !== "number" ||
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    typeof type !== "number" ||
    !Number.isSafeInteger(type) ||
    type <= 0
  )
    return null;
  return `${type}:${id}`;
}

export function isSpeciesKey(value: unknown): value is string {
  if (typeof value !== "string" || !(/^[1-9]\d*:[1-9]\d*$/).test(value)) return false;
  const [type, id] = value.split(":").map(Number);
  return speciesKey({ entityRaceTypeId: type, entityRaceId: id }) === value;
}

/** Older imports omitted the type; only exclude them when their remaining metadata is unambiguous. */
export function existingSpeciesKey(
  flags: Partial<IDDBImporterItemFlags>,
  catalog: readonly IDDBMuleSpeciesDefinition[],
): string | null {
  if (flags.entityRaceTypeId !== undefined) return speciesKey(flags);
  const candidates = catalog.filter((species) => species.entityRaceId === flags.entityRaceId);
  const identities = new Set(candidates.map(speciesKey).filter((key): key is string => key !== null));
  // Lineage labels such as High Elf need not contain the catalogue name as a prefix.
  if (identities.size === 1) return [...identities][0];
  const name = flags.fullRaceName ?? flags.fullName;
  const matches = new Set(
    candidates
      .filter(
        (species) =>
          (flags.baseRaceId === undefined || species.baseRaceId === flags.baseRaceId) &&
          // Muncher names can append a source book or a selected lineage in parentheses.
          (name === undefined || species.fullName === name || name.startsWith(`${species.fullName} (`)),
      )
      .map(speciesKey)
      .filter((key): key is string => key !== null),
  );
  return matches.size === 1 ? [...matches][0] : null;
}
