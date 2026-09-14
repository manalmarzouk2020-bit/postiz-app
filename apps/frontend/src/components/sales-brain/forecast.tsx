'use client';

import { FC } from 'react';
import { useSalesBrainForecast } from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const money = (n: number) => `$${n.toLocaleString()}`;

export const SalesBrainForecast: FC = () => {
  const { data } = useSalesBrainForecast();
  const t = useT();

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center gap-[10px]">
        <h3 className="text-[20px]">{t('sales_forecast', 'Sales Forecast')}</h3>
        <span className="text-[11px] px-[8px] py-[2px] rounded-full bg-yellow-500/20 text-yellow-300">
          {t('estimate', 'estimate')}
        </span>
      </div>
      <div className="text-[12px] text-customColor18">
        {t(
          'forecast_disclaimer',
          'Based on stage-weighted probabilities, not guaranteed outcomes. Numbers exclude leads without a priced product interest.'
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px]">
        <StatTile
          label={t('open_pipeline_value', 'Open pipeline value')}
          value={money(data?.pipelineValue ?? 0)}
        />
        <StatTile
          label={t('weighted_forecast', 'Weighted forecast')}
          value={money(data?.weightedForecast ?? 0)}
        />
        <StatTile
          label={t('won_revenue', 'Won revenue')}
          value={money(data?.wonRevenue ?? 0)}
        />
        <StatTile
          label={t('revenue_at_risk', 'Revenue at risk')}
          value={money(data?.revenueAtRisk ?? 0)}
        />
      </div>

      {!!data?.leadsWithoutPriceCount && (
        <div className="text-[12px] text-customColor18">
          {t(
            'leads_without_price',
            `${data.leadsWithoutPriceCount} lead(s) have no priced product interest and are excluded from these figures.`,
            { count: data.leadsWithoutPriceCount }
          )}
        </div>
      )}

      <div className="bg-sixth border-fifth border rounded-[4px] p-[24px]">
        <h4 className="text-[16px] mb-[16px]">{t('by_pipeline_stage', 'By pipeline stage')}</h4>
        <div className="grid grid-cols-[1fr,1fr,1fr,1fr] gap-y-[10px]">
          <div className="font-[600]">{t('stage', 'Stage')}</div>
          <div className="font-[600]">{t('leads', 'Leads')}</div>
          <div className="font-[600]">{t('value', 'Value')}</div>
          <div className="font-[600]">{t('weighted', 'Weighted')}</div>
          {Object.entries(data?.byStage || {}).map(([stage, s]: any) => (
            <>
              <div key={`${stage}-name`}>{stage}</div>
              <div key={`${stage}-count`}>{s.count}</div>
              <div key={`${stage}-value`}>{money(s.value)}</div>
              <div key={`${stage}-weighted`}>{money(Math.round(s.weightedValue))}</div>
            </>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatTile: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-sixth border-fifth border rounded-[4px] p-[16px] flex flex-col gap-[6px]">
    <div className="text-[22px] font-[600]">{value}</div>
    <div className="text-[12px] text-customColor18">{label}</div>
  </div>
);
