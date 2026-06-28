import { BoardPage } from "@/views/board";

type BoardRoutePageProps = Readonly<{
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ card?: string | string[] }>;
}>;

export default async function BoardRoutePage({
  params,
  searchParams,
}: BoardRoutePageProps) {
  const [{ boardId }, { card }] = await Promise.all([params, searchParams]);
  const initialCardId = typeof card === "string" ? card : undefined;

  return (
    <BoardPage
      key={`${boardId}-${initialCardId ?? ""}`}
      boardId={boardId}
      initialCardId={initialCardId}
    />
  );
}
