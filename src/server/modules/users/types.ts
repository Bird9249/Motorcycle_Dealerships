import type { getUserById } from "./repo/get-by-id";
import type { listUsers } from "./repo/list";
import type { banUserService } from "./service/ban";
import type { createUserService } from "./service/create";
import type { deleteUserService } from "./service/delete";
import type { unbanUserService } from "./service/unban";
import type { updateUserService } from "./service/update";

export type UsersListResult = Awaited<ReturnType<typeof listUsers>>;
export type UserByIdResult = Awaited<ReturnType<typeof getUserById>>;

export type CreateUserServiceResult = Awaited<
  ReturnType<typeof createUserService>
>;
export type UpdateUserServiceResult = Awaited<
  ReturnType<typeof updateUserService>
>;
export type DeleteUserServiceResult = Awaited<
  ReturnType<typeof deleteUserService>
>;
export type BanUserServiceResult = Awaited<ReturnType<typeof banUserService>>;
export type UnbanUserServiceResult = Awaited<
  ReturnType<typeof unbanUserService>
>;
