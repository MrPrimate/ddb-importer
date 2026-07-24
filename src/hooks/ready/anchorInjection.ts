import { logger, utils } from "../../lib/_module";

function getOptions(page: JournalEntryPage | undefined, current: string) {
  let options = "<option></option>";
  if (page?.toc) {
    for (const section of Object.values(page.toc)) {
      options += `<option value="${section.slug}"${section.slug === current ? " selected" : ""}>${section.text}</option>`;
    }
  }
  return options;
}

function addSlugField(element: HTMLElement, slug: string, document: NoteDocument) {
  const titleInput = element.querySelector("select[name='pageId']");
  const slugHTML = `<div class="form-group">
  <label>Jump to HTML Slug</label>
  <div class="form-fields">
      <select name="flags.ddb.slugLink" >${getOptions(document.page, slug)}</select>
  </div>
</div>`;

  const div = utils.htmlToElement(slugHTML);
  const formGroup = titleInput?.parentNode?.parentNode;
  const container = formGroup?.parentNode;
  if (!div || !formGroup || !container) return;
  const anchorNode = formGroup.nextSibling?.nextSibling;
  if (anchorNode) container.insertBefore(div, anchorNode);
  else container.appendChild(div);
}

function setSlugProperties(doc: Partial<NoteDocument>, slug: string, label: string | undefined) {
  foundry.utils.setProperty(doc, "flags.anchor.slug", slug);
  foundry.utils.setProperty(doc, "flags.ddb.slugLink", slug);
  foundry.utils.setProperty(doc, "flags.ddb.labelName", label);
  return doc;
}

function getSlug(doc: NoteDocument) {
  return doc.flags.ddb?.slugLink
      ?? doc.flags.anchor?.slug
      ?? "";
}

function updateNotePage(noteConfig: any, slug: string) {
  const journalId = noteConfig.form.elements.entryId?.value;
  const pageId = noteConfig.form.elements.pageId?.value;
  const journal = game.journal.get(journalId);
  const page = journal?.pages.get(pageId);
  noteConfig.form.elements["flags.ddb.slugLink"].innerHTML = getOptions(page as JournalEntryPage, slug);
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

  // when we render a note we add the anchor links box
  Hooks.on("renderNoteConfig", (noteConfig, form, data) => {
    const slug = getSlug(noteConfig.document) as string;

    if (!form.querySelector(`input[name='flags.ddb.slugLink']`)) {
      addSlugField(form, slug, data.document);
      if (!noteConfig.minimized) {
        const pos = noteConfig.position;
        pos.height = "auto";
        noteConfig.setPosition(pos);
      }
    }
    (noteConfig.element as any)[0].style.height = "auto";
    const isExistingNote = noteConfig.document.id !== null;

    const entryIdSelect = form.querySelector("select[name='entryId']");
    const pageIdSelect = form.querySelector("select[name='pageId']");

    entryIdSelect?.addEventListener("change", () => updateNotePage(noteConfig, slug));
    pageIdSelect?.addEventListener("change", () => updateNotePage(noteConfig, slug));

    if (isExistingNote) {
      const closeHookId = Hooks.on("closeDocumentSheetV2", async (documentSheet) => {
        if (!(documentSheet instanceof foundry.applications.sheets.NoteConfig)) return;
        if (noteConfig.document.id !== documentSheet.document.id) return;
        Hooks.off("closeDocumentSheetV2", closeHookId);
        const selectedSlug = foundry.utils.getProperty(documentSheet.document, "flags.ddb.slugLink") as string;
        if (selectedSlug && selectedSlug.trim() !== "" && selectedSlug !== slug) {
          const update = setSlugProperties({ _id: documentSheet.document.id }, selectedSlug, documentSheet.document.label);
          await canvas.scene?.updateEmbeddedDocuments("Note", [update as any]);
        }
        game.canvas.notes.draw();
      });
    }
  });

  // handle new notes, we just inject the slug properties into the source from the sheet data
  Hooks.on("preCreateNote", (note: NoteDocument, data) => {
    const noteData = data as { slug?: string; text?: string };
    if (noteData.slug) {
      const flagData = setSlugProperties(foundry.utils.deepClone(note), noteData.slug, noteData.text);
      note.updateSource({ flags: flagData.flags } as NoteDocument.UpdateData);
    };
  });

  Hooks.on("dropCanvasData", (_, dropData) => {
    if (dropData.type !== "JournalEntryPage" && !foundry.utils.hasProperty(dropData, "anchor.slug")) return;

    // when we create from the side bar we fill in the input label name to match
    // the anchor name and set the slug value to the anchor slug
    Hooks.once("renderNoteConfig", (noteConfig, form, app) => {
      const titleInput = form.querySelector("input[name='text']");
      if (!titleInput) return;
      const anchor = dropData.anchor as { slug?: string; name?: string };
      const noteApp = app as { document?: { pageId?: string }; pages?: Record<string, string>; label?: string };
      if (anchor.slug && anchor.name) {
        titleInput.setAttribute("value", anchor.name);
        updateNotePage(noteConfig, anchor.slug);
      } else if (noteApp.document?.pageId) {
        titleInput.setAttribute("value", noteApp.pages?.[noteApp.document.pageId] ?? "");
      } else if (noteApp.label) {
        titleInput.setAttribute("value", noteApp.label);
      }
    });
  });
}
