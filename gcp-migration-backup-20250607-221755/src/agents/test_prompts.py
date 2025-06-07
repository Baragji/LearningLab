"""Tests for prompt templates."""

import pytest
from . import prompts


def test_get_known_prompt():
    template = prompts.get_prompt("query_planner")
    assert "Plan" in template


def test_get_unknown_prompt():
    with pytest.raises(KeyError):
        prompts.get_prompt("nonexistent")
