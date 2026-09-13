'use client';

import { FC, useCallback, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useSalesBrainPlaybook } from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { Button } from '@gitroom/react/form/button';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const SECTION_LABELS: Record<string, string> = {
  idealCustomers: 'Ideal customers',
  buyerPersonas: 'Buyer personas',
  painPoints: 'Pain points',
  buyingTriggers: 'Buying triggers',
  discoveryQuestions: 'Discovery questions',
  valuePropositions: 'Value propositions',
  productPositioning: 'Product positioning',
  objectionLibrary: 'Objections & responses',
  competitorDifferentiation: 'Competitor differentiation',
  closingStrategies: 'Closing strategies',
  followUpSequences: 'Follow-up sequences',
  qualificationRules: 'Qualification rules',
  escalationRules: 'Escalation rules',
  upsellStrategy: 'Upsell strategy',
};

export const SalesBrainPlaybook: FC = () => {
  const { data, mutate, isLoading } = useSalesBrainPlaybook();
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const [generating, setGenerating] = useState(false);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      await fetch('/sales-brain/playbook/generate', { method: 'POST' });
      await mutate();
      toaster.show(t('playbook_generated', 'Playbook generated'), 'success');
    } catch (e) {
      toaster.show(
        t(
          'playbook_generation_failed',
          'Could not generate a playbook — add at least one product first'
        ),
        'warning'
      );
    } finally {
      setGenerating(false);
    }
  }, [mutate]);

  const content = data?.content;

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px]">{t('sales_playbook', 'Sales Playbook')}</h3>
        <Button onClick={generate} disabled={generating}>
          {content
            ? t('regenerate', 'Regenerate')
            : t('generate_playbook', 'Generate playbook')}
        </Button>
      </div>
      {!isLoading && !content && (
        <div className="text-customColor18">
          {t(
            'no_playbook_yet',
            'No playbook yet. Add your products first, then generate one — it is built entirely from your own product data.'
          )}
        </div>
      )}
      {!!content && (
        <div className="flex flex-col gap-[14px]">
          {Object.entries(SECTION_LABELS).map(([key, label]) => {
            const value = content[key];
            if (!value || (Array.isArray(value) && !value.length)) return null;
            return (
              <div
                key={key}
                className="bg-sixth border-fifth border rounded-[4px] p-[16px]"
              >
                <h4 className="text-[14px] font-[600] mb-[8px]">{label}</h4>
                {typeof value === 'string' && (
                  <div className="text-[13px]">{value}</div>
                )}
                {Array.isArray(value) && (
                  <ul className="flex flex-col gap-[6px] text-[13px] list-disc ps-[18px]">
                    {value.map((item: any, i: number) => (
                      <li key={i}>
                        {typeof item === 'string'
                          ? item
                          : item.objection
                          ? `${item.objection} → ${item.response}`
                          : `${item.name}: ${item.description}`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
