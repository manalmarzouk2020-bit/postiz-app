'use client';

import { FC, useState } from 'react';
import clsx from 'clsx';
import { SalesBrainDashboard } from '@gitroom/frontend/components/sales-brain/dashboard';
import { SalesBrainLeadsList } from '@gitroom/frontend/components/sales-brain/leads-list';
import { SalesBrainProducts } from '@gitroom/frontend/components/sales-brain/products';
import { SalesBrainFollowups } from '@gitroom/frontend/components/sales-brain/followups';
import { SalesBrainHandoffs } from '@gitroom/frontend/components/sales-brain/handoffs';
import { SalesBrainPlaybook } from '@gitroom/frontend/components/sales-brain/playbook';
import { SalesBrainAsk } from '@gitroom/frontend/components/sales-brain/ask-brain';
import { SalesBrainSettings } from '@gitroom/frontend/components/sales-brain/settings';
import { SalesBrainAutomations } from '@gitroom/frontend/components/sales-brain/automations';
import { SalesBrainCoach } from '@gitroom/frontend/components/sales-brain/coach';
import { SalesBrainRoleplay } from '@gitroom/frontend/components/sales-brain/roleplay';
import { SalesBrainForecast } from '@gitroom/frontend/components/sales-brain/forecast';
import { SalesBrainExperiments } from '@gitroom/frontend/components/sales-brain/experiments';
import { SalesBrainInsights } from '@gitroom/frontend/components/sales-brain/insights';
import { useSalesBrainHandoffs } from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

type Tab =
  | 'dashboard'
  | 'leads'
  | 'products'
  | 'followups'
  | 'handoffs'
  | 'forecast'
  | 'playbook'
  | 'automations'
  | 'coach'
  | 'roleplay'
  | 'experiments'
  | 'insights'
  | 'ask'
  | 'settings';

export const SalesBrain: FC = () => {
  const [tab, setTab] = useState<Tab>('dashboard');
  const { data: handoffs } = useSalesBrainHandoffs();
  const t = useT();

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'dashboard', label: t('dashboard', 'Dashboard') },
    { key: 'leads', label: t('leads', 'Leads') },
    { key: 'followups', label: t('followups', 'Follow-ups') },
    {
      key: 'handoffs',
      label: t('handoffs', 'Handoffs'),
      badge: handoffs?.length || 0,
    },
    { key: 'forecast', label: t('forecast', 'Forecast') },
    { key: 'products', label: t('products_offers', 'Products & Offers') },
    { key: 'playbook', label: t('playbook', 'Playbook') },
    { key: 'automations', label: t('automations', 'Automations') },
    { key: 'coach', label: t('coach', 'Coach') },
    { key: 'roleplay', label: t('roleplay', 'Roleplay') },
    { key: 'experiments', label: t('experiments', 'Experiments') },
    { key: 'insights', label: t('insights', 'Insights') },
    { key: 'ask', label: t('ask_brain', 'Ask Brain') },
    { key: 'settings', label: t('settings', 'Settings') },
  ];

  return (
    <div className="bg-newBgColorInner p-[20px] flex flex-1 flex-col gap-[20px]">
      <div className="flex gap-[8px] border-b border-fifth pb-[10px] flex-wrap">
        {tabs.map((item) => (
          <div
            key={item.key}
            onClick={() => setTab(item.key)}
            className={clsx(
              'px-[16px] py-[8px] rounded-[4px] cursor-pointer select-none text-[14px] flex items-center gap-[6px]',
              tab === item.key
                ? 'bg-forth font-[600]'
                : 'opacity-60 hover:opacity-100'
            )}
          >
            {item.label}
            {!!item.badge && (
              <span className="bg-red-500 text-white text-[10px] rounded-full w-[16px] h-[16px] flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </div>
        ))}
      </div>
      {tab === 'dashboard' && <SalesBrainDashboard />}
      {tab === 'leads' && <SalesBrainLeadsList />}
      {tab === 'followups' && <SalesBrainFollowups />}
      {tab === 'handoffs' && <SalesBrainHandoffs />}
      {tab === 'forecast' && <SalesBrainForecast />}
      {tab === 'products' && <SalesBrainProducts />}
      {tab === 'playbook' && <SalesBrainPlaybook />}
      {tab === 'automations' && <SalesBrainAutomations />}
      {tab === 'coach' && <SalesBrainCoach />}
      {tab === 'roleplay' && <SalesBrainRoleplay />}
      {tab === 'experiments' && <SalesBrainExperiments />}
      {tab === 'insights' && <SalesBrainInsights />}
      {tab === 'ask' && <SalesBrainAsk />}
      {tab === 'settings' && <SalesBrainSettings />}
    </div>
  );
};
