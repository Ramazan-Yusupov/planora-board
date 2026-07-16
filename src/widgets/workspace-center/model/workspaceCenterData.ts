export const agentRoles = [
  {
    title: "Ревьюер данных",
    description: "Проверяет schema, broken links, backup/import и рискованные удаления.",
    checks: ["Запустить Health Check", "Проверить backup перед import", "Посмотреть связанные Notes"],
  },
  {
    title: "Планировщик",
    description: "Смотрит сроки, WIP, ближайшие задачи и перегруз списков.",
    checks: ["Открыть My Work", "Проверить Calendar", "Обновить priorities"],
  },
  {
    title: "Редактор заметок",
    description: "Следит за связями Notes ↔ Board и структурой материалов.",
    checks: ["Создать note template", "Связать задачи", "Экспортировать Markdown"],
  },
  {
    title: "Аналитик рисков",
    description: "Проверяет просрочку, блокеры, urgent priority и пустые этапы.",
    checks: ["Открыть Analytics", "Проверить overdue", "Проверить blocked tasks"],
  },
] as const;

export const integrations = [
  {
    title: "Calendar providers",
    description: "Будущая синхронизация deadlines с Google/Outlook Calendar.",
    status: "Roadmap",
  },
  {
    title: "Docs and notes",
    description: "Импорт решений из Notion, Google Drive или локальных markdown-файлов.",
    status: "Roadmap",
  },
  {
    title: "AI/MCP tools",
    description: "Безопасный слой внешних tools поверх локальной модели Planora.",
    status: "Design",
  },
  {
    title: "Issue trackers",
    description: "Будущие импорты задач из GitHub, Jira или Linear-подобных систем.",
    status: "Roadmap",
  },
] as const;
