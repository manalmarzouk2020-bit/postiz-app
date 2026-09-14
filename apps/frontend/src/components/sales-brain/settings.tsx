'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import {
  useSalesBrainSettings,
  useSalesBrainAuditLog,
} from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { Button } from '@gitroom/react/form/button';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const LEVELS: { value: string; title: string; description: string }[] = [
  {
    value: 'COPILOT',
    title: 'Copilot',
    description: 'The AI only suggests responses. Nothing is sent without you writing it.',
  },
  {
    value: 'ASSISTED',
    title: 'Assisted',
    description: 'The AI drafts replies and follow-ups. A human approves each one before it counts as sent.',
  },
  {
    value: 'AUTONOMOUS',
    title: 'Autonomous',
    description: 'The AI replies automatically to conversations.',
  },
  {
    value: 'AUTONOMOUS_SALES',
    title: 'Autonomous Sales',
    description: 'The AI qualifies, nurtures, recommends products and pushes toward closing on its own, within your product data.',
  },
];

export const SalesBrainSettings: FC = () => {
  const { data, mutate } = useSalesBrainSettings();
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const [saving, setSaving] = useState(false);
  const [assistantName, setAssistantName] = useState('');

  useEffect(() => {
    setAssistantName(data?.assistantName || '');
  }, [data?.assistantName]);

  const setLevel = useCallback(
    (level: string) => async () => {
      setSaving(true);
      try {
        await fetch('/sales-brain/settings', {
          method: 'PUT',
          body: JSON.stringify({ autonomyLevel: level }),
        });
        await mutate();
        toaster.show(t('settings_saved', 'Settings saved'), 'success');
      } finally {
        setSaving(false);
      }
    },
    [mutate]
  );

  const saveAssistantName = useCallback(async () => {
    setSaving(true);
    try {
      await fetch('/sales-brain/settings', {
        method: 'PUT',
        body: JSON.stringify({ assistantName }),
      });
      await mutate();
      toaster.show(t('settings_saved', 'Settings saved'), 'success');
    } finally {
      setSaving(false);
    }
  }, [assistantName, mutate]);

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[16px]">
        <h3 className="text-[20px]">{t('ai_autonomy_level', 'AI autonomy level')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
          {LEVELS.map((level) => (
            <div
              key={level.value}
              onClick={saving ? undefined : setLevel(level.value)}
              className={clsx(
                'bg-sixth border rounded-[4px] p-[16px] flex flex-col gap-[6px] cursor-pointer transition-colors',
                data?.autonomyLevel === level.value
                  ? 'border-primary'
                  : 'border-fifth hover:border-primary/50'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-[600]">{level.title}</span>
                {data?.autonomyLevel === level.value && (
                  <span className="text-[11px] text-primary">
                    {t('active', 'Active')}
                  </span>
                )}
              </div>
              <div className="text-[13px] text-customColor18">
                {level.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-[10px]">
        <h3 className="text-[20px]">{t('white_label', 'White-label')}</h3>
        <div className="bg-sixth border-fifth border rounded-[4px] p-[16px] flex flex-col gap-[10px]">
          <div className="text-[13px] text-customColor18">
            {t(
              'assistant_name_explainer',
              'Give the AI persona a name your customers see instead of a generic label. Used in every reply, follow-up and playbook it generates.'
            )}
          </div>
          <div className="flex gap-[10px]">
            <input
              className="flex-1 bg-forth rounded-[4px] p-[10px] text-[14px] outline-none"
              placeholder={t('assistant_name_placeholder', 'e.g. Aria, your sales assistant name...')}
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
            />
            <Button onClick={saveAssistantName} disabled={saving}>
              {t('save', 'Save')}
            </Button>
          </div>
        </div>
      </div>

      <AuditLogSection />
    </div>
  );
};

const AuditLogSection: FC = () => {
  const { data } = useSalesBrainAuditLog();
  const t = useT();

  return (
    <div className="flex flex-col gap-[10px]">
      <h3 className="text-[20px]">{t('audit_log', 'Audit log')}</h3>
      {!data?.length && (
        <div className="text-customColor18">
          {t(
            'no_audit_entries_yet',
            'No admin actions recorded yet. Only organization admins can see this.'
          )}
        </div>
      )}
      {!!data?.length && (
        <div className="bg-sixth border-fifth border rounded-[4px] p-[16px] flex flex-col gap-[6px] max-h-[300px] overflow-y-auto">
          {data.map((entry: any) => (
            <div key={entry.id} className="flex justify-between text-[12px]">
              <span>
                {entry.action} · {entry.entityType}
                {entry.entityId ? ` (${entry.entityId.slice(0, 8)})` : ''}
              </span>
              <span className="text-customColor18">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
