export type ResultOk<T> = { ok: true; data: T }
export type ResultFail = { ok: false; error: string }
export type Result<T> = ResultOk<T> | ResultFail

