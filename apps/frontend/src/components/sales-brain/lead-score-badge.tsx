import { FC } from 'react';
import clsx from 'clsx';

const BAND_STYLES: Record<string, string> = {
  cold: 'bg-gray-500/20 text-gray-300',
  low_intent: 'bg-blue-500/20 text-blue-300',
  potential: 'bg-yellow-500/20 text-yellow-300',
  qualified: 'bg-teal-500/20 text-teal-300',
  hot: 'bg-red-500/20 text-red-300',
};

export const scoreToBand = (score: number) => {
  if (score <= 20) return 'cold';
  if (score <= 40) return 'low_intent';
  if (score <= 60) return 'potential';
  if (score <= 80) return 'qualified';
  return 'hot';
};

export const LeadScoreBadge: FC<{ score: number }> = ({ score }) => {
  const band = scoreToBand(score);
  return (
    <span
      className={clsx(
        'px-[10px] py-[2px] rounded-full text-[12px] font-[600] whitespace-nowrap',
        BAND_STYLES[band]
      )}
    >
      {score} · {band.replace('_', ' ')}
    </span>
  );
};
