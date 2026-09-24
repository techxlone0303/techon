#!/usr/bin/env python3
"""Strategy Simulator - reads JSON from stdin, outputs JSON to stdout"""

import json
import sys
import random
from typing import Dict, Any


def simulate_match(features: Dict) -> Dict:
    """Monte Carlo style win probability estimation"""
    # Base probability from features
    base_prob = 0.5
    
    # Adjust by win rate
    win_rate = features.get('win_rate', 0.5)
    base_prob += (win_rate - 0.5) * 0.4
    
    # Adjust by tempo
    tempo = features.get('tempo_score', 0.5)
    base_prob += (tempo - 0.5) * 0.1
    
    # Adjust by comeback ability
    comeback = features.get('comeback_probability', 0.5)
    base_prob += (comeback - 0.5) * 0.1
    
    # Clamp
    base_prob = max(0.1, min(0.9, base_prob))
    
    # Monte Carlo simulation
    wins = 0
    num_simulations = 1000
    
    for _ in range(num_simulations):
        if random.random() < base_prob:
            wins += 1
    
    win_probability = wins / num_simulations
    
    return {
        'predicted_win_probability': round(win_probability, 3),
    }


class StrategySimulator:
    def __init__(self, num_simulations: int = 1000):
        self.num_simulations = num_simulations

    def simulate_match(self, features: Dict) -> Dict:
        return simulate_match(features)


def main():
    try:
        input_data = json.loads(sys.stdin.read())
        result = simulate_match(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()

