#!/usr/bin/env python3
"""RAG Store - reads JSON from stdin, outputs JSON to stdout"""

import json
import sys
import os
from typing import List, Dict, Any

# Mock RAG for demo - in production, this would use FAISS
MOCK_HISTORY = [
    {'teamName': 'C9', 'result': 'win', 'score': '13-5', 'opponent': 'T1'},
    {'teamName': 'C9', 'result': 'loss', 'score': '11-13', 'opponent': 'G2'},
    {'teamName': 'C9', 'result': 'win', 'score': '13-3', 'opponent': 'NAVI'},
]


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Simple cosine similarity"""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    return dot / (norm_a * norm_b) if norm_a * norm_b > 0 else 0


def text_to_vector(text: str) -> List[float]:
    """Simple bag-of-words vectorization"""
    words = text.lower().split()
    word_counts = {}
    for word in words:
        word_counts[word] = word_counts.get(word, 0) + 1
    return list(word_counts.values())


def find_similar_matches(query: str, history: List[Dict], top_k: int = 5) -> List[Dict]:
    """Find similar matches based on query"""
    query_vec = text_to_vector(query)
    scored = []
    
    for match in history:
        match_text = f"{match.get('teamName', '')} {match.get('result', '')} {match.get('opponent', '')}"
        match_vec = text_to_vector(match_text)
        sim = cosine_similarity(query_vec, match_vec)
        scored.append((sim, match))
    
    scored.sort(key=lambda x: -x[0])
    
    results = []
    for i, (sim, match) in enumerate(scored[:top_k]):
        result = match.copy()
        result['similarity'] = round(sim, 3)
        result['rank'] = i + 1
        results.append(result)
    
    return results


class RAGStore:
    def __init__(self, history: List[Dict] = None):
        self.history = history if history is not None else MOCK_HISTORY

    def retrieve_similar_matches(self, query: str, top_k: int = 5) -> List[Dict]:
        return find_similar_matches(query, self.history, top_k)


def main():
    try:
        input_data = json.loads(sys.stdin.read())
        query = input_data.get('query', '')
        top_k = input_data.get('top_k', 5)
        
        similar_matches = find_similar_matches(query, MOCK_HISTORY, top_k)
        
        print(json.dumps({'similar_matches': similar_matches}))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()

