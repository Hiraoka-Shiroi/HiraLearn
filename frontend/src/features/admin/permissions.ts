import type { Profile, Role } from '@/types/database';

export const ROLE_RANK: Record<Role, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
  super_admin: 4,
};

export const ROLE_LABEL: Record<Role, string> = {
  user: 'Пользователь',
  moderator: 'Модератор',
  admin: 'Администратор',
  super_admin: 'Главный админ',
};

export const ROLE_LABEL_EN: Record<Role, string> = {
  user: 'User',
  moderator: 'Moderator',
  admin: 'Admin',
  super_admin: 'Super admin',
};

export const hasRole = (profile: Profile | null | undefined, min: Role): boolean => {
  if (!profile) return false;
  return ROLE_RANK[profile.role] >= ROLE_RANK[min];
};

export const isStaff = (profile: Profile | null | undefined): boolean =>
  hasRole(profile, 'moderator');

export const isAdmin = (profile: Profile | null | undefined): boolean =>
  hasRole(profile, 'admin');

export const isSuperAdmin = (profile: Profile | null | undefined): boolean =>
  hasRole(profile, 'super_admin');

/** Can the caller change `target` to `newRole`? Mirrors the SQL check in admin_set_user_role. */
export const canChangeRole = (
  caller: Profile | null | undefined,
  target: { id: string; role: Role } | null | undefined,
  newRole: Role,
): { ok: boolean; reason?: string } => {
  if (!caller || !target) return { ok: false, reason: 'нет данных' };
  if (caller.id === target.id) return { ok: false, reason: 'нельзя менять собственную роль' };
  if (!isAdmin(caller)) return { ok: false, reason: 'нужен admin или выше' };
  if ((newRole === 'admin' || newRole === 'super_admin') && caller.role !== 'super_admin') {
    return { ok: false, reason: 'только super_admin может назначать admin' };
  }
  if (target.role === 'super_admin' && caller.role !== 'super_admin') {
    return { ok: false, reason: 'нельзя менять super_admin' };
  }
  if (ROLE_RANK[newRole] > ROLE_RANK[caller.role]) {
    return { ok: false, reason: 'нельзя выдать роль выше своей' };
  }
  return { ok: true };
};

export const canBlockUser = (
  caller: Profile | null | undefined,
  target: { id: string; role: Role } | null | undefined,
): { ok: boolean; reason?: string } => {
  if (!caller || !target) return { ok: false, reason: 'нет данных' };
  if (caller.id === target.id) return { ok: false, reason: 'нельзя блокировать себя' };
  if (!isAdmin(caller)) return { ok: false, reason: 'нужен admin' };
  if (target.role === 'super_admin' && caller.role !== 'super_admin') {
    return { ok: false, reason: 'нельзя блокировать super_admin' };
  }
  return { ok: true };
};

export const canGrantSubscription = (caller: Profile | null | undefined) =>
  isAdmin(caller);

export const canSendPush = (caller: Profile | null | undefined) => isAdmin(caller);

export const canViewLogs = (caller: Profile | null | undefined) =>
  isSuperAdmin(caller);

export const canViewUsers = (caller: Profile | null | undefined) =>
  isStaff(caller);
