'use client';

import { FC, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useSalesBrainHandoffs } from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { Button } from '@gitroom/react/form/button';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export const SalesBrainHandoffs: FC = () => {
  const { data, mutate } = useSalesBrainHandoffs();
  const fetch = useFetch();
  const toaster = useToaster();
  const router = useRouter();
  const t = useT();

  const resolve = useCallback(
    (conversationId: string) => async () => {
      await fetch(`/sales-brain/handoffs/${conversationId}/resolve`, {
        method: 'POST',
      });
      mutate();
      toaster.show(t('handoff_resolved', 'Handoff resolved'), 'success');
    },
    []
  );

  return (
    <div className="flex flex-col gap-[16px]">
      <h3 className="text-[20px]">
        {t('human_handoffs', 'Needs human attention')}
      </h3>
      {!data?.length && (
        <div className="text-customColor18">
          {t(
            'no_handoffs',
            'No conversation currently needs a human — the Sales Brain is handling everything within its rules.'
          )}
        </div>
      )}
      <div className="flex flex-col gap-[12px]">
        {data?.map((conversation: any) => (
          <div
            key={conversation.id}
            className="bg-sixth border-fifth border rounded-[4px] p-[16px] flex flex-col gap-[8px]"
          >
            <div className="flex justify-between items-start">
              <div>
                <div
                  className="font-[600] cursor-pointer hover:underline"
                  onClick={() => router.push(`/sales-brain/${conversation.lead.id}`)}
                >
                  {conversation.lead?.name ||
                    conversation.lead?.email ||
                    t('unnamed_lead', 'Unnamed lead')}
                </div>
                <div className="text-[12px] text-red-300 mt-[2px]">
                  {conversation.escalationReason ||
                    t('escalation_reason_unspecified', 'Escalation reason not specified')}
                </div>
              </div>
              <Button onClick={resolve(conversation.id)}>
                {t('mark_resolved', 'Mark resolved')}
              </Button>
            </div>
            {!!conversation.messages?.length && (
              <div className="text-[13px] text-customColor18 border-t border-fifth pt-[8px]">
                {t('last_message', 'Last message')}:{' '}
                {conversation.messages[0]?.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
