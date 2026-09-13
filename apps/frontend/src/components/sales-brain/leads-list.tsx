'use client';

import { FC, Fragment, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { object, string } from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useSalesBrainLeads } from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { LeadScoreBadge } from '@gitroom/frontend/components/sales-brain/lead-score-badge';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { Select } from '@gitroom/react/form/select';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const SOURCES = [
  'WEBSITE',
  'LANDING_PAGE',
  'WHATSAPP',
  'INSTAGRAM',
  'FACEBOOK_MESSENGER',
  'EMAIL',
  'SMS',
  'LIVE_CHAT',
  'CRM_IMPORT',
  'CSV_UPLOAD',
  'API',
  'WEBHOOK',
  'ECOMMERCE',
  'ADVERTISING',
  'MANUAL',
];

export const SalesBrainLeadsList: FC = () => {
  const { data, mutate } = useSalesBrainLeads();
  const router = useRouter();
  const modal = useModals();
  const t = useT();

  const openAddLead = useCallback(() => {
    modal.openModal({
      title: t('add_lead', 'Add lead'),
      withCloseButton: true,
      children: <AddLead reload={mutate} />,
    });
  }, [t]);

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px]">{t('leads', 'Leads')}</h3>
        <Button onClick={openAddLead}>{t('add_lead', 'Add lead')}</Button>
      </div>
      <div className="bg-sixth border-fifth border rounded-[4px] p-[24px]">
        {!data?.length && (
          <div className="text-customColor18">
            {t('no_leads_yet', 'No leads yet. Add your first lead to get started.')}
          </div>
        )}
        {!!data?.length && (
          <div className="grid grid-cols-[1.5fr,1fr,1fr,1fr,1fr] w-full gap-y-[12px]">
            <div className="font-[600]">{t('name', 'Name')}</div>
            <div className="font-[600]">{t('score', 'Score')}</div>
            <div className="font-[600]">{t('buying_stage', 'Buying stage')}</div>
            <div className="font-[600]">{t('pipeline', 'Pipeline')}</div>
            <div className="font-[600]">{t('source', 'Source')}</div>
            {data.map((lead: any) => (
              <Fragment key={lead.id}>
                <div
                  className="cursor-pointer hover:underline flex flex-col justify-center"
                  onClick={() => router.push(`/sales-brain/${lead.id}`)}
                >
                  {lead.name || lead.email || t('unnamed_lead', 'Unnamed lead')}
                </div>
                <div className="flex flex-col justify-center">
                  <LeadScoreBadge score={lead.leadScore} />
                </div>
                <div className="flex flex-col justify-center">
                  {lead.buyingStage}
                </div>
                <div className="flex flex-col justify-center">
                  {lead.pipelineStage}
                </div>
                <div className="flex flex-col justify-center">{lead.source}</div>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const schema = object().shape({
  name: string(),
  email: string().email(),
  phone: string(),
  source: string(),
});

const AddLead: FC<{ reload: () => void }> = ({ reload }) => {
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();
  const form = useForm({
    resolver: yupResolver(schema),
    values: { name: '', email: '', phone: '', source: 'MANUAL' },
  });

  const submit = useCallback(async (values: any) => {
    await fetch('/sales-brain/leads', {
      method: 'POST',
      body: JSON.stringify(values),
    });
    toaster.show(t('lead_added_successfully', 'Lead added successfully'), 'success');
    modal.closeAll();
    reload();
  }, []);

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="flex flex-col gap-[10px]"
      >
        <Input label="Name" translationKey="label_name" {...form.register('name')} />
        <Input label="Email" translationKey="label_email" {...form.register('email')} />
        <Input label="Phone" translationKey="label_phone" {...form.register('phone')} />
        <Select
          label="Source"
          name="source"
          translationKey="label_source"
          {...form.register('source')}
        >
          {SOURCES.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </Select>
        <Button type="submit" className="mt-[10px]">
          {t('save', 'Save')}
        </Button>
      </form>
    </FormProvider>
  );
};
