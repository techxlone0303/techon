#!/usr/bin/env python3
"""
Wrapper script for RAG store - handles CLI arguments
Usage: python rag_cli.py <input_json_path>
"""

import json
import sys
import os

from rag_store import RAGStore

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No input file provided'}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    
    try:
        with open(input_path, 'r') as f:
            params = json.load(f)
        
        query = params.get('query', '')
        top_k = params.get('top_k', 5)
        
        rag = RAGStore()
        results = rag.retrieve_similar_matches(query, top_k)
        print(json.dumps(results))
    
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
    finally:
        if os.path.exists(input_path):
            os.remove(input_path)

