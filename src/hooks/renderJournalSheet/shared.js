import DDBHelper from "../../lib/DDBHelper.js";
import FolderHelper from "../../lib/FolderHelper.js";

export function imageToChat(src) {
  const content = `<img class="ddbimporter-chat-image" data-src="${src}" src="${src}">`;

  ChatMessage.create({
    content,
  });
}

async function getJournal(bookCode) {
  const folder = await FolderHelper.getFolder("journal", "", "Player Handouts", "#515fc8", "#515fc8", false);
  const journalName = bookCode
    ? DDBHelper.getBookName(bookCode)
    : "Handout Pages";
  const existingJournal = game.journal.find((journal) =>
    journal.name === journalName && journal.folder.id === folder.id
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
      },
      {
        displaySheet: false,
      }
    );
    return journal;
  }
}

async function createPage(journal, name, type, content) {
  const page = {
    _id: foundry.utils.randomID(),
    name,
    type,
    text: {},
    title: {
      show: true,
    },
    ownership: {
      default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
    }
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

  await JournalEntryPage.create(page, { parent: journal, keepId: true, displaySheet: false });
  return journal.pages.find((jp) => page._id === jp._id);
}

export async function createAndShowPlayerHandout(name, content, type, bookCode) {

  const journal = await getJournal(bookCode);

  const existingPage = journal.pages.find((page) => {
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

  Journal.showDialog(page);
}
