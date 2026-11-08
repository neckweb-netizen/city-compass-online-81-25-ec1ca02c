// Only the server invokes NVIDIA. Never expose the API key to the browser.
export async function requestNvidiaFallback(
  question: string,
  apiKey: string,
  model: string,
  fetcher: typeof fetch = fetch,
): Promise<string | null> {
  if (!apiKey || !/^[a-z0-9._-]+\/[a-z0-9._-]+$/i.test(model)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetcher('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        max_tokens: 250,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'Você é o assistente do Saj Tem, uma plataforma local brasileira. Responda em português do Brasil, com clareza e brevidade. Esta pergunta não encontrou resposta cadastrada na plataforma. Não invente fatos sobre empresas, catálogo, preços, disponibilidade, endereços, políticas do Saj Tem ou eventos atuais; nesses casos explique que não há informação confirmada e sugira consultar o próprio site. Não peça senhas, documentos nem dados bancários. Não diga que consultou o catálogo ou a internet. Para assuntos médicos, jurídicos e financeiros, evite orientações categóricas.',
          },
          { role: 'user', content: question.slice(0, 2000) },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    return typeof content === 'string' && content.trim() ? content.trim().slice(0, 1200) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
