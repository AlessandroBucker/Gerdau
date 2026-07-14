export async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `O servidor retornou uma resposta inválida (HTTP ${response.status}). Atualize a página e tente novamente.`,
    );
  }
}
