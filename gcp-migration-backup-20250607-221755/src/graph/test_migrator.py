"""Tests for NebulaGraphMigrator."""

import asyncio
from unittest.mock import AsyncMock

from .data_migrator import NebulaGraphMigrator, MigrationStats


class FakeNebulaClient:
    async def upsert_vertices(self, vertices):
        self.vertices = vertices
        return True

    async def upsert_edges(self, edges):
        self.edges = edges
        return True


async def test_migrate_from_tigergraph():
    nebula = FakeNebulaClient()
    migrator = NebulaGraphMigrator(nebula)

    tg_client = AsyncMock()
    tg_client.export_graph.return_value = {
        "vertices": [{"id": 1}],
        "edges": [{"from": 1, "to": 2}]
    }

    stats = await migrator.migrate_from_tigergraph(tg_client)

    assert stats.nodes_created == 1
    assert stats.edges_created == 1
    assert nebula.vertices == [{"id": 1}]
    assert nebula.edges == [{"from": 1, "to": 2}]
