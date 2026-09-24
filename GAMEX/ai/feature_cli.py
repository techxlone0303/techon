#!/usr/bin/env python3
"""
Wrapper script for feature engineering - reads from stdin
Usage: cat input.json | python feature_cli.py
"""

import json
import sys
import os

from feature_engineering import extract_features

if __name__ == '__main__':
    try:
        input_data = json.loads(sys.stdin.read())
        features = extract_features(input_data)
        print(json.dumps(features))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

