'use client';

import { FC, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useSalesBrainFollowups } from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { Button } from '@gitroom/react/form/button';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export const SalesBrainFollowups: FC = () => {
  const { data, mutate } = useSalesBrainFollowups();
  const fetch = useFetch();
  const router = useRouter();
  const t = useT();

  const cancel = useCallback(
    (id: string) => async () => {
      await fetch(`/sales-brain/followups/${id}/cancel`, { method: 'POST' });
      mutate();
    },
    []
  );

  return (
    <div className="flex flex-col gap-[16px]">
      <h3 className="text-[20px]">{t('followups_due', 'Follow-ups due')}</h3>
      {!data?.length && (
        <div className="text-customColor18">
          {t(
            'no_followups_due',
            'Nothing due. The Sales Brain schedules a follow-up automatically whenever a lead goes quiet or asks to be contacted later.'
          )}
        </div>
      )}
      <div className="flex flex-col gap-[10px]">
        {data?.map((f: any) => (
          <div
            key={f.id}
            className="bg-sixth border-fifth border rounded-[4px] p-[16px] flex justify-between items-center"
          >
            <div>
              <div
                className="font-[600] cursor-pointer hover:underline"
                onClick={() => router.push(`/sales-brain/${f.lead.id}`)}
              >
                {f.lead?.name || f.lead?.email || t('unnamed_lead', 'Unnamed lead')}
              </div>
              <div className="text-[12px] text-customColor18">{f.reason}</div>
              <div className="text-[11px] text-customColor18">
                {t('due', 'Due')}: {new Date(f.scheduledAt).toLocaleString()}
              </div>
            </div>
            <Button onClick={cancel(f.id)}>{t('cancel', 'Cancel')}</Button>
          </div>
        ))}
      </div>
    </div>
  );
};
