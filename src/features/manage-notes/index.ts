export {
  createNote,
  exportStoredNotes,
  loadNotes,
  parseNotes,
  replaceStoredNotes,
  saveNotes,
} from "./model/notesStorage";
export type { Note, NoteBlock, NoteBlockType } from "./model/notesStorage";
export {
  createNotesExport,
  downloadNotesExport,
  parseNotesImport,
} from "./model/notesTransfer";
export type { NotesImportResult } from "./model/notesTransfer";
