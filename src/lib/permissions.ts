import type { Role } from "./constants";
export interface Actor {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export function isStaff(actor: Actor) {
  return actor.role === "TECHNICIAN" || actor.role === "ADMIN";
}
export function canReadTicket(actor: Actor, ticket: { createdById: string }) {
  return isStaff(actor) || ticket.createdById === actor.id;
}
export function ticketScope(actor: Actor): { createdById?: string } {
  return isStaff(actor) ? {} : { createdById: actor.id };
}
