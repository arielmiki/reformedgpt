from ..config import settings
import litellm


def load_system_prompt() -> str:
    try:
        with open(settings.system_prompt_path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        return "You are a helpful assistant."


from typing import AsyncGenerator

async def generate_assistant_reply(history) -> AsyncGenerator[str, None]:
    system_prompt = load_system_prompt()
    # Build messages for LiteLLM / OpenAI format
    messages = [{"role": "system", "content": system_prompt}]

    for m in history or []:
        # Ensure roles are valid strings for the provider
        role = getattr(m, "role", None)
        content = getattr(m, "content", "")
        if not role or not content:
            continue
        # Keep only roles supported by chat models
        if role in ("user", "assistant", "system"):
            messages.append({"role": role, "content": content})

    try:
        resp = await litellm.acompletion(
            model=settings.llm_model,
            messages=messages,
            temperature=0.7,
            stream=True,
        )

        async for chunk in resp:
            chunk_content = chunk["choices"][0]["delta"]["content"]
            if chunk_content:
                yield chunk_content

    except Exception as e:
        # Fallback minimal message on provider error
        yield f"[Error contacting LLM: {type(e).__name__}]"
