export function formatErrorMessage(error: any, fallback: string): string {
  if (!error) return fallback;

  let message =
    typeof error === "string"
      ? error
      : error?.message || error?.toString?.() || "";

  if (!message) return fallback;

  // Strip generic Electron IPC prefix
  message = message.replace(
    /^Error invoking remote method '[^']+':\s*/i,
    ""
  );

  // Strip leading "Error: "
  message = message.replace(/^Error:\s*/i, "");

  // For generic or unknown messages, return fallback
  if (
    message.toLowerCase().includes("unknown error") ||
    message.toLowerCase().includes("login failed")
  ) {
    return fallback;
  }

  return message || fallback;
}


