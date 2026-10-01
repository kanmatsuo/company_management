type PermissionHolder = { permissions: readonly string[] };

export function can(user: PermissionHolder, permission: string) {
  return user.permissions.includes(permission);
}

/** True when the account has this exact permission or any permission under that prefix. */
export function canOpen(user: PermissionHolder, permission: string) {
  return user.permissions.some((code) => code === permission || code.startsWith(`${permission}.`));
}

/** True when the account can change something in this area, not only view it. */
export function canManage(user: PermissionHolder, prefixes: string[]) {
  return user.permissions.some((code) =>
    prefixes.some((prefix) => code.startsWith(`${prefix}.`) && !code.endsWith(".view")),
  );
}
