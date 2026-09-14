'use client';

import { FC, useCallback, useState } from 'react';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useSalesBrainInsights } from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { Button } from '@gitroom/react/form/button';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const CONFIDENCE_STYLES: Record<string, string> = {
  low: 'bg-gray-500/20 text-gray-300',
  medium: 'bg-yellow-500/20 text-yellow-300',
  high: 'bg-teal-500/20 text-teal-300',
};

export const SalesBrainInsights: FC = () => {
  const { data, mutate, isLoading } = useSalesBrainInsights();
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const [generating, setGenerating] = useState(false);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      await fetch('/sales-brain/insights/generate', { method: 'POST' });
      await mutate();
      toaster.show(t('insights_generated', 'Insights generated'), 'success');
    } finally {
      setGenerating(false);
    }
  }, [mutate]);

  const insights = data?.content?.insights || [];

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px]">{t('self_learning_insights', 'Insights')}</h3>
        <Button onClick={generate} disabled={generating}>
          {t('generate_insights', 'Generate insights')}
        </Button>
      </div>
      {!isLoading && !insights.length && (
        <div className="text-customColor18">
          {t(
            'no_insights_yet',
            'No insights yet. The more leads and conversations you have, the more useful these patterns become.'
          )}
        </div>
      )}
      <div className="flex flex-col gap-[10px]">
        {insights.map((insight: any, i: number) => (
          <div
            key={i}
            className="bg-sixth border-fifth border rounded-[4px] p-[16px] flex flex-col gap-[6px]"
          >
            <div className="flex justify-between items-start">
              <div className="font-[600] text-[14px]">{insight.pattern}</div>
              <span
                className={clsx(
                  'px-[8px] py-[2px] rounded-full text-[11px] whitespace-nowrap',
                  CONFIDENCE_STYLES[insight.confidence]
                )}
              >
                {insight.confidence}
              </span>
            </div>
            <div className="text-[12px] text-customColor18">{insight.evidence}</div>
            <div className="text-[13px]">
              <span className="text-customColor18">
                {t('recommended', 'Recommended')}:
              </span>{' '}
              {insight.recommendedAction}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
