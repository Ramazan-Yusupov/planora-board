import { useSyncExternalStore } from "react";
import { Keyboard } from "lucide-react";
import { Modal } from "@/modules/draw-tool/shared/ui";
import { shortcutsHelpStore } from "../model/shortcutsHelpStore";

const SHORTCUT_GROUPS = [
  {
    title: "Основные инструменты",
    rows: [
      ["V / 1", "Выбор"],
      ["R / 2", "Прямоугольник"],
      ["D / 3", "Ромб"],
      ["O / 4", "Эллипс"],
      ["A / 5", "Стрелка"],
      ["P / 6", "Линия"],
      ["X / 7", "Карандаш"],
      ["T / 8", "Текст"],
      ["E / 0", "Ластик"],
      ["H", "Рука — перемещение холста"],
      ["Space + drag", "Временно включить руку"],
      ["F", "Фрейм"],
      ["K", "Лазерная указка"],
      ["L", "Лассо"],
      ["I", "Маркер"],
      ["N", "Стикер-заметка"],
      ["M", "Комментарий / Callout"],
    ],
  },
  {
    title: "Инструменты DrawTool",
    rows: [
      ["B", "Встроенная страница"],
      ["G", "Треугольник"],
      ["U", "Шестиугольник"],
      ["S", "Звезда"],
      ["C", "Облако"],
      ["Q", "Закрепить / открепить активный инструмент"],
    ],
  },
  {
    title: "Редактирование",
    rows: [
      ["Delete / Backspace", "Удалить выбранное"],
      ["Ctrl / Cmd + Z", "Отменить"],
      ["Ctrl / Cmd + Shift + Z или Y", "Повторить"],
      ["Ctrl / Cmd + D", "Дублировать"],
      ["Ctrl / Cmd + A", "Выделить всё"],
      ["Arrow", "Сдвинуть выбранное на 1 px"],
      ["Shift + Arrow", "Сдвинуть выбранное на 10 px"],
      ["Enter", "Редактировать выбранный текст / заметку / комментарий"],
      ["Double Click", "Редактировать текст внутри блока"],
      ["Ctrl / Cmd + click", "Открыть ссылку объекта"],
      ["Shift + click", "Добавить объект к выделению"],
      [
        "Ctrl / Cmd + Shift + L",
        "Заблокировать / разблокировать редактирование",
      ],
      ["Escape", "Снять выделение и включить курсор"],
    ],
  },
  {
    title: "Холст и просмотр",
    rows: [
      ["Ctrl / Cmd + колесо", "Масштабировать в точке курсора"],
      ["Ctrl / Cmd + + / −", "Увеличить / уменьшить масштаб"],
      ["Ctrl / Cmd + 0", "Сбросить масштаб"],
      ["Ctrl / Cmd + S", "Сохранить активный проект"],
      ["?", "Открыть или закрыть эту справку"],
      ["Middle mouse + drag", "Перемещать холст"],
    ],
  },
  {
    title: "Трансформации",
    rows: [
      ["Shift при рисовании", "Пропорции фигуры / ограничение угла"],
      ["Shift при переносе", "Перемещение по одной оси"],
      ["Ctrl / Cmd при переносе", "Выравнивание по объектам"],
      ["Ctrl / Cmd при resize", "Привязка к сетке"],
      ["Alt при resize", "Изменение размера от центра"],
      [
        "Shift или Ctrl / Cmd + drag кружка",
        "Поворот с шагом 15°: 0°, 15°, 30°, 60°, 90°…",
      ],
      ["[ / ]", "Повернуть выбранный объект на −15° / +15°"],
      ["Shift + [ / ]", "Повернуть выбранный объект на −90° / +90°"],
    ],
  },
] as const;

export function ShortcutsDialog() {
  const isOpen = useSyncExternalStore(
    shortcutsHelpStore.subscribe,
    shortcutsHelpStore.get,
    shortcutsHelpStore.get,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => shortcutsHelpStore.close()}
      title="Горячие клавиши"
    >
      <div className="space-y-5">
        <p className="m-0 my-2 flex items-center gap-2 text-sm text-text-muted">
          <Keyboard className="text-accent" size={17} />
          Раскладка основных инструментов.
        </p>

        {SHORTCUT_GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="mb-2 text-sm font-semibold text-text">
              {group.title}
            </h3>
            <div className="overflow-hidden rounded-lg border border-border">
              {group.rows.map(([shortcut, description]) => (
                <div
                  className="flex items-center justify-between gap-4 border-b border-border px-3 py-2.5 last:border-b-0"
                  key={`${group.title}-${shortcut}`}
                >
                  <span className="text-sm text-text-muted">{description}</span>
                  <kbd className="shrink-0 rounded-md border border-border bg-control px-2 py-1 text-right text-xs font-medium text-text">
                    {shortcut}
                  </kbd>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Modal>
  );
}

