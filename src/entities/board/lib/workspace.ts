import { createEmptyBoard, createStarterBoard } from "./createStarterBoard";
import type { Board, BoardWorkspace } from "../model/types";

export function createInitialBoardWorkspace(): BoardWorkspace {
  const starterBoard = createStarterBoard();

  return {
    boards: [starterBoard],
    activeBoardId: starterBoard.id,
  };
}

export function getActiveBoard(workspace: BoardWorkspace): Board | null {
  const requestedBoard = workspace.boards.find(
    (board) => board.id === workspace.activeBoardId,
  );

  return requestedBoard ?? workspace.boards.at(0) ?? null;
}

export function replaceBoardInWorkspace(
  workspace: BoardWorkspace,
  nextBoard: Board,
): BoardWorkspace {
  return {
    ...workspace,
    boards: workspace.boards.map((board) =>
      board.id === nextBoard.id ? nextBoard : board,
    ),
  };
}

export function selectBoardInWorkspace(
  workspace: BoardWorkspace,
  boardId: string,
): BoardWorkspace {
  if (!workspace.boards.some((board) => board.id === boardId)) {
    return workspace;
  }

  return {
    ...workspace,
    activeBoardId: boardId,
  };
}

type DeleteBoardResult = {
  workspace: BoardWorkspace;
  createdBoard: Board | null;
};

export function deleteBoardFromWorkspace(
  workspace: BoardWorkspace,
  boardId: string,
): DeleteBoardResult {
  const boardExists = workspace.boards.some((board) => board.id === boardId);

  if (!boardExists) {
    return { workspace, createdBoard: null };
  }

  const remainingBoards = workspace.boards.filter((board) => board.id !== boardId);

  if (remainingBoards.length === 0) {
    const fallbackBoard = createEmptyBoard("Новый проект");

    return {
      workspace: {
        boards: [fallbackBoard],
        activeBoardId: fallbackBoard.id,
      },
      createdBoard: fallbackBoard,
    };
  }

  return {
    workspace: {
      boards: remainingBoards,
      activeBoardId:
        workspace.activeBoardId === boardId
          ? remainingBoards[0].id
          : workspace.activeBoardId,
    },
    createdBoard: null,
  };
}
