import { ScoreLevel } from '../types/division';

export function getScoreLevel(actual: number, target: number): ScoreLevel {
  const percentage = (actual / target) * 100;
  
  if (percentage >= 95) return 'excellent';
  if (percentage >= 80) return 'good';
  if (percentage >= 60) return 'warning';
  return 'poor';
}

export function getScoreColor(level: ScoreLevel): string {
  switch (level) {
    case 'excellent': return '#16a34a';
    case 'good': return '#84cc16';
    case 'warning': return '#d97706';
    case 'poor': return '#dc2626';
  }
}

export function getScorePercentage(actual: number, target: number): number {
  return Math.round((actual / target) * 100);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}