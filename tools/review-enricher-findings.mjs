#!/usr/bin/env node
/**
 * Interactive triage for the description-audit findings in audit-output/.
 *
 *   npm run audit:review                       # prompt for every filter
 *   npm run audit:review -- --confidence high --class Artificer
 *   npm run audit:review -- --help
 *
 * Findings are grouped by the enricher they resolve to. For each group you can
 * edit a scaffold in $EDITOR and install it — the tool rebuilds the barrels,
 * typechecks, re-runs the owning audit suite and asserts the findings are gone,
 * rolling every touched file back if any step fails — or record the finding as a
 * permanent false positive in the decisions manifest.
 *
 * Decisions manifests live in tests/audit, which is a git submodule: anything
 * this tool writes there needs its own commit in that repo.
 *
 * Pure helpers (and their unit tests) live in ./enricher-audit-review-lib.mjs.
 */

import fs from "node:fs";
import console from "node:console";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import prompts from "prompts";

import {
  DOMAIN_NAMES,
  RULE_EXPLANATIONS,
  artifactPathForFinding,
  buildSourceCatalog,
  changedSnapshotPaths,
  decorateFinding,
  domainConfig,
  expectedBarrelPaths,
  filterFindings,
  groupFindings,
  listBarrelFiles,
  manifestPathForFinding,
  normaliseKey,
  parseReviewArgs,
  renderStarter,
  restoreSnapshot,
  snapshotFiles,
  updateDecisionManifest,
  updateSuppressionManifest,
  validateEditedProposal,
  validationTargets,
} from "./enricher-audit-review-lib.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT_OUTPUT = path.join(REPO_ROOT, "audit-output");
const ENRICHER_ROOT = path.join(REPO_ROOT, "src/parser/enrichers");

class ReviewCancelled extends Error {}

function printHelp() {
  console.log(`Usage: npm run audit:review -- [options]

Any filter left unset is asked for interactively; passing none reviews everything.

Options:
  --confidence <high|medium|all>     Repeat or comma-separate values
  --domain <${DOMAIN_NAMES.join("|")}|all>  Limit content domains
  --class <name>                     Limit classes
  --subclass <name>                  Limit subclasses
  --species <name>                   Limit species
  --source <id|abbreviation|title>   Limit source books
  --source-category <id|name>        Limit DDB source categories
  --editor <command>                 Override $VISUAL/$EDITOR
  --refresh / --no-refresh           Regenerate or reuse audit artifacts
  --help, -h                         Show this help

Accepted decisions and permanent ignores are written to tests/audit, a git
submodule; commit them there as well as in this repo.
`);
}

async function ask(question) {
  let cancelled = false;
  const answer = await prompts(question, {
    onCancel: () => {
      cancelled = true;
      return false;
    },
  });
  if (cancelled) throw new ReviewCancelled("Review cancelled.");
  return answer.value;
}

function run(command, args, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = capture ? `\n${result.stdout ?? ""}${result.stderr ?? ""}` : "";
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}.${detail}`);
  }
  return result;
}

function refreshAudits() {
  console.log("\nRefreshing class, feat, and species audit findings…");
  run("npm", ["run", "audit:enrichers"]);
}

function artifactFiles() {
  if (!fs.existsSync(AUDIT_OUTPUT)) return [];
  return fs.readdirSync(AUDIT_OUTPUT)
    .filter((file) => file.endsWith(".description-audit.json"))
    .sort()
    .map((file) => path.join(AUDIT_OUTPUT, file));
}

function loadFindings(catalog) {
  const findings = artifactFiles().flatMap((file) => JSON.parse(fs.readFileSync(file, "utf8"))
    .map((finding) => decorateFinding(finding, catalog)));
  const outdated = findings.find((finding) => !finding.featureText || !finding.suggestedEnricherPath
    || !Array.isArray(finding.sourceIds));
  if (outdated) {
    throw new Error("Audit artifacts predate the interactive-review metadata. Run again with --refresh.");
  }
  return findings;
}

function uniqueValues(findings, getter) {
  const values = findings.flatMap(getter).filter((value) => value !== null && value !== undefined && value !== "");
  return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b)));
}

function multiChoices(values) {
  return values.map((value) => ({ title: String(value), value: String(value) }));
}

async function completeFilters(options, findings) {
  const filters = { ...options };
  if (!filters.confidence.length) {
    filters.confidence = [await ask({
      type: "select",
      name: "value",
      message: "Confidence level to review",
      initial: 0,
      choices: [
        { title: "High", value: "high" },
        { title: "Medium", value: "medium" },
        { title: "High and medium", value: "all" },
      ],
    })];
  }
  if (!filters.domains.length) {
    filters.domains = await ask({
      type: "multiselect",
      name: "value",
      message: "Content domains (none means all)",
      choices: multiChoices(DOMAIN_NAMES),
    });
  }
  const selectedDomains = filters.domains.length ? filters.domains.map(normaliseKey) : DOMAIN_NAMES;
  const domains = selectedDomains.includes("all") ? DOMAIN_NAMES : selectedDomains;

  if (domains.includes("class") && !filters.classes.length) {
    filters.classes = await ask({
      type: "multiselect",
      name: "value",
      message: "Classes (none means all)",
      choices: multiChoices(uniqueValues(findings.filter((finding) => finding.domain === "class"), (finding) => finding.classNames)),
    });
  }
  if (domains.includes("class") && !filters.subclasses.length) {
    const classFiltered = filterFindings(findings, { ...filters, subclasses: [], species: [], sources: [], sourceCategories: [] });
    filters.subclasses = await ask({
      type: "multiselect",
      name: "value",
      message: "Subclasses (none means all)",
      choices: multiChoices(uniqueValues(classFiltered, (finding) => finding.subclassNames)),
    });
  }
  if (domains.includes("species") && !filters.species.length) {
    filters.species = await ask({
      type: "multiselect",
      name: "value",
      message: "Species (none means all)",
      choices: multiChoices(uniqueValues(findings.filter((finding) => finding.domain === "species"), (finding) => finding.speciesNames)),
    });
  }
  if (!filters.sourceCategories.length) {
    filters.sourceCategories = await ask({
      type: "multiselect",
      name: "value",
      message: "DDB source categories (none means all)",
      choices: multiChoices(uniqueValues(findings, (finding) => finding.sourceCategories.map((category) => category.name))),
    });
  }
  if (!filters.sources.length) {
    const categoryFiltered = filterFindings(findings, { ...filters, sources: [] });
    const books = new Map(categoryFiltered.flatMap((finding) => finding.sourceBooks).map((book) => [String(book.id), book]));
    filters.sources = await ask({
      type: "multiselect",
      name: "value",
      message: "Source books (none means all)",
      choices: [...books.values()]
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .map((book) => ({ title: `${book.name} — ${book.description}`, value: String(book.id) })),
    });
  }
  return filters;
}

function heading(value) {
  return process.stdout.isTTY ? `\u001b[1m${value}\u001b[0m` : value;
}

function evidence(value) {
  return process.stdout.isTTY ? `\u001b[33m${value}\u001b[0m` : value;
}

function showGroup(group, index, total) {
  const first = group.findings[0];
  const books = [...new Map(group.findings.flatMap((finding) => finding.sourceBooks).map((book) => [book.id, book])).values()];
  const categories = [...new Set(books.map((book) => book.categoryName))];
  console.log(`\n${heading(`[${index + 1}/${total}] ${group.targetRelative}`)}`);
  console.log(`Domain: ${first.domain} | Feature: ${first.featureName} | Current enricher: ${first.enricher} | Decision: ${first.decision}`);
  if (first.classNames.length) console.log(`Class: ${first.classNames.join(", ")}`);
  if (first.subclassNames.length) console.log(`Subclasses: ${first.subclassNames.join(", ")}`);
  if (first.speciesNames.length) console.log(`Species: ${first.speciesNames.join(", ")}`);
  if (books.length) console.log(`Sources: ${books.map((book) => `${book.name} (${book.description})`).join(", ")}`);
  if (categories.length) console.log(`Source categories: ${categories.join(", ")}`);

  console.log(`\n${heading("Feature text")}:\n${first.featureText}`);
  const actionTexts = [...new Map(group.findings
    .filter((finding) => finding.sourceKind === "action")
    .map((finding) => [finding.sourceName, finding.sourceText])).entries()];
  for (const [name, text] of actionTexts) console.log(`\n${heading(`Action text — ${name}`)}:\n${text}`);

  for (const [findingIndex, finding] of group.findings.entries()) {
    console.log(`\n${heading(`Finding ${findingIndex + 1}: ${finding.rule} (${finding.confidence})`)}`);
    console.log(RULE_EXPLANATIONS[finding.rule] ?? "The generated automation does not match a source-description signal.");
    console.log(`Expected: ${finding.expected}`);
    console.log(`Generated: ${finding.actual}`);
    console.log(`Triggering clause: ${evidence(finding.evidence)}`);
  }
}

function showDiff(originalPath, proposedPath, isNew) {
  console.log(`\n${heading("Proposed diff")}`);
  const result = spawnSync("git", ["--no-pager", "diff", "--no-index", "--", isNew ? "/dev/null" : originalPath, proposedPath], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Re-run the audit suite that owns `finding`, regenerating its artifact. */
function runAudit(finding) {
  const config = domainConfig(finding.domain);
  // -t is a regex over the full test name, so a raw namespace would be a pattern
  const nameFilter = config.testNameFilter(finding);
  const args = ["vitest", "run", config.auditTest, ...(nameFilter ? ["-t", escapeRegExp(nameFilter)] : [])];
  run("npx", args);
}

function assertFindingsResolved({ finding, findings }) {
  const artifact = artifactPathForFinding(finding, REPO_ROOT);
  if (!fs.existsSync(artifact)) {
    throw new Error(`The audit did not write ${path.relative(REPO_ROOT, artifact)}; its suite was probably skipped for want of fixtures.`);
  }
  const currentIds = new Set(JSON.parse(fs.readFileSync(artifact, "utf8")).map((entry) => entry.id));
  const unresolved = findings.filter((entry) => currentIds.has(entry.id));
  if (unresolved.length) throw new Error(`The targeted audit still reports ${unresolved.length} reviewed finding(s).`);
}

/** Validate every suite a group touches, not just the first finding's. */
function validateGroup(group) {
  for (const target of validationTargets(group.findings)) {
    runAudit(target.finding);
    assertFindingsResolved(target);
  }
}

/** Best-effort artifact refresh after a rollback; never masks the original error. */
function refreshAfterRollback(findings) {
  for (const target of validationTargets(findings)) {
    try {
      runAudit(target.finding);
    } catch (error) {
      console.warn(`Could not refresh the restored audit artifact: ${error.message}`);
    }
  }
}

async function resolveEditor(editorOption) {
  const editor = (editorOption ?? process.env.VISUAL ?? process.env.EDITOR ?? "").trim();
  if (editor) return editor;
  return ask({ type: "text", name: "value", message: "Editor command", validate: (value) => Boolean(value?.trim()) });
}

/** Record the accepted enricher against every feature the group covers. */
async function promptDecisionManifest(group, expectedClass) {
  const featureNames = [...new Set(group.findings
    .filter((finding) => finding.sourceKind === "feature")
    .map((finding) => finding.featureName))];
  if (!featureNames.length) return null;
  const decision = await ask({
    type: "select",
    name: "value",
    message: "Decision-manifest classification",
    choices: [
      { title: "Override/augment the default", value: "override" },
      { title: "Replace the default automation", value: "replace" },
    ],
  });
  const note = await ask({ type: "text", name: "value", message: "Decision note (optional)" });
  const manifestPath = manifestPathForFinding(group.findings[0], REPO_ROOT);
  return {
    path: manifestPath,
    content: updateDecisionManifest({
      content: fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, "utf8") : "",
      featureNames,
      decision,
      enricher: expectedClass,
      note: note?.trim() || `Accepted ${expectedClass} through the description-audit review tool.`,
    }),
  };
}

/**
 * Write the proposal, then link → typecheck → audit, rolling every touched file
 * back if any step fails.
 */
async function installProposal(group, targetPath, edited, manifestUpdate) {
  // The linker rewrites every _module.ts, so rebuild first: a barrel that was
  // already stale in the working tree would otherwise look like fallout from
  // this edit and roll back an otherwise-good proposal.
  const preLinkSnapshot = snapshotFiles(listBarrelFiles(REPO_ROOT));
  run("npm", ["run", "link"]);
  const drifted = changedSnapshotPaths(preLinkSnapshot);
  if (drifted.length) console.log(`Rebuilt ${drifted.length} stale barrel file(s) before installing.`);

  const expectedBarrels = expectedBarrelPaths(group.targetRelative, REPO_ROOT);
  const barrelFiles = [...new Set([...listBarrelFiles(REPO_ROOT), ...expectedBarrels])];
  const barrelSnapshot = snapshotFiles(barrelFiles);
  const snapshot = snapshotFiles([...new Set([targetPath, ...barrelFiles, ...(manifestUpdate ? [manifestUpdate.path] : [])])]);
  try {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, edited);
    if (manifestUpdate) {
      fs.mkdirSync(path.dirname(manifestUpdate.path), { recursive: true });
      fs.writeFileSync(manifestUpdate.path, manifestUpdate.content);
    }
    run("npm", ["run", "link"]);
    const expectedBarrelSet = new Set(expectedBarrels);
    const unexpectedBarrels = changedSnapshotPaths(barrelSnapshot).filter((file) => !expectedBarrelSet.has(file));
    if (unexpectedBarrels.length) {
      throw new Error(`Barrel generation changed unrelated files:\n${unexpectedBarrels.map((file) => `- ${path.relative(REPO_ROOT, file)}`).join("\n")}`);
    }
    run("npm", ["run", "typecheck"]);
    validateGroup(group);
    console.log(`\nInstalled and validated ${path.relative(REPO_ROOT, targetPath)}.`);
    return { status: "accepted", targetPath };
  } catch (error) {
    console.error(`\nValidation failed: ${error.message}`);
    const keep = await ask({
      type: "select",
      name: "value",
      message: "Keep the edits for manual repair or roll back this acceptance?",
      choices: [
        { title: "Roll back tool edits", value: false },
        { title: "Keep for manual repair", value: true },
      ],
    });
    if (keep) return { status: "kept-failed", targetPath };
    restoreSnapshot(snapshot);
    console.log("Rolled back the enricher, decision manifest, and generated barrel changes.");
    refreshAfterRollback(group.findings);
    return { status: "rolled-back" };
  }
}

async function editAndInstall(group, editorOption) {
  const targetPath = path.join(ENRICHER_ROOT, group.targetRelative);
  const targetWasNew = !fs.existsSync(targetPath);
  const original = targetWasNew ? renderStarter(group.targetRelative, group.findings) : fs.readFileSync(targetPath, "utf8");
  const expectedClass = path.basename(targetPath, ".ts");
  const editor = await resolveEditor(editorOption);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ddb-enricher-review-"));
  const tempPath = path.join(tempDir, path.basename(targetPath));
  try {
    fs.writeFileSync(tempPath, original);
    // Pass the path as its own argv entry rather than through a shell, so
    // nothing in the temp path is re-interpreted.
    const [command, ...editorArgs] = editor.split(/\s+/);
    const edit = spawnSync(command, [...editorArgs, tempPath], { cwd: REPO_ROOT, stdio: "inherit" });
    if (edit.error) throw edit.error;
    if (edit.status !== 0) throw new Error(`Editor exited with code ${edit.status}.`);

    const edited = fs.readFileSync(tempPath, "utf8");
    const proposalIssues = validateEditedProposal(original, edited, expectedClass);
    if (proposalIssues.length) {
      console.log(`\nNot installed:\n- ${proposalIssues.join("\n- ")}`);
      return { status: "rejected" };
    }
    showDiff(targetPath, tempPath, targetWasNew);
    const confirmed = await ask({ type: "confirm", name: "value", message: "Install and validate this enricher?", initial: false });
    if (!confirmed) return { status: "rejected" };

    const manifestUpdate = targetWasNew ? await promptDecisionManifest(group, expectedClass) : null;
    return await installProposal(group, targetPath, edited, manifestUpdate);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function permanentlyIgnore(group) {
  let selected = group.findings;
  if (group.findings.length > 1) {
    const ids = await ask({
      type: "multiselect",
      name: "value",
      message: "Findings to ignore permanently",
      choices: group.findings.map((finding) => ({
        title: `${finding.rule}: ${finding.clauseLabel ?? finding.sourceName}`,
        description: finding.evidence,
        value: finding.id,
        selected: true,
      })),
    });
    const selectedIds = new Set(ids);
    selected = group.findings.filter((finding) => selectedIds.has(finding.id));
  }
  if (!selected.length) return { status: "rejected" };
  const reason = await ask({
    type: "text",
    name: "value",
    message: "Why are these findings false positives?",
    validate: (value) => value?.trim().length >= 4 || "Enter a meaningful reason (at least four characters).",
  });
  const confirmed = await ask({
    type: "confirm",
    name: "value",
    message: `Permanently ignore ${selected.length} finding(s) in the decisions manifest?`,
    initial: false,
  });
  if (!confirmed) return { status: "rejected" };

  const byManifest = new Map();
  for (const finding of selected) {
    const manifestPath = manifestPathForFinding(finding, REPO_ROOT);
    const entries = byManifest.get(manifestPath) ?? [];
    entries.push(finding);
    byManifest.set(manifestPath, entries);
  }
  const snapshot = snapshotFiles([...byManifest.keys()]);
  try {
    for (const [manifestPath, entries] of byManifest) {
      const content = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, "utf8") : "";
      fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
      fs.writeFileSync(manifestPath, updateSuppressionManifest({ content, findings: entries, reason }));
    }
    for (const target of validationTargets(selected)) runAudit(target.finding);
    console.log(`Permanently ignored ${selected.length} finding(s). Remember to commit tests/audit separately.`);
    return { status: "ignored", count: selected.length };
  } catch (error) {
    restoreSnapshot(snapshot);
    console.error(`Could not persist the ignore: ${error.message}`);
    refreshAfterRollback(selected);
    return { status: "rolled-back" };
  }
}

async function main() {
  const options = parseReviewArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  const hasArtifacts = artifactFiles().length > 0;
  let refresh = options.refresh;
  if (!hasArtifacts) refresh = true;
  else if (refresh === null) {
    refresh = await ask({ type: "confirm", name: "value", message: "Refresh audit findings before review?", initial: true });
  }
  if (refresh) refreshAudits();

  const config = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "data/fallback-config.json"), "utf8"));
  const catalog = buildSourceCatalog(config);
  const findings = loadFindings(catalog);
  if (!findings.length) throw new Error("No description-audit findings were found.");
  const filters = await completeFilters(options, findings);
  const filtered = filterFindings(findings, filters);
  const groups = groupFindings(filtered, REPO_ROOT);
  if (!groups.length) {
    console.log("No unsuppressed findings match those filters.");
    return;
  }

  console.log(`\nReviewing ${filtered.length} finding(s) across ${groups.length} enricher target(s).`);
  // Visit a fixed running order, but re-read the findings after anything that
  // rewrites an artifact: one accepted enricher often resolves findings queued
  // further down the list.
  const order = groups.map((group) => group.targetRelative);
  let byTarget = new Map(groups.map((group) => [group.targetRelative, group]));
  // Keyed by target so revisiting a group via Back replaces its outcome rather
  // than counting it twice.
  const outcomes = new Map();
  let index = 0;
  while (index < order.length) {
    const targetRelative = order[index];
    const group = byTarget.get(targetRelative);
    if (!group) {
      // Reaching a target with no findings left means either this session
      // already handled it (keep that outcome) or an earlier edit resolved it.
      const previous = outcomes.get(targetRelative);
      if (previous) {
        console.log(`\n[${index + 1}/${order.length}] ${targetRelative} — already ${previous.status}; nothing left to review.`);
      } else {
        console.log(`\n[${index + 1}/${order.length}] ${targetRelative} — resolved by an earlier acceptance; skipping.`);
        outcomes.set(targetRelative, { status: "auto-resolved" });
      }
      index += 1;
      continue;
    }
    showGroup(group, index, order.length);
    const action = await ask({
      type: "select",
      name: "value",
      message: "Review action",
      choices: [
        { title: "Edit and accept", value: "edit" },
        { title: "Permanently ignore as false positive", value: "ignore" },
        { title: "Skip for this session", value: "skip" },
        ...(index > 0 ? [{ title: "Back", value: "back" }] : []),
        { title: "Quit", value: "quit" },
      ],
    });
    if (action === "quit") break;
    if (action === "back") {
      index -= 1;
      continue;
    }
    if (action === "skip") {
      outcomes.set(targetRelative, { status: "skipped" });
      index += 1;
      continue;
    }
    const result = action === "ignore"
      ? await permanentlyIgnore(group)
      : await editAndInstall(group, options.editor);
    outcomes.set(targetRelative, result);
    if (["accepted", "ignored"].includes(result.status)) {
      byTarget = new Map(groupFindings(filterFindings(loadFindings(catalog), filters), REPO_ROOT)
        .map((entry) => [entry.targetRelative, entry]));
    }
    index += 1;
  }

  const tally = (...statuses) => [...outcomes.values()].filter((outcome) => statuses.includes(outcome.status)).length;
  const ignored = [...outcomes.values()]
    .filter((outcome) => outcome.status === "ignored")
    .reduce((total, outcome) => total + outcome.count, 0);
  console.log(`\nReview summary: ${tally("accepted")} accepted, ${ignored} permanently ignored, `
    + `${tally("skipped", "rejected")} skipped, ${tally("auto-resolved")} resolved by other edits, `
    + `${tally("rolled-back")} rolled back, ${tally("kept-failed")} kept after validation failure.`);
}

try {
  await main();
} catch (error) {
  if (error instanceof ReviewCancelled) console.log("\nReview cancelled; no pending proposal was installed.");
  else {
    console.error(`audit:review failed: ${error.message}`);
    process.exitCode = 1;
  }
}
