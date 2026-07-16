import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { SceneLayer } from "@/modules/draw-tool/entities/scene";
import type { Viewport } from "@/modules/draw-tool/entities/viewport";
import {
  deleteIndexedRecord,
  getAllIndexedRecords,
  getIndexedRecord,
  putIndexedRecord,
  replaceIndexedProjectRecords,
} from "@/modules/draw-tool/shared/lib/storage/indexedDb";
import type { DrawToolProject, ProjectSummary } from "./types";

function cloneElements(elements: BoardElement[]) {
  return JSON.parse(JSON.stringify(elements)) as BoardElement[];
}

function cloneViewport(viewport: Viewport): Viewport {
  return { ...viewport };
}

function cloneLayers(layers: SceneLayer[] | undefined) {
  return layers
    ? (JSON.parse(JSON.stringify(layers)) as SceneLayer[])
    : undefined;
}

function cloneProject(project: DrawToolProject): DrawToolProject {
  return {
    ...project,
    layers: cloneLayers(project.layers),
    elements: cloneElements(project.elements),
    viewport: cloneViewport(project.viewport),
  };
}

function normalizeProject(project: DrawToolProject): DrawToolProject {
  return {
    ...project,
    viewport: project.viewport ?? { x: 0, y: 0, zoom: 1 },
  };
}

export async function getProjects() {
  const projects = await getAllIndexedRecords<DrawToolProject>();

  return projects
    .map((project): ProjectSummary => {
      const normalized = normalizeProject(project);
      return {
        id: normalized.id,
        name: normalized.name,
        createdAt: normalized.createdAt,
        updatedAt: normalized.updatedAt,
      };
    })
    .sort((left, right) => right.updatedAt - left.updatedAt);
}

export async function getAllProjects() {
  const projects = await getAllIndexedRecords<DrawToolProject>();
  return projects.map((project) => cloneProject(normalizeProject(project)));
}

export async function getProjectById(id: string) {
  const project = await getIndexedRecord<DrawToolProject>(id);
  return project ? cloneProject(normalizeProject(project)) : null;
}

export async function putProject(project: DrawToolProject) {
  await putIndexedRecord(cloneProject(normalizeProject(project)));
}

export async function replaceAllProjects(projects: DrawToolProject[]) {
  await replaceIndexedProjectRecords(projects.map((project) => cloneProject(normalizeProject(project))));
}

export async function removeProject(id: string) {
  await deleteIndexedRecord(id);
}

