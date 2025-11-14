// context
import { useAuthStore } from "../stores/authStore";

/**
 * User roles in the system (simplified - admin only)
 */
export enum UserRole {
  ADMIN = "admin",
}

/**
 * User role type (matches the User entity)
 */
export type UserRoleType = "admin";

/**
 * Available actions/permissions
 */
export enum Permission {
  READ = "read",
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  MANAGE = "manage",
}

export const useHasRole = (role: UserRole): boolean => {
  const { user } = useAuthStore();
  return user?.role === role;
};

export const useCanPerform = (
  action: Permission,
  resource?: string
): boolean => {
  const { user } = useAuthStore();

  if (!user) return false;

  // Admin can do everything
  if (user.role === UserRole.ADMIN) return true;

  // Use permissions from Firebase user profile
  if (user.permissions) {
    const permissionString = resource ? `${action}:${resource}` : action;
    return user.permissions.includes(permissionString);
  }

  // Fallback: non-admin users have no permissions
  return false;
};

export const useIsAdmin = (): boolean => {
  return useHasRole(UserRole.ADMIN);
};

// Removed useIsOperator since we only have admin users now

interface RoleGuardProps {
  role: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  role,
  children,
  fallback = null,
}) => {
  const hasRole = useHasRole(role);
  return hasRole ? <>{children}</> : <>{fallback}</>;
};

interface PermissionGuardProps {
  action: Permission;
  resource?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  action,
  resource,
  children,
  fallback = null,
}) => {
  const canPerform = useCanPerform(action, resource);
  return canPerform ? <>{children}</> : <>{fallback}</>;
};

export const withRole = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole: UserRole,
  fallback?: React.ComponentType
) => {
  return (props: P) => {
    const hasRole = useHasRole(requiredRole);

    if (!hasRole) {
      const FallbackComponent = fallback;
      return FallbackComponent ? (
        <FallbackComponent />
      ) : (
        <div>Access denied</div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};
