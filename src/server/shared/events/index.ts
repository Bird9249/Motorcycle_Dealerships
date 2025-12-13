export { EventEmitter, createEventBus } from "./emitter";

// Example: define events per module
// export type AppEvents = {
// 	"users.created": { id: string; email: string };
// 	"users.updated": { id: string };
// 	"users.deleted": { id: string };
// };
// export const events = createEventBus<AppEvents>();
