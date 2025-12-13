
import type { UserDto } from "@reactive-resume/dto";

// Extend the UserDto to include role
export interface UserWithRole extends UserDto {
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}

// Type guard to check if user has role
export const hasRole = (user: UserDto | undefined): user is UserWithRole => {
  return user !== undefined && 'role' in user;
};