export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

const APP_NAME = "GoofyAI";

const SYSTEM_PROMPT = `
You are GoofyAI, a helpful, funny, slightly chaotic assistant.

Personality:
- Be useful first.
- Be funny in a way normal people understand.
- Do not overdo weird jokes.
- Keep answers clear.
- If the user asks for code, give code.
- If the user asks for one big chunk of code, give one big chunk.
- Do not pretend to know things you do not know.
- If something might be wrong, say it plainly.
- You can be silly, but do not be useless.
- Never be mean to the user.
- Avoid overly technical explanations unless the user asks.
- When helping with programming, give practical fixes.

Important:
- The app name is GoofyAI.
- The browser title should be GoofyAI.
- This is a local AI project.
- Local accounts are only saved in the browser, not real online accounts.
`.trim();

function safeString(value, fallback = "") {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;

  try {
    return String(value);
  } catch {
    return fallback;
  }
}

function cleanText(value, maxLength = 12000) {
  return safeString(value).trim().slice(0, maxLength);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeRole(role) {
  if (role === "user") return "user";
  if (role === "assistant") return "assistant";
  if (role === "system") return "system";
  return "user";
}

function normalizeMessages(messages) {
  return safeArray(messages)
    .filter((message) => message && typeof message === "object")
    .map((message) => ({
      role: normalizeRole(message.role),
      content: cleanText(message.content || message.text || "", 8000),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-12);
}

function makeJson(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function makeTextResponse(text, status = 200) {
  return new Response(text, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function makeStreamResponse(stream) {
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function buildMessages({ message, messages, profileName }) {
  const cleanedProfileName = cleanText(profileName, 60) || "friend";
  const history = normalizeMessages(messages);

  return [
    {
      role: "system",
      content: `${SYSTEM_PROMPT}

Current local account name: ${cleanedProfileName}

Remember:
- If the user asks about the app code, help directly.
- If the user seems confused, explain simply.
- Keep the tone natural and useful.`,
    },
    ...history,
    {
      role: "user",
      content: message,
    },
  ];
}

function fallbackMessage(errorType = "default") {
  if (errorType === "ollama-off") {
    return "I could not reach Ollama. Make sure Ollama is running, then try again. If you are using the default setup, run: ollama run llama3";
  }

  if (errorType === "bad-request") {
    return "I could not read that message properly. Try sending it again.";
  }

  if (errorType === "model-missing") {
    return "Ollama is running, but the model might not be installed. Try: ollama pull llama3";
  }

  return "Something went sideways. Not dramatically sideways, but enough that I could not answer.";
}

async function checkOllamaHealth() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: "ollama-off",
      };
    }

    return {
      ok: true,
      reason: null,
    };
  } catch {
    return {
      ok: false,
      reason: "ollama-off",
    };
  }
}

async function callOllamaChat({ ollamaMessages, signal }) {
  return fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: ollamaMessages,
      stream: true,
      options: {
        temperature: 0.75,
        top_p: 0.9,
        repeat_penalty: 1.08,
        num_ctx: 4096,
      },
    }),
  });
}

function parseOllamaLine(line) {
  const trimmed = line.trim();

  if (!trimmed) {
    return {
      text: "",
      done: false,
      error: null,
    };
  }

  try {
    const data = JSON.parse(trimmed);

    if (data.error) {
      return {
        text: "",
        done: true,
        error: safeString(data.error),
      };
    }

    return {
      text: safeString(data.message?.content),
      done: !!data.done,
      error: null,
    };
  } catch {
    return {
      text: "",
      done: false,
      error: null,
    };
  }
}

export async function GET() {
  const health = await checkOllamaHealth();

  return makeJson({
    app: APP_NAME,
    status: health.ok ? "ok" : "ollama_unreachable",
    model: OLLAMA_MODEL,
    ollamaUrl: OLLAMA_URL,
    message: health.ok
      ? "GoofyAI route is working and Ollama is reachable."
      : fallbackMessage("ollama-off"),
  });
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return makeTextResponse(fallbackMessage("bad-request"), 400);
  }

  const message = cleanText(body?.message, 12000);
  const profileName = cleanText(body?.profileName, 60);
  const messages = normalizeMessages(body?.messages);

  if (!message) {
    return makeTextResponse(fallbackMessage("bad-request"), 400);
  }

  const health = await checkOllamaHealth();

  if (!health.ok) {
    return makeTextResponse(fallbackMessage(health.reason), 503);
  }

  const ollamaMessages = buildMessages({
    message,
    messages,
    profileName,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const abortController = new AbortController();

      let reader;
      let finished = false;

      function send(text) {
        if (!text || finished) return;

        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          finished = true;
        }
      }

      function close() {
        if (finished) return;
        finished = true;

        try {
          controller.close();
        } catch {}
      }

      function fail(text) {
        if (finished) return;
        send(text);
        close();
      }

      request.signal.addEventListener("abort", () => {
        try {
          abortController.abort();
        } catch {}

        close();
      });

      try {
        const ollamaResponse = await callOllamaChat({
          ollamaMessages,
          signal: abortController.signal,
        });

        if (!ollamaResponse.ok) {
          if (ollamaResponse.status === 404) {
            fail(fallbackMessage("model-missing"));
            return;
          }

          fail(fallbackMessage("default"));
          return;
        }

        if (!ollamaResponse.body) {
          fail(fallbackMessage("default"));
          return;
        }

        reader = ollamaResponse.body.getReader();

        const decoder = new TextDecoder();
        let buffer = "";
        let sentAnything = false;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const parsed = parseOllamaLine(line);

            if (parsed.error) {
              fail(`Ollama error: ${parsed.error}`);
              return;
            }

            if (parsed.text) {
              sentAnything = true;
              send(parsed.text);
            }

            if (parsed.done) {
              close();
              return;
            }
          }
        }

        if (buffer.trim()) {
          const parsed = parseOllamaLine(buffer);

          if (parsed.error) {
            fail(`Ollama error: ${parsed.error}`);
            return;
          }

          if (parsed.text) {
            sentAnything = true;
            send(parsed.text);
          }
        }

        if (!sentAnything) {
          send("I connected to Ollama, but it sent back an empty response. That is rude, but fixable.");
        }

        close();
      } catch (error) {
        if (error?.name === "AbortError") {
          close();
          return;
        }

        console.error("GoofyAI route error:", error);
        fail(fallbackMessage("default"));
      } finally {
        try {
          reader?.releaseLock();
        } catch {}
      }
    },
  });

  return makeStreamResponse(stream);
}