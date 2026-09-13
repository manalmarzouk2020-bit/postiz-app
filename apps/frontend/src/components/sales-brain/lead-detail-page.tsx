'use client';

import { FC } from 'react';
import { useRouter } from 'next/navigation';
import { SalesBrainLeadDetail } from '@gitroom/frontend/components/sales-brain/lead-detail';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export const SalesBrainLeadDetailPage: FC = () => {
  const router = useRouter();
  const t = useT();
  return (
    <div className="bg-newBgColorInner p-[20px] flex flex-1 flex-col gap-[16px]">
      <div
        className="flex items-center gap-[6px] cursor-pointer opacity-70 hover:opacity-100 w-fit"
        onClick={() => router.push('/sales-brain')}
      >
        ← {t('back_to_leads', 'Back to leads')}
      </div>
      <SalesBrainLeadDetail />
    </div>
  );
};
