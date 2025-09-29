from ..config import settings
import litellm
import json
import re


def load_system_prompt() -> str:
    try:
        with open(settings.system_prompt_path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        return "You are a helpful assistant."


from typing import AsyncGenerator, Dict, Any, List
from app import schemas
from .rag_service import rag_service

async def generate_assistant_reply(history: List[schemas.Message]) -> AsyncGenerator[Dict[str, Any], None]:
    user_query = next((m.content for m in reversed(history) if m.role == 'user'), None)
    if not user_query:
        yield {"type": "error", "data": "No user query found."}
        return

    # 1. Retrieve context using RAG
    context_docs = rag_service.search(user_query, k=3)
    if context_docs:
        yield {"type": "context", "data": context_docs}

    system_prompt = load_system_prompt()
    if context_docs:
        # The LLM needs the full content in its prompt
        context_str = "\n\n".join([f"Source ID: {i}\nContent: {doc['content']}" for i, doc in enumerate(context_docs)])
        system_prompt += f"\n\nHere are the source documents:\n\n{context_str}"

    messages = [{"role": "system", "content": system_prompt}]
    for m in history:
        messages.append({"role": m.role, "content": m.content})

    try:
        response = await litellm.acompletion(
            model=settings.llm_model,
            messages=messages,
            temperature=0.1,
            stream=True
        )

        buffer = ""
        in_citation = False
        async for chunk in response:
            buffer += chunk.choices[0].delta.content or ""

            while True:
                if not in_citation:
                    start_tag_pos = buffer.find('<citation')
                    if start_tag_pos == -1:
                        yield {"type": "delta", "data": buffer}
                        buffer = ""
                        break
                    
                    if start_tag_pos > 0:
                        yield {"type": "delta", "data": buffer[:start_tag_pos]}
                    
                    buffer = buffer[start_tag_pos:]

                    end_tag_pos = buffer.find('>')
                    if end_tag_pos == -1:
                        break # Wait for more chunks

                    tag_content = buffer[:end_tag_pos + 1]
                    source_id_match = re.search(r'source_id="(\d+)"', tag_content)
                    
                    if source_id_match:
                        source_id = int(source_id_match.group(1))
                        if source_id < len(context_docs):
                            # Pass the full doc object, which now includes content in metadata
                            yield {"type": "citation_start", "data": {"source": context_docs[source_id]}}
                            in_citation = True
                    
                    buffer = buffer[end_tag_pos + 1:]

                else: # We are inside a citation
                    end_tag_pos = buffer.find('</citation>')
                    if end_tag_pos == -1:
                        yield {"type": "citation_delta", "data": buffer}
                        buffer = ""
                        break

                    if end_tag_pos > 0:
                        yield {"type": "citation_delta", "data": buffer[:end_tag_pos]}
                    
                    yield {"type": "citation_end"}
                    in_citation = False
                    buffer = buffer[end_tag_pos + len('</citation>'):]

    except Exception as e:
        yield {"type": "error", "data": f"[Error processing LLM response: {type(e).__name__}]"}
