#!/usr/bin/env python3
"""Feature Engineering - reads JSON from stdin, outputs JSON to stdout"""

import json
import sys
import pandas as pd
import numpy as np
from typing import List, Dict, Any


def calculate_win_rate_trend(matches: List[Dict]) -> float:
    if len(matches) < 2:
        return 0.0
    df = pd.DataFrame(matches)
    df['win'] = df['result'].apply(lambda x: 1 if x == 'win' else 0)
    df['rolling_win_rate'] = df['win'].rolling(window=3, min_periods=1).mean()
    recent_trend = df['rolling_win_rate'].iloc[-1] - df['win'].mean()
    return float(np.clip(recent_trend, -1, 1))


def calculate_tempo_score(matches: List[Dict]) -> float:
    if not matches:
        return 0.5
    tempo_scores = []
    for match in matches:
        try:
            score = match.get('score', '0 - 0')
            parts = score.split(' - ')
            total_rounds = int(parts[0]) + int(parts[1])
            if total_rounds > 0:
                tempo_scores.append(1 - (total_rounds / 30))
        except:
            continue
    return float(np.clip(np.mean(tempo_scores) if tempo_scores else 0.5, 0, 1))


def calculate_comeback_probability(matches: List[Dict]) -> float:
    if not matches:
        return 0.5
    comebacks = 0
    total = 0
    for match in matches:
        try:
            score = match.get('score', '0 - 0')
            parts = score.split(' - ')
            won = int(parts[0])
            lost = int(parts[1])
            if match.get('result') == 'loss' and lost - won <= 2:
                total += 1
            if match.get('result') == 'win' and won - lost >= 4:
                comebacks += 1
                total += 1
        except:
            continue
    return float(comebacks / total if total > 0 else 0.5)


def extract_features(input_data: Dict) -> Dict:
    matches = input_data.get('matches', [])
    result = {
        'win_rate_trend': calculate_win_rate_trend(matches),
        'tempo_score': calculate_tempo_score(matches),
        'comeback_probability': calculate_comeback_probability(matches),
    }
    if matches:
        wins = sum(1 for m in matches if m.get('result') == 'win')
        result['win_rate'] = wins / len(matches)
    else:
        result['win_rate'] = 0.5
    return result


def main():
    try:
        input_data = json.loads(sys.stdin.read())
        result = extract_features(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()

