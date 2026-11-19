import { Cause, Option } from "effect";
import { SqlError } from "effect/sql";

// Drizzle range l'erreur du driver dans une Cause ; @effect/sql-pg l'a déjà classée (UniqueViolation...).
export const isUniqueViolation = (
  error: { readonly cause: unknown },
  constraint: string,
): boolean => {
  const cause = error.cause;
  const sqlError = Cause.isCause(cause)
    ? Option.getOrUndefined(Cause.findErrorOption(cause))
    : cause;
  return (
    SqlError.isSqlError(sqlError) &&
    sqlError.reason._tag === "UniqueViolation" &&
    sqlError.reason.constraint === constraint
  );
};
