import { logger, utils } from "../../lib/_module.mjs";

function getOptions(page, current) {
  let options = "<option></option>";
  if (page?.toc) {
    for (const section of Object.values(page.toc)) {
      options += `<option value="${section.slug}"${section.slug === current ? " selected" : ""}>${section.text}</option>`;
    }
  }
  return options;
}

function addSlugField(element, slug, document) {
  const titleInput = foundry.utils.isNewerVersion(game.version, "13")
    ? element.querySelector("select[name='pageId']")
    : element.querySelector("input[name='text']");
  const slugHTML = `<div class="form-group">
  <label>Jump to HTML Slug</label>
  <div class="form-fields">
      <select name="flags.ddb.slugLink" >${getOptions(document.page, slug)}</select>
  </div>
</div>`;

  const div = utils.htmlToElement(slugHTML);
  titleInput.parentNode.parentNode.parentNode.insertBefore(div, titleInput.parentNode.parentNode.nextSibling.nextSibling);
}

function setSlugProperties(doc, slug, label) {
  foundry.utils.setProperty(doc, "flags.anchor.slug", slug);
  foundry.utils.setProperty(doc, "flags.ddb.slugLink", slug);
  foundry.utils.setProperty(doc, "flags.ddb.labelName", label);
  return doc;
}

function getSlug(doc) {
  return doc.flags.ddb?.slugLink
      ?? doc.flags.anchor?.slug
      ?? "";
}

function updateNotePage(noteConfig, slug) {
  const journalId = noteConfig.form.elements.entryId?.value;
  const pageId = noteConfig.form.elements.pageId?.value;
  const journal = game.journal.get(journalId);
  const page = journal?.pages.get(pageId);
  noteConfig.form.elements["flags.ddb.slugLink"].innerHTML = getOptions(page, slug);
}

export function anchorInjection() {
  // don't load if similar modules present
  if (game.modules.get("jal")?.active) {
    logger.warn("Anchor injection already loaded from JAL.");
    return;
  }

  Hooks.on("activateNote", (note, options) => {
    const slug = getSlug(note.document);
    if (slug) {
      logger.debug("Injecting note anchor", slug);
      options["anchor"] = slug;
    }
  });

  if (foundry.utils.isNewerVersion(game.version, "13")) {
    // when we render a note we add the anchor links box
    Hooks.on("renderNoteConfig", (noteConfig, form, data) => {
      const slug = getSlug(noteConfig.document);

      if (!form.querySelector(`input[name='flags.ddb.slugLink']`)) {
        addSlugField(form, slug, data.document);
        if (!noteConfig._minimized) {
          const pos = noteConfig.position;
          pos.height = 'auto';
          noteConfig.setPosition(pos);
        }
      }
      noteConfig.element[0].style.height = "auto";
      const isExistingNote = noteConfig.document.id !== null;

      const entryIdSelect = form.querySelector("select[name='entryId']");
      const pageIdSelect = form.querySelector("select[name='pageId']");

      entryIdSelect.addEventListener("change", () => updateNotePage(noteConfig, slug));
      pageIdSelect.addEventListener("change", () => updateNotePage(noteConfig, slug));

      if (isExistingNote) {
        const closeHookId = Hooks.on("closeDocumentSheetV2", async (documentSheet) => {
          if (!(documentSheet instanceof NoteConfig)) return;
          if (noteConfig.document.id !== documentSheet.document.id) return;
          Hooks.off("closeDocumentSheetV2", closeHookId);
          const selectedSlug = documentSheet.document.getFlag("ddb", "slugLink");
          if (selectedSlug && selectedSlug.trim() !== "" && selectedSlug !== documentSheet.document.flags.ddb?.slugLink) {
            const update = setSlugProperties({ _id: documentSheet.document.id }, selectedSlug, documentSheet.document.label);
            await canvas.scene.updateEmbeddedDocuments("Note", [update]);
          }
        });
      }
    });
  } else {
    // when we render a note we add the anchor links box
    Hooks.on("renderNoteConfig", (noteConfig, html, data) => {
      const slug = getSlug(noteConfig.document);
      if (!noteConfig.element[0].querySelector("input[name='flags.ddb.slugLink']")) {
        addSlugField(noteConfig.element[0], slug, data.document);
        if (!noteConfig._minimized) {
          const pos = noteConfig.position;
          pos.height = 'auto';
          noteConfig.setPosition(pos);
        }
      }
      noteConfig.element[0].style.height = "auto";
      const isExistingNote = noteConfig.document.id !== null;

      html.find("select[name='entryId']").change(() => updateNotePage(noteConfig, slug));
      html.find("select[name='pageId']").change(() => updateNotePage(noteConfig, slug));

      if (isExistingNote) {
        const closeHookId = Hooks.on("closeDocumentSheet", async (documentSheet, html) => {
          if (!(documentSheet instanceof NoteConfig)) return;
          if (noteConfig.document.id !== documentSheet.document.id) return;
          Hooks.off("closeNoteConfig", closeHookId);
          const slugInput = html[0].querySelector("select[name='flags.ddb.slugLink']");
          const selectedSlug = slugInput?.value;
          if (selectedSlug && selectedSlug.trim() !== "" && selectedSlug !== documentSheet.document.flags.ddb?.slugLink) {
            const update = setSlugProperties({ _id: documentSheet.document.id }, selectedSlug, documentSheet.document.label);
            await canvas.scene.updateEmbeddedDocuments("Note", [update]);
          }
        });
      }
    });
  }

  // handle new notes, we just inject the slug properties into the source from the sheet data
  Hooks.on("preCreateNote", (note, data) => {
    if (data.slug) {
      const flagData = setSlugProperties(foundry.utils.deepClone(note), data.slug, data.text);
      note.updateSource({ flags: flagData.flags });
    };
  });

  Hooks.on("dropCanvasData", (_, dropData) => {
    if (dropData.type !== "JournalEntryPage" && !dropData.anchor?.slug) return;

    // when we create from the side bar we fill in the input label name to match
    // the anchor name and set the slug value to the anchor slug
    Hooks.once("renderNoteConfig", (noteConfig, form, app) => {
      const titleInput = foundry.utils.isNewerVersion(game.version, "13")
        ? form.querySelector("input[name='text']")
        : noteConfig.element[0].querySelector("input[name='text']");
      if (dropData.anchor.slug) {
        titleInput.setAttribute('value', dropData.anchor.name);
        updateNotePage(noteConfig, dropData.anchor.slug);
      } else {
        titleInput.setAttribute('value', app.label);
      }
    });
  });
}
