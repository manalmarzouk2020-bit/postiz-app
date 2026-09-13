'use client';

import { FC } from 'react';
import { useRouter } from 'next/navigation';
import { useSalesBrainDashboard } from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { LeadScoreBadge } from '@gitroom/frontend/components/sales-brain/lead-score-badge';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const PIPELINE_ORDER = [
  'NEW',
  'QUALIFIED',
  'OPPORTUNITY',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
  'NURTURE',
];

export const SalesBrainDashboard: FC = () => {
  const { data } = useSalesBrainDashboard();
  const router = useRouter();
  const t = useT();

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[16px]">
        <StatTile
          label={t('total_leads', 'Total leads')}
          value={data?.totalLeads ?? '—'}
        />
        <StatTile
          label={t('hot_leads', 'Hot leads')}
          value={data?.byScoreBand?.hot ?? 0}
        />
        <StatTile
          label={t('qualified', 'Qualified')}
          value={data?.byScoreBand?.qualified ?? 0}
        />
        <StatTile
          label={t('potential', 'Potential')}
          value={data?.byScoreBand?.potential ?? 0}
        />
        <StatTile label={t('cold', 'Cold')} value={data?.byScoreBand?.cold ?? 0} />
      </div>

      <div className="bg-sixth border-fifth border rounded-[4px] p-[24px]">
        <h3 className="text-[18px] mb-[16px]">{t('pipeline', 'Pipeline')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-[10px]">
          {PIPELINE_ORDER.map((stage) => (
            <div
              key={stage}
              className="bg-forth rounded-[4px] p-[12px] flex flex-col items-center gap-[4px]"
            >
              <div className="text-[22px] font-[600]">
                {data?.byPipelineStage?.[stage] ?? 0}
              </div>
              <div className="text-[11px] text-customColor18 text-center">
                {stage}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-sixth border-fifth border rounded-[4px] p-[24px]">
        <h3 className="text-[18px] mb-[16px]">
          {t('hottest_leads', 'Hottest leads')}
        </h3>
        {!data?.hotLeads?.length && (
          <div className="text-customColor18">
            {t('no_leads_yet', 'No leads yet.')}
          </div>
        )}
        {!!data?.hotLeads?.length && (
          <div className="grid grid-cols-[1fr,1fr,1fr,1fr] gap-y-[10px]">
            <div className="font-[600]">{t('name', 'Name')}</div>
            <div className="font-[600]">{t('score', 'Score')}</div>
            <div className="font-[600]">{t('buying_stage', 'Buying stage')}</div>
            <div className="font-[600]">{t('pipeline', 'Pipeline')}</div>
            {data.hotLeads.map((lead: any) => (
              <>
                <div
                  key={`${lead.id}-name`}
                  className="cursor-pointer hover:underline"
                  onClick={() => router.push(`/sales-brain/${lead.id}`)}
                >
                  {lead.name || t('unnamed_lead', 'Unnamed lead')}
                </div>
                <div key={`${lead.id}-score`}>
                  <LeadScoreBadge score={lead.leadScore} />
                </div>
                <div key={`${lead.id}-stage`}>{lead.buyingStage}</div>
                <div key={`${lead.id}-pipeline`}>{lead.pipelineStage}</div>
              </>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatTile: FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div className="bg-sixth border-fifth border rounded-[4px] p-[16px] flex flex-col gap-[6px]">
    <div className="text-[24px] font-[600]">{value}</div>
    <div className="text-[12px] text-customColor18">{label}</div>
  </div>
);
