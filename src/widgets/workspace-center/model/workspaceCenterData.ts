export type AgentRoleId =
  | "data-reviewer"
  | "planner"
  | "notes-editor"
  | "risk-analyst";

export const agentRoles: readonly Readonly<{
  id: AgentRoleId;
  title: string;
  description: string;
  primaryActionLabel: string;
  checks: readonly string[];
}>[] = [
  {
    id: "data-reviewer",
    title: "Ревьюер данных",
    description: "Проверяет schema, broken links, backup/import и рискованные удаления.",
    primaryActionLabel: "Запустить Health Check",
    checks: ["Запустить Health Check", "Проверить backup перед import", "Посмотреть связанные Notes"],
  },
  {
    id: "planner",
    title: "Планировщик",
    description: "Смотрит сроки, WIP, ближайшие задачи и перегруз списков.",
    primaryActionLabel: "Открыть My Work",
    checks: ["Открыть My Work", "Проверить Calendar", "Обновить priorities"],
  },
  {
    id: "notes-editor",
    title: "Редактор заметок",
    description: "Следит за связями Notes ↔ Board и структурой материалов.",
    primaryActionLabel: "Открыть Notes",
    checks: ["Создать note template", "Связать задачи", "Экспортировать Markdown"],
  },
  {
    id: "risk-analyst",
    title: "Аналитик рисков",
    description: "Проверяет просрочку, блокеры, urgent priority и пустые этапы.",
    primaryActionLabel: "Открыть обзор задач",
    checks: ["Открыть Analytics", "Проверить overdue", "Проверить blocked tasks"],
  },
] as const;

export type IntegrationRoadmapStatus = "Design" | "Roadmap" | "Ready later";

export const integrationPipeline = [
  {
    title: "External source",
    description: "Данные остаются во внешнем инструменте, Planora читает только выбранный пользователем scope.",
  },
  {
    title: "Import draft",
    description: "Внешние задачи сначала превращаются в черновик без записи в board schema.",
  },
  {
    title: "Preflight review",
    description: "Пользователь видит конфликты, дубли, даты, labels и связи перед применением.",
  },
  {
    title: "Confirmed local write",
    description: "Только подтверждённые изменения попадают в локальную модель Planora и backup/export.",
  },
] as const;

export const integrations: readonly Readonly<{
  title: string;
  description: string;
  source: string;
  nextStep: string;
  status: IntegrationRoadmapStatus;
}>[] = [
  {
    title: "Calendar providers",
    description: "Будущая синхронизация deadlines с Google/Outlook Calendar.",
    source: "Сроки и события",
    nextStep: "Спроектировать read-only preview перед созданием задач.",
    status: "Roadmap",
  },
  {
    title: "Docs and notes",
    description: "Импорт решений из Notion, Google Drive или локальных markdown-файлов.",
    source: "Документы и заметки",
    nextStep: "Сначала маппить документы в Notes draft, не в карточки.",
    status: "Roadmap",
  },
  {
    title: "AI/MCP tools",
    description: "Безопасный слой внешних tools поверх локальной модели Planora.",
    source: "Tool calls и AI actions",
    nextStep: "Описать permissions gate и журнал действий до включения tools.",
    status: "Design",
  },
  {
    title: "Issue trackers",
    description: "Будущие импорты задач из GitHub, Jira или Linear-подобных систем.",
    source: "Issues и tasks",
    nextStep: "Добавить import draft с дедупликацией по source id.",
    status: "Ready later",
  },
] as const;
