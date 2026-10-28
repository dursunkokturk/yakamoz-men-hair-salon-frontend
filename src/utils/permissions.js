export const ROLES = { ADMIN: "admin", STAFF: "staff" };

/** Kullanıcının rolü izin verilenlerden biri değilse hata fırlatır */
export function assertRole(actor, ...allowedRoles) {
  if (!actor || !allowedRoles.includes(actor.role)) {
    throw new Error("FORBIDDEN");
  }
}