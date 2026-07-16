import type { AdvancedElementKind } from "./types";

export type AdvancedElementDefault = {
  body: string[];
  height: number;
  title: string;
  width: number;
};

export const ADVANCED_DEFAULTS: Record<
  AdvancedElementKind,
  AdvancedElementDefault
> = {
  swimlane: {
    title: "Swimlane",
    body: ["Role A", "Role B", "Role C"],
    width: 520,
    height: 260,
  },
  "bpmn-task": {
    title: "BPMN Task",
    body: ["Owner", "Input", "Output"],
    width: 220,
    height: 120,
  },
  "bpmn-event": {
    title: "Event",
    body: ["Start / End"],
    width: 120,
    height: 120,
  },
  "bpmn-gateway": {
    title: "Gateway",
    body: ["Yes", "No"],
    width: 150,
    height: 150,
  },
  "uml-class": {
    title: "ClassName",
    body: ["+ property: string", "+ method(): void"],
    width: 260,
    height: 190,
  },
  "uml-actor": {
    title: "Actor",
    body: ["Role / system"],
    width: 140,
    height: 220,
  },
  "erd-table": {
    title: "entity_table",
    body: ["PK id uuid", "name varchar", "FK owner_id"],
    width: 280,
    height: 200,
  },
  "kanban-board": {
    title: "Kanban",
    body: ["Backlog", "Doing", "Done"],
    width: 520,
    height: 260,
  },
  timeline: {
    title: "Timeline",
    body: ["Milestone 1", "Milestone 2", "Launch"],
    width: 520,
    height: 140,
  },
  "mindmap-node": {
    title: "Idea",
    body: ["Branch", "Branch", "Branch"],
    width: 220,
    height: 140,
  },
  "cloud-service": {
    title: "Cloud service",
    body: ["API", "Queue", "Database"],
    width: 230,
    height: 150,
  },
  wireframe: {
    title: "Wireframe",
    body: ["Header", "Content", "CTA"],
    width: 320,
    height: 220,
  },
  "smart-connector": {
    title: "Connector",
    body: ["Source", "Target", "Rule"],
    width: 320,
    height: 120,
  },
  "section-zone": {
    title: "Section",
    body: ["Scope", "Owner", "Status"],
    width: 420,
    height: 260,
  },
  "erd-relationship": {
    title: "1:N relationship",
    body: ["users.id", "orders.user_id"],
    width: 360,
    height: 130,
  },
  "flow-step": {
    title: "01",
    body: ["Process step", "Outcome"],
    width: 240,
    height: 130,
  },
  "status-badge": {
    title: "Status",
    body: ["Draft", "In review", "Done"],
    width: 220,
    height: 100,
  },
  "annotation-pin": {
    title: "Note",
    body: ["Review this area"],
    width: 190,
    height: 150,
  },
  "template-stamp": {
    title: "Template",
    body: ["Reusable block", "Drag into scene"],
    width: 260,
    height: 150,
  },
  "api-endpoint": {
    title: "GET /api/items",
    body: ["Request", "Response", "Auth"],
    width: 300,
    height: 150,
  },
  "database-cylinder": {
    title: "Database",
    body: ["users", "orders", "events"],
    width: 230,
    height: 170,
  },
  "org-card": {
    title: "Team / person",
    body: ["Role", "Owner", "Contact"],
    width: 260,
    height: 150,
  },
};

