"""Prompt templates for agentic RAG components."""

from dataclasses import dataclass
from typing import Dict

@dataclass
class PromptTemplate:
    name: str
    template: str

# Basic prompt templates used across the system
PROMPTS: Dict[str, PromptTemplate] = {
    "query_planner": PromptTemplate(
        name="query_planner",
        template="""Plan how to answer the following user query:
{query}
Return a list of retrieval steps.""",
    ),
    "synthesizer": PromptTemplate(
        name="synthesizer",
        template="""Using the retrieved context, craft a comprehensive answer to:
{query}
Include citations when possible.""",
    ),
}


def get_prompt(name: str) -> str:
    """Retrieve a prompt template by name."""
    if name not in PROMPTS:
        raise KeyError(f"Unknown prompt template: {name}")
    return PROMPTS[name].template
