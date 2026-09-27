import logger from "./Logger";

/** A pasted document link, e.g. `@UUID[Compendium.world.macros.Macro.abc]{My Macro}`. */
const DOCUMENT_LINK = /^@UUID\[([^\]]+)\](?:\{[^}]*\})?$/;

/**
 * Resolve a user-entered Foundry macro reference to the macro.
 *
 * Accepts a world macro uuid (`Macro.<id>`), a compendium macro uuid
 * (`Compendium.<scope>.<pack>.Macro.<id>`), either one wrapped in a pasted `@UUID[...]{Name}`
 * link, or a world macro name. Compendium macros are returned in place rather than imported:
 * Foundry executes them directly, with the pack's ownership deciding who may run them.
 *
 * A uuid-shaped string that resolves to nothing falls back to the name lookup, so a world
 * macro whose name happens to start with "Macro." keeps working.
 * @param reference  The macro field's value.
 * @returns The macro, or null when nothing matches.
 */
export default async function resolveFoundryMacro(reference: string | null | undefined): Promise<Macro.Implementation | null> {
  const trimmed = (reference ?? "").trim();
  if (!trimmed) return null;
  const value = DOCUMENT_LINK.exec(trimmed)?.[1] ?? trimmed;

  if (value.startsWith("Macro.") || value.startsWith("Compendium.")) {
    try {
      const document = await fromUuid(value) as { documentName?: string } | null;
      if (document?.documentName === "Macro") return document as unknown as Macro.Implementation;
      if (document) logger.warn(`Macro reference "${value}" is a ${document.documentName}, not a Macro`);
    } catch (error) {
      logger.warn(`Unable to load macro "${value}"`, error);
    }
  }

  return game.macros.find((macro) => macro.name === value) ?? null;
}
