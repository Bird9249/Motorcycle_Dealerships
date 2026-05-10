// Transaction middleware removed — per-request transaction wrapping is no longer used.
// Services manage their own transaction boundaries via db.transaction() as needed.
// The db client is exposed directly through the serverContext plugin.
export {};
