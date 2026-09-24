#!/usr/bin/env python3
"""
Wrapper script for strategy simulator - handles CLI arguments
Usage: python strategy_cli.py <input_json_path>
"""

import json
import sys
import os

from strategy_simulator import StrategySimulator

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No input file provided'}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    
    try:
        with open(input_path, 'r') as f:
            features = json.load(f)
        
        simulator = StrategySimulator(num_simulations=1000)
        result = simulator.simulate_match(features)
        print(json.dumps(result))
    
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
    finally:
        if os.path.exists(input_path):
            os.remove(input_path)

