"""
Benchmark script for evaluating the RAG system performance.
"""

import json
import time
import requests
import numpy as np
from typing import List, Dict, Any, Tuple


def recall_at_k(retrieved_docs_ids: List[str], relevant_docs_ids: List[str], k: int) -> float:
    """
    Calculate Recall@K metric.
    
    Args:
        retrieved_docs_ids: List of retrieved document IDs
        relevant_docs_ids: List of relevant document IDs (ground truth)
        k: Number of top results to consider
        
    Returns:
        Recall@K score (0.0 to 1.0)
    """
    retrieved_k = retrieved_docs_ids[:k]
    relevant_set = set(relevant_docs_ids)
    if not relevant_set:
        return 0.0
    true_positives = len(set(retrieved_k).intersection(relevant_set))
    return true_positives / len(relevant_set)


def precision_at_k(retrieved_docs_ids: List[str], relevant_docs_ids: List[str], k: int) -> float:
    """
    Calculate Precision@K metric.
    
    Args:
        retrieved_docs_ids: List of retrieved document IDs
        relevant_docs_ids: List of relevant document IDs (ground truth)
        k: Number of top results to consider
        
    Returns:
        Precision@K score (0.0 to 1.0)
    """
    retrieved_k = retrieved_docs_ids[:k]
    if k == 0:
        return 0.0
    relevant_set = set(relevant_docs_ids)
    true_positives = len(set(retrieved_k).intersection(relevant_set))
    return true_positives / k


def mean_reciprocal_rank(list_of_retrieved_doc_lists: List[List[str]], 
                         list_of_relevant_doc_lists: List[List[str]]) -> float:
    """
    Calculate Mean Reciprocal Rank (MRR) metric.
    
    Args:
        list_of_retrieved_doc_lists: List of lists of retrieved document IDs
        list_of_relevant_doc_lists: List of lists of relevant document IDs (ground truth)
        
    Returns:
        MRR score (0.0 to 1.0)
    """
    reciprocal_ranks = []
    for retrieved_for_query, relevant_for_query in zip(list_of_retrieved_doc_lists, list_of_relevant_doc_lists):
        if not relevant_for_query:
            reciprocal_ranks.append(0)
            continue
        
        first_relevant_doc_id = relevant_for_query[0]
        
        rank = 0
        found = False
        for i, doc_id in enumerate(retrieved_for_query):
            if doc_id == first_relevant_doc_id:
                rank = i + 1
                found = True
                break
        if found:
            reciprocal_ranks.append(1 / rank)
        else:
            reciprocal_ranks.append(0)
            
    return sum(reciprocal_ranks) / len(reciprocal_ranks) if reciprocal_ranks else 0.0


def run_benchmark(test_queries: List[Dict[str, Any]], 
                  server_url: str = "http://localhost:5004/search",
                  n_results: int = 10) -> Dict[str, Any]:
    """
    Run benchmark on a set of test queries.
    
    Args:
        test_queries: List of dictionaries with keys:
            - query: Query text
            - filepath: Optional filepath for context
            - relevant_docs: List of relevant document IDs (ground truth)
        server_url: URL of the search endpoint
        n_results: Number of results to retrieve
        
    Returns:
        Dictionary with benchmark results
    """
    results = {
        "queries": [],
        "metrics": {
            "recall@1": [],
            "recall@3": [],
            "recall@5": [],
            "recall@10": [],
            "precision@1": [],
            "precision@3": [],
            "precision@5": [],
            "precision@10": [],
            "response_times": []
        }
    }
    
    all_retrieved_lists = []
    all_relevant_lists = []
    
    for i, test_query in enumerate(test_queries):
        query_text = test_query["query"]
        filepath = test_query.get("filepath", "")
        relevant_docs = test_query.get("relevant_docs", [])
        
        print(f"Running query {i+1}/{len(test_queries)}: '{query_text}'")
        
        # Prepare request
        payload = {
            "query": query_text,
            "n_results": n_results,
            "filepath": filepath
        }
        
        # Measure response time
        start_time = time.time()
        response = requests.post(server_url, json=payload)
        end_time = time.time()
        response_time = end_time - start_time
        
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            continue
        
        # Parse response
        response_data = response.json()
        retrieved_results = response_data.get("results", [])
        
        # Extract document IDs from results
        retrieved_ids = [result.get("metadata", {}).get("chunk_id", "") for result in retrieved_results]
        
        # Calculate metrics
        recall_1 = recall_at_k(retrieved_ids, relevant_docs, 1)
        recall_3 = recall_at_k(retrieved_ids, relevant_docs, 3)
        recall_5 = recall_at_k(retrieved_ids, relevant_docs, 5)
        recall_10 = recall_at_k(retrieved_ids, relevant_docs, 10)
        
        precision_1 = precision_at_k(retrieved_ids, relevant_docs, 1)
        precision_3 = precision_at_k(retrieved_ids, relevant_docs, 3)
        precision_5 = precision_at_k(retrieved_ids, relevant_docs, 5)
        precision_10 = precision_at_k(retrieved_ids, relevant_docs, 10)
        
        # Store results
        results["queries"].append({
            "query": query_text,
            "filepath": filepath,
            "relevant_docs": relevant_docs,
            "retrieved_ids": retrieved_ids,
            "response_time": response_time,
            "metrics": {
                "recall@1": recall_1,
                "recall@3": recall_3,
                "recall@5": recall_5,
                "recall@10": recall_10,
                "precision@1": precision_1,
                "precision@3": precision_3,
                "precision@5": precision_5,
                "precision@10": precision_10
            }
        })
        
        # Update aggregated metrics
        results["metrics"]["recall@1"].append(recall_1)
        results["metrics"]["recall@3"].append(recall_3)
        results["metrics"]["recall@5"].append(recall_5)
        results["metrics"]["recall@10"].append(recall_10)
        results["metrics"]["precision@1"].append(precision_1)
        results["metrics"]["precision@3"].append(precision_3)
        results["metrics"]["precision@5"].append(precision_5)
        results["metrics"]["precision@10"].append(precision_10)
        results["metrics"]["response_times"].append(response_time)
        
        # Store for MRR calculation
        all_retrieved_lists.append(retrieved_ids)
        all_relevant_lists.append(relevant_docs)
    
    # Calculate MRR
    mrr = mean_reciprocal_rank(all_retrieved_lists, all_relevant_lists)
    results["metrics"]["mrr"] = mrr
    
    # Calculate averages
    for metric in ["recall@1", "recall@3", "recall@5", "recall@10", 
                  "precision@1", "precision@3", "precision@5", "precision@10"]:
        results["metrics"][f"avg_{metric}"] = np.mean(results["metrics"][metric])
    
    results["metrics"]["avg_response_time"] = np.mean(results["metrics"]["response_times"])
    
    return results


def create_test_queries() -> List[Dict[str, Any]]:
    """
    Create a set of test queries for benchmarking.
    
    Returns:
        List of test query dictionaries
    """
    # This is a placeholder - in a real scenario, you would create
    # test queries based on your codebase and ground truth
    return [
        {
            "query": "How to implement vector search",
            "filepath": "",
            "relevant_docs": []  # Add relevant document IDs here
        },
        {
            "query": "ChromaDB initialization",
            "filepath": "",
            "relevant_docs": []  # Add relevant document IDs here
        },
        {
            "query": "Ranking algorithm for search results",
            "filepath": "",
            "relevant_docs": []  # Add relevant document IDs here
        }
    ]


if __name__ == "__main__":
    # Create test queries
    test_queries = create_test_queries()
    
    # Run benchmark
    benchmark_results = run_benchmark(test_queries)
    
    # Print results
    print("\nBenchmark Results:")
    print(f"MRR: {benchmark_results['metrics']['mrr']:.4f}")
    print(f"Average Recall@1: {benchmark_results['metrics']['avg_recall@1']:.4f}")
    print(f"Average Recall@5: {benchmark_results['metrics']['avg_recall@5']:.4f}")
    print(f"Average Precision@1: {benchmark_results['metrics']['avg_precision@1']:.4f}")
    print(f"Average Precision@5: {benchmark_results['metrics']['avg_precision@5']:.4f}")
    print(f"Average Response Time: {benchmark_results['metrics']['avg_response_time']:.4f} seconds")
    
    # Save results to file
    with open("benchmark_results.json", "w") as f:
        json.dump(benchmark_results, f, indent=2)