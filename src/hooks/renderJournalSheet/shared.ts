import { DDBSources, FolderHelper } from "../../lib/_module";

export function imageToChat(src: string) {
  const content = `<img class="ddbimporter-chat-image" data-src="${src}" src="${src}">`;

  ChatMessage.create({
    content,
  } as unknown as ChatMessage.CreateInput);
}

async function getJournal(bookCode: string | null): Promise<JournalEntry.Implementation> {
  const folder = await FolderHelper.getFolder("journal", "", "Player Handouts", "#515fc8", "#515fc8", false);
  const journalName = bookCode
    ? DDBSources.getBookName(bookCode)
    : "Handout Pages";
  const existingJournal = game.journal.find((journal) =>
    journal.name === journalName && journal.folder?.id === folder.id,
  );
  if (existingJournal) {
    return existingJournal;
  } else {
    const journal = await JournalEntry.create(
      {
        name: journalName,
        folder: folder.id,
        ownership: {
          default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
        },
        flags: {
          ddb: {
            bookCode,
          },
        },
      } as unknown as JournalEntry.CreateInput,
      {
        displaySheet: false,
      } as Parameters<typeof JournalEntry.create>[1],
    );
    return journal as JournalEntry.Implementation;
  }
}

async function createPage(journal: JournalEntry.Implementation, name: string, type: string, content: string) {
  const page: Record<string, any> = {
    _id: foundry.utils.randomID(),
    name,
    type,
    text: {},
    title: {
      show: true,
    },
    ownership: {
      default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
    },
  };
  switch (type) {
    case "image": {
      page.title.show = true;
      page.src = content;
      break;
    }
    case "text":
    default: {
      page.text.content = content;
    }
  }

  await JournalEntryPage.create(page as unknown as JournalEntryPage.CreateInput, { parent: journal, keepId: true, displaySheet: false } as Parameters<typeof JournalEntryPage.create>[1]);
  return journal.pages.find((jp: JournalEntryPage) => page._id === jp._id);
}

export async function createAndShowPlayerHandout(name: string, content: string, type: string, bookCode: string | null) {

  const journal = await getJournal(bookCode);

  const existingPage = journal.pages.find((page: JournalEntryPage) => {
    const nameCheck = page.name === name;
    const typeCheck = type === "image"
      ? page.src === content
      : type === "text"
        ? page.text?.content === content
        : true;
    return nameCheck && typeCheck;
  });

  const page = existingPage
    ? existingPage
    : await createPage(journal, name, type, content);

  foundry.documents.collections.Journal.showDialog(page);
}
