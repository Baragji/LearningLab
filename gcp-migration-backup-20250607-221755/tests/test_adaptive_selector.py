from src.core.adaptive_embedding_selector import AdaptiveEmbeddingSelector


def test_selector_not_implemented():
    selector = AdaptiveEmbeddingSelector()
    # This call should raise until implemented
    selector.select_model("example text")
