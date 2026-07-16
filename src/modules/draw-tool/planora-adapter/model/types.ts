export type PlanoraTaskItem = Readonly<{
  id: string;
  boardId: string;
  boardTitle: string;
  listId: string;
  listTitle: string;
  title: string;
  statusLabel?: string;
  priorityLabel?: string;
  dueDate?: string;
}>;
