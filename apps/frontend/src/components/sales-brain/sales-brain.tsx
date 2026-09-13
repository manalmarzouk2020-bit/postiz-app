'use client';

import { FC, useState } from 'react';
import clsx from 'clsx';
import { SalesBrainDashboard } from '@gitroom/frontend/components/sales-brain/dashboard';
import { SalesBrainLeadsList } from '@gitroom/frontend/components/sales-brain/leads-list';
import { SalesBrainProducts } from '@gitroom/frontend/components/sales-brain/products';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

type Tab = 'dashboard' | 'leads' | 'products';

export const SalesBrain: FC = () => {
  const [tab, setTab] = useState<Tab>('dashboard');
  const t = useT();

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: t('dashboard', 'Dashboard') },
    { key: 'leads', label: t('leads', 'Leads') },
    { key: 'products', label: t('products_offers', 'Products & Offers') },
  ];

  return (
    <div className="bg-newBgColorInner p-[20px] flex flex-1 flex-col gap-[20px]">
      <div className="flex gap-[8px] border-b border-fifth pb-[10px]">
        {tabs.map((item) => (
          <div
            key={item.key}
            onClick={() => setTab(item.key)}
            className={clsx(
              'px-[16px] py-[8px] rounded-[4px] cursor-pointer select-none text-[14px]',
              tab === item.key
                ? 'bg-forth font-[600]'
                : 'opacity-60 hover:opacity-100'
            )}
          >
            {item.label}
          </div>
        ))}
      </div>
      {tab === 'dashboard' && <SalesBrainDashboard />}
      {tab === 'leads' && <SalesBrainLeadsList />}
      {tab === 'products' && <SalesBrainProducts />}
    </div>
  );
};
