/**
 * Pure transforms for refreshing data/fallback-config.json from the live
 * D&D Beyond /api/config/json payload. No I/O here so it can be unit tested.
 *
 * Two rules are enforced:
 *  1. Only the top level keys that already exist in the committed file survive.
 *  2. Any `description` that is currently blank ("" or null) stays blank, so we
 *     never start redistributing text that was deliberately stripped.
 */

const REDACT_FIELD = "description";

const isPlainObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

const isBlank = (value) => value === "" || value === null;

// Fields used to identify an array member, most stable first. `conditions`
// entries are `{ definition: { id, name, ... } }` wrappers, hence the nested
// candidates.
const MATCH_FIELDS = [["id"], ["name"], ["definition", "id"], ["definition", "name"]];

function getPath(node, fields) {
  let current = node;
  for (const field of fields) {
    if (!isPlainObject(current)) return undefined;
    current = current[field];
  }
  return current;
}

/**
 * Identify an array member so it can be matched again in a freshly fetched
 * payload where ordering may differ. Index is a last resort, only used for
 * arrays of anonymous objects.
 */
function entrySegment(entry, index) {
  for (const fields of MATCH_FIELDS) {
    const value = getPath(entry, fields);
    if (value !== undefined && value !== null && typeof value !== "object") {
      return { type: "match", fields, value };
    }
  }
  return { type: "index", value: index };
}

const fieldSegment = (name) => ({ type: "field", value: name });

const segmentLabel = (segment) =>
  segment.type === "match" ? `${segment.fields.join(".")}=${segment.value}` : `index=${segment.value}`;

/** Human readable form of a path, e.g. `sourceCategories[id=28].description`. */
export function displayPath(path) {
  return path
    .map((segment) => (segment.type === "field" ? `.${segment.value}` : `[${segmentLabel(segment)}]`))
    .join("")
    .replace(/^\./, "");
}

function walk(node, path, visit) {
  if (Array.isArray(node)) {
    node.forEach((entry, index) => walk(entry, [...path, entrySegment(entry, index)], visit));
    return;
  }
  if (!isPlainObject(node)) return;
  for (const [key, value] of Object.entries(node)) {
    const childPath = [...path, fieldSegment(key)];
    if (key === REDACT_FIELD) {
      if (isBlank(value)) visit(childPath, value);
    } else {
      walk(value, childPath, visit);
    }
  }
}

/**
 * Every blank `description` in the given config, as `{ path, value }` where
 * `path` is a segment list resolvable against another config.
 */
export function collectRedactions(config) {
  const redactions = [];
  walk(config, [], (path, value) => {
    redactions.push({ path, value, display: displayPath(path) });
  });
  return redactions;
}

/**
 * Shape of an object's location, array indices collapsed: `armor[]`,
 * `conditions[].definition`. Descriptions are stripped or kept per shape, not
 * per top level key, because `conditions[]` carries none while
 * `conditions[].definition` carries all of them.
 */
function shapeKey(path) {
  return path
    .map((segment) => (segment.type === "field" ? `.${segment.value}` : "[]"))
    .join("")
    .replace(/^\./, "");
}

function walkObjects(node, path, visit) {
  if (Array.isArray(node)) {
    node.forEach((entry, index) => walkObjects(entry, [...path, entrySegment(entry, index)], visit));
    return;
  }
  if (!isPlainObject(node)) return;
  visit(node, shapeKey(path), path);
  for (const [key, value] of Object.entries(node)) {
    if (key === REDACT_FIELD) continue;
    walkObjects(value, [...path, fieldSegment(key)], visit);
  }
}

/**
 * Which shapes carry a `description` field at all in the committed file. Some
 * entries (armor, tools, weapons) have the field deleted outright rather than
 * blanked, so a fetched payload has to have it deleted again.
 */
export function collectDescriptionShapes(config) {
  const shapes = new Map();
  walkObjects(config, [], (node, shape) => {
    shapes.set(shape, (shapes.get(shape) ?? false) || REDACT_FIELD in node);
  });
  return shapes;
}

/**
 * Delete `description` wherever the committed file never had one for that
 * shape. Mutates `config`. Shapes absent from the committed file are left
 * alone and reported, because nobody has decided about them yet.
 */
export function applyOmissions(config, shapes) {
  const removed = [];
  const unknownShapes = new Map();
  walkObjects(config, [], (node, shape, path) => {
    if (!(REDACT_FIELD in node)) return;
    const known = shapes.get(shape);
    if (known === undefined) {
      unknownShapes.set(shape, (unknownShapes.get(shape) ?? 0) + 1);
      return;
    }
    if (known) return;
    delete node[REDACT_FIELD];
    removed.push({ shape, display: displayPath([...path, fieldSegment(REDACT_FIELD)]) });
  });
  return { removed, unknownShapes };
}

function resolveParent(root, path) {
  let node = root;
  for (const segment of path.slice(0, -1)) {
    if (node === undefined || node === null) return undefined;
    if (segment.type === "field") {
      node = isPlainObject(node) ? node[segment.value] : undefined;
    } else if (segment.type === "index") {
      node = Array.isArray(node) ? node[segment.value] : undefined;
    } else {
      node = Array.isArray(node)
        ? node.find((entry) => getPath(entry, segment.fields) === segment.value)
        : undefined;
    }
  }
  return node;
}

/**
 * Re-apply blanked descriptions. Mutates `config` in place and reports which
 * redactions could not be placed because the entry (or the field) is gone.
 */
export function applyRedactions(config, redactions) {
  const applied = [];
  const missing = [];
  for (const redaction of redactions) {
    const parent = resolveParent(config, redaction.path);
    const field = redaction.path[redaction.path.length - 1].value;
    if (!isPlainObject(parent) || !(field in parent)) {
      missing.push(redaction);
      continue;
    }
    if (parent[field] !== redaction.value) applied.push(redaction);
    parent[field] = redaction.value;
  }
  return { applied, missing };
}

/**
 * Build the output object from the remote payload, restricted to the top level
 * keys already in `current` and in the same order so diffs stay readable.
 */
export function mergeTopLevelKeys(current, remote) {
  const merged = {};
  const keptStale = [];
  for (const key of Object.keys(current)) {
    if (Object.hasOwn(remote, key)) {
      merged[key] = remote[key];
    } else {
      merged[key] = current[key];
      keptStale.push(key);
    }
  }
  const droppedKeys = Object.keys(remote).filter((key) => !Object.hasOwn(current, key));
  return { merged, droppedKeys, keptStale };
}

const entryLabel = (entry, index) => segmentLabel(entrySegment(entry, index));

/**
 * Entries new to a key that already contains redactions, arriving with
 * non-blank description text. Worth a warning: nobody has decided yet whether
 * that text is safe to ship.
 */
export function describeNewDescriptions(current, remote, redactions) {
  const redactedKeys = new Set(redactions.map((redaction) => redaction.path[0].value));
  const found = [];
  for (const key of redactedKeys) {
    const currentEntries = current[key];
    const remoteEntries = remote[key];
    if (!Array.isArray(currentEntries) || !Array.isArray(remoteEntries)) continue;
    const known = new Set(currentEntries.map((entry, index) => entryLabel(entry, index)));
    remoteEntries.forEach((entry, index) => {
      if (!isPlainObject(entry) || known.has(entryLabel(entry, index))) return;
      if (isBlank(entry[REDACT_FIELD]) || entry[REDACT_FIELD] === undefined) return;
      found.push({ key, entry: entryLabel(entry, index), name: entry.name ?? null });
    });
  }
  return found;
}

/**
 * Serialise close to the committed file's shape so prettier only has to
 * normalise widths: objects always expanded (prettier's json parser preserves
 * that with objectWrap: "preserve"), arrays inline unless they hold objects or
 * arrays. Prettier then breaks any inline array that overruns printWidth.
 */
export function toPrettyJson(value, indentLevel = 0) {
  const pad = "  ".repeat(indentLevel);
  const inner = "  ".repeat(indentLevel + 1);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const holdsContainers = value.some((entry) => Array.isArray(entry) || isPlainObject(entry));
    if (!holdsContainers) return `[${value.map((entry) => JSON.stringify(entry)).join(", ")}]`;
    const entries = value.map((entry) => `${inner}${toPrettyJson(entry, indentLevel + 1)}`);
    return `[\n${entries.join(",\n")}\n${pad}]`;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value).filter(([, entry]) => entry !== undefined);
    if (entries.length === 0) return "{}";
    const lines = entries.map(([key, entry]) => `${inner}${JSON.stringify(key)}: ${toPrettyJson(entry, indentLevel + 1)}`);
    return `{\n${lines.join(",\n")}\n${pad}}`;
  }

  return JSON.stringify(value) ?? "null";
}

/** Per key entry churn, for the CLI summary. */
export function summariseDiff(current, merged) {
  const changes = [];
  for (const key of Object.keys(merged)) {
    const before = current[key];
    const after = merged[key];
    if (!Array.isArray(before) || !Array.isArray(after)) {
      if (JSON.stringify(before) !== JSON.stringify(after)) changes.push({ key, changed: true, added: [], removed: [] });
      continue;
    }
    const beforeLabels = before.map((entry, index) => entryLabel(entry, index));
    const afterLabels = after.map((entry, index) => entryLabel(entry, index));
    const beforeSet = new Set(beforeLabels);
    const afterSet = new Set(afterLabels);
    const added = afterLabels.filter((label) => !beforeSet.has(label));
    const removed = beforeLabels.filter((label) => !afterSet.has(label));
    const changed = added.length > 0 || removed.length > 0 || JSON.stringify(before) !== JSON.stringify(after);
    if (changed) changes.push({ key, changed, added, removed });
  }
  return changes;
}
