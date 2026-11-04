export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const REQUEST_TIMEOUT_MS = 12_000;

export function getApiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
}

export async function apiRequest<T = void>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    token?: string;
    body?: unknown;
  } = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      "No se configuró la API. Define EXPO_PUBLIC_API_URL en el archivo .env del proyecto móvil.",
    );
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response: Response;
  let responseText: string;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      signal: controller.signal,
    });
    responseText = await response.text();
  } catch {
    if (timedOut) {
      throw new Error(
        "La conexión tardó más de 12 segundos. Comprueba que la app móvil y el backend estén en la misma red Wi-Fi, y que el firewall permita el puerto 8080.",
      );
    }
    throw new Error(
      "No se pudo conectar con la API. Comprueba que el backend esté activo, que la dirección configurada sea la IP LAN del computador y que el teléfono use la misma red Wi-Fi.",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let data: unknown;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = undefined;
    }
  }

  if (!response.ok) {
    const payload =
      typeof data === "object" && data !== null
        ? (data as { description?: string; message?: string })
        : undefined;
    const message =
      payload?.description ||
      payload?.message ||
      `La API respondió con el estado ${response.status}.`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}
