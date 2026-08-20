import { DICTIONARY } from "../config/_module";
import CompendiumHelper from "./CompendiumHelper";
import Iconizer from "./Iconizer";
import logger from "./Logger";
import utils from "./Utils";

// The dnd5e tool categories that can hold children. Anything else is registered as a
// top level entry, which the system's TraitsConfig sweeps into its "Other" group.
const GROUPED_TOOL_TYPES = ["art", "game", "music"];
const PLACEHOLDER_PREFIX = "ddbi";
const FALLBACK_TOOL_IMG = "systems/dnd5e/icons/svg/items/tool.svg";
const FALLBACK_FOLDER_NAME = "Custom Tools";
const FALLBACK_FOLDER_TAG = "customTools";

export default class DDBToolProficiencies {

  // Everything we have added to CONFIG.DND5E.tools
  static registered = new Map<string, ICustomToolDefinition>();

  /**
   * The key a tool is stored under in system.tools. dnd5e tools use their system id,
   * anything else gets a generated one. Both the actor proficiency and the tool item's
   * system.type.baseItem run through this, so item and actor proficiencies line up.
   */
  static getToolKey({ baseTool = null, name }: { baseTool?: string | null; name: string }): string {
    return utils.getToolKey({ baseTool, name });
  }

  static #placeholderId(key: string): string {
    return `${PLACEHOLDER_PREFIX}${utils.idString(key)}`.slice(0, 20);
  }

  /**
   * Give the tool a label the system can find. dnd5e resolves tool labels from the linked
   * compendium item's name, and falls back to searching CONFIG.DND5E.toolProficiencies
   * before giving up and displaying the raw key.
   */
  static #registerLabel(key: string, name: string, toolType: string): void {
    if (!GROUPED_TOOL_TYPES.includes(toolType)) {
      foundry.utils.setProperty(CONFIG.DND5E.toolProficiencies, key, { label: name });
      return;
    }

    const group = foundry.utils.getProperty(CONFIG.DND5E.toolProficiencies, toolType);
    if (foundry.utils.getType(group) !== "Object") {
      foundry.utils.setProperty(CONFIG.DND5E.toolProficiencies, toolType, { label: group, children: {} });
    }
    foundry.utils.setProperty(CONFIG.DND5E.toolProficiencies, `${toolType}.children.${key}`, { label: name });
  }

  /**
   * Register a tool D&D Beyond knows about but dnd5e does not. Without this the entry is
   * still stored on the actor, but the character sheet filters it out of display and tool
   * checks silently downgrade to a plain ability check.
   */
  static register(tool: ICustomToolDefinition): boolean {
    const { key, name, ability, toolType } = tool;
    if (!key || key in CONFIG.DND5E.tools) return false;

    foundry.utils.setProperty(CONFIG.DND5E.tools, key, { ability, id: DDBToolProficiencies.#placeholderId(key) });
    DDBToolProficiencies.#registerLabel(key, name, toolType);
    DDBToolProficiencies.registered.set(key, { ...tool });
    logger.debug(`Registered D&D Beyond tool proficiency ${name} as ${key}`);
    return true;
  }

  static registerAll(tools: ICustomToolDefinition[]): void {
    for (const tool of tools) {
      DDBToolProficiencies.register(tool);
    }
  }

  /**
   * Register every tool in the dictionary that dnd5e has no key for. Called at setup,
   * after the system has localized its config but before anything renders an actor.
   */
  static registerDictionaryTools(): void {
    if (!utils.getSetting<boolean>("add-ddb-tools")) return;

    for (const prof of DICTIONARY.actor.proficiencies) {
      if (prof.type !== "Tool" || prof.baseTool) continue;
      DDBToolProficiencies.register({
        key: DDBToolProficiencies.getToolKey(prof),
        name: prof.name,
        ability: (prof.ability ?? "dex") as T5eAbility,
        toolType: prof.toolType as TToolType ?? "",
      });
    }
  }
  /**
   * D&D Beyond's own description for a tool, matched out of CONFIG.DDB.tools.
   *
   * Matching is on the generated key rather than the raw name, so the curly and ascii
   * apostrophe spellings of names like Surgeon's Tools both resolve.
   *
   * Returns "" when there is nothing to use. The committed fallback config has the
   * description stripped from every tool (see tools/ddb-config-transform.mjs), so this
   * only finds one when the live config has been fetched.
   */
  static getDDBToolDescription(key: string): string {
    const tools = foundry.utils.getProperty(CONFIG, "DDB.tools") as IDDBConfigTool[] | undefined;
    if (!tools) return "";
    const match = tools.find((tool) => DDBToolProficiencies.getToolKey({ name: tool.name }) === key);
    return match?.description ?? "";
  }

  /**
   * Build the stub tool item for a registered tool. One item per tool rather than a single
   * shared fallback: dnd5e reads the linked item's name back out as the tool's label
   * (Trait.keyLabel and Trait.categories both prefer it over anything in the config), so
   * every tool pointed at one shared item would display that item's name.
   *
   * Public so the shape can be asserted in tests, not intended for outside use.
   */
  static buildFallbackItemData(
    { key, name, ability, toolType, description }: ICustomToolDefinition,
    folderId: string | null = null,
  ) {
    return {
      name,
      type: "tool",
      img: FALLBACK_TOOL_IMG,
      folder: folderId,
      system: {
        type: { value: toolType, baseItem: key },
        ability,
        // the character's own text wins: DDB's catalogue has nothing for a tool they invented
        description: { value: description || DDBToolProficiencies.getDDBToolDescription(key) },
      },
      flags: {
        ddbimporter: {
          toolFallback: true,
          baseItem: key,
          dndbeyond: { type: "Tool" },
        },
      },
    };
  }

  static async #addIcons<T>(items: T[]): Promise<T[]> {
    try {
      return await Iconizer.updateIcons({
        documents: items as unknown as TDDBItemImporterDocument[],
      }) as unknown as T[];
    } catch (error) {
      logger.warn("Unable to add icons to fallback tool items, falling back to the generic tool icon", { error });
      return items;
    }
  }

  static async #getFallbackFolderId(compendium: CompendiumCollection.Any): Promise<string | null> {
    try {
      const folder = await CompendiumHelper.createFolder({
        pack: compendium,
        name: FALLBACK_FOLDER_NAME,
        flagTag: FALLBACK_FOLDER_TAG,
        entityType: utils.entityMap().get("tool"),
      });
      return folder?._id ?? null;
    } catch (error) {
      logger.warn(`Unable to create the "${FALLBACK_FOLDER_NAME}" compendium folder`, { error });
      return null;
    }
  }

  /**
   * Create stub tool items for any registered tool the compendium has no item for, and
   * point the config at them. Returns the tools still left unlinked.
   */
  static async #createFallbackItems(
    compendium: CompendiumCollection.Any,
    unlinked: ICustomToolDefinition[],
  ): Promise<ICustomToolDefinition[]> {
    if (!game.user?.isGM) {
      logger.debug(`${unlinked.length} D&D Beyond tools have no item, a GM must log in to create them`);
      return unlinked;
    }

    const wasLocked = compendium.locked;
    try {
      if (wasLocked) compendium.configure({ locked: false });

      const folderId = await DDBToolProficiencies.#getFallbackFolderId(compendium);
      const items = await DDBToolProficiencies.#addIcons(
        unlinked.map((tool) => DDBToolProficiencies.buildFallbackItemData(tool, folderId)),
      );
      const created = await Item.createDocuments(
        items as unknown as Item.CreateInput[],
        { pack: compendium.collection },
      );
      for (const item of created ?? []) {
        const key = foundry.utils.getProperty(item, "flags.ddbimporter.baseItem") as string | undefined;
        if (!key) continue;
        foundry.utils.setProperty(CONFIG.DND5E.tools, `${key}.id`, item.uuid);
        logger.debug(`Created fallback tool item for ${key} at ${item.uuid}`);
      }
      return [];
    } catch (error) {
      logger.warn("Unable to create fallback tool items, D&D Beyond tools will keep their placeholder ids", { error });
      return unlinked;
    } finally {
      if (wasLocked) compendium.configure({ locked: true });
    }
  }

  /**
   * Delete stub items that are no longer needed. A fresh world creates a stub for every
   * tool, but a later item munch brings might bring in the real thing
   */
  static async #deleteFallbackItems(compendium: CompendiumCollection.Any, ids: string[]): Promise<void> {
    if (!game.user?.isGM) {
      logger.debug(`${ids.length} redundant fallback tool items found, a GM must log in to remove them`);
      return;
    }

    const wasLocked = compendium.locked;
    try {
      if (wasLocked) compendium.configure({ locked: false });
      await Item.deleteDocuments(ids, { pack: compendium.collection });
      logger.debug(`Removed ${ids.length} superseded fallback tool items`);
    } catch (error) {
      logger.warn("Unable to remove superseded fallback tool items", { error });
    } finally {
      if (wasLocked) compendium.configure({ locked: true });
    }
  }

  /**
   * For each registered tool: link it to the best item available, create a stub if there
   * is nothing, and mark any stub we are no longer using for deletion.
   */
  /**
   * Does this compendium item represent the given tool?
   *
   * system.type.baseItem is the authoritative link, but it is only populated when the
   * item was munched with a dictionary entry already in place for that name. Anything
   * munched before its entry was added, or by an older version, has it empty and would
   * otherwise be invisible here, leaving a duplicate stub alongside the real item.
   * The name is the reliable fallback for a tool.
   */
  static #isItemForTool(entry: IToolIndexEntry, key: string): boolean {
    const baseItem = foundry.utils.getProperty(entry, "system.type.baseItem") as string | undefined;
    if (baseItem) return baseItem === key;
    if (entry.type !== "tool" || !entry.name) return false;
    return DDBToolProficiencies.getToolKey({ name: entry.name }) === key;
  }

  static planCompendiumSync(index: IToolIndexEntry[]): IToolSyncPlan {
    const plan: IToolSyncPlan = {
      links: [], missing: [], redundant: [], needsDescription: [], needsBaseItem: [],
    };

    for (const tool of DDBToolProficiencies.registered.values()) {
      const entries = index.filter((entry) => DDBToolProficiencies.#isItemForTool(entry, tool.key));
      const real = entries.find((entry) => !foundry.utils.getProperty(entry, "flags.ddbimporter.toolFallback"));
      const keep = real ?? entries[0];

      if (!keep) {
        plan.missing.push(tool);
        continue;
      }

      // everything we are not keeping that we created ourselves is safe to remove: either
      // a real item has replaced it, or it is a duplicate stub
      plan.redundant.push(...entries
        .filter((entry) => entry !== keep && foundry.utils.getProperty(entry, "flags.ddbimporter.toolFallback"))
        .map((entry) => entry._id));

      plan.links.push({ key: tool.key, uuid: keep.uuid });

      // a stub created before the live DDB config arrived has no description
      if (foundry.utils.getProperty(keep, "flags.ddbimporter.toolFallback")
        && !foundry.utils.getProperty(keep, "system.description.value")) {
        plan.needsDescription.push({ _id: keep._id, key: tool.key });
      }

      // matched on name, so the item predates its dictionary entry. dnd5e reads
      // actor.system.tools[baseItem] to decide whether an owned copy is proficient, which
      // an empty baseItem can never satisfy.
      if (!foundry.utils.getProperty(keep, "system.type.baseItem")) {
        plan.needsBaseItem.push({ _id: keep._id, key: tool.key });
      }
    }

    return plan;
  }

  /**
   * Set system.type.baseItem on items that were munched before a dictionary entry existed
   * for their name, so it was never populated.
   *
   * This is the same value a re-munch would write today, and without it dnd5e's
   * ToolData#proficiencyMultiplier looks up actor.system.tools[""] and an owned copy of
   * the item never counts as proficient.
   */
  static async #repairBaseItems(
    compendium: CompendiumCollection.Any,
    needsBaseItem: { _id: string; key: string }[],
  ): Promise<void> {
    if (!game.user?.isGM) {
      logger.debug(`${needsBaseItem.length} tool items have no baseItem, a GM must log in to repair them`);
      return;
    }

    const updates = needsBaseItem.map(({ _id, key }) => ({ _id, "system.type.baseItem": key }));
    const wasLocked = compendium.locked;
    try {
      if (wasLocked) compendium.configure({ locked: false });
      await Item.updateDocuments(updates as unknown as Item.UpdateInput[], { pack: compendium.collection });
      logger.debug(`Repaired the baseItem of ${updates.length} tool items`);
    } catch (error) {
      logger.warn("Unable to repair the baseItem of tool items", { error });
    } finally {
      if (wasLocked) compendium.configure({ locked: true });
    }
  }

  /**
   * Fill in descriptions on stubs that were created before the live DDB config arrived.
   *
   * loadDDBConfig puts the committed fallback in place first and fetches the live config
   * afterwards without awaiting it, and the fallback has every tool description stripped.
   * So the first world load can create stubs with nothing to say; this backfills them on
   * any later run once a description is actually available.
   */
  static async #addDescriptions(
    compendium: CompendiumCollection.Any,
    needsDescription: { _id: string; key: string }[],
  ): Promise<void> {
    const updates = needsDescription
      .map(({ _id, key }) => ({
        _id,
        description: DDBToolProficiencies.registered.get(key)?.description
          || DDBToolProficiencies.getDDBToolDescription(key),
      }))
      .filter(({ description }) => description !== "")
      .map(({ _id, description }) => ({ _id, "system.description.value": description }));

    if (updates.length === 0) return;
    if (!game.user?.isGM) {
      logger.debug(`${updates.length} fallback tool items have no description, a GM must log in to add them`);
      return;
    }

    const wasLocked = compendium.locked;
    try {
      if (wasLocked) compendium.configure({ locked: false });
      await Item.updateDocuments(updates as unknown as Item.UpdateInput[], { pack: compendium.collection });
      logger.debug(`Added D&D Beyond descriptions to ${updates.length} fallback tool items`);
    } catch (error) {
      logger.warn("Unable to add descriptions to fallback tool items", { error });
    } finally {
      if (wasLocked) compendium.configure({ locked: true });
    }
  }

  /**
   * Point registered tools at a compendium item, creating a stub for anything the
   * compendium has no item for and clearing up stubs that a real item has since replaced.
   *
   * Linking an item is what gives a custom tool its icon and a working reference link, and
   * is also what stops dnd5e's favourites handling throwing on it: character-sheet.mjs
   * destructures the base item lookup without a guard, so an id that resolves to nothing
   * breaks the sheet render as soon as the tool is favourited.
   */
  static async syncCompendiumItems(): Promise<void> {
    if (!utils.getSetting<boolean>("add-ddb-tools")) return;

    // free text proficiencies are per character, so they are replayed from actor flags
    // rather than a world setting, which a non GM importer could not write.
    for (const actor of game.actors ?? []) {
      const customTools = foundry.utils.getProperty(actor, "flags.ddbimporter.dndbeyond.customTools") as
        ICustomToolDefinition[] | undefined;
      if (customTools) DDBToolProficiencies.registerAll(customTools);
    }

    if (DDBToolProficiencies.registered.size === 0) return;

    const compendium = CompendiumHelper.getCompendiumType("tool", false);
    if (!compendium) {
      logger.debug("No item compendium configured, D&D Beyond tools will use placeholder items");
      return;
    }

    const index = await compendium.getIndex({
      fields: ["system.type.baseItem", "system.description.value", "flags.ddbimporter.toolFallback"],
    });
    const plan = DDBToolProficiencies.planCompendiumSync([...index] as unknown as IToolIndexEntry[]);

    for (const { key, uuid } of plan.links) {
      if (foundry.utils.getProperty(CONFIG.DND5E.tools, `${key}.id`) === uuid) continue;
      foundry.utils.setProperty(CONFIG.DND5E.tools, `${key}.id`, uuid);
      logger.debug(`Linked D&D Beyond tool ${key} to ${uuid}`);
    }

    if (plan.missing.length > 0) await DDBToolProficiencies.#createFallbackItems(compendium, plan.missing);
    if (plan.redundant.length > 0) await DDBToolProficiencies.#deleteFallbackItems(compendium, plan.redundant);
    if (plan.needsDescription.length > 0) await DDBToolProficiencies.#addDescriptions(compendium, plan.needsDescription);
    if (plan.needsBaseItem.length > 0) await DDBToolProficiencies.#repairBaseItems(compendium, plan.needsBaseItem);
  }

}
