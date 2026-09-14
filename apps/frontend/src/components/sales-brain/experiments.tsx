'use client';

import { FC, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import {
  useSalesBrainExperiments,
  useSalesBrainExperimentResults,
} from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { Textarea } from '@gitroom/react/form/textarea';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export const SalesBrainExperiments: FC = () => {
  const { data, mutate } = useSalesBrainExperiments();
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();

  const openForm = useCallback(() => {
    modal.openModal({
      title: t('new_experiment', 'New A/B experiment'),
      withCloseButton: true,
      classNames: { modal: 'w-[560px] max-w-full' },
      children: <ExperimentForm reload={mutate} />,
    });
  }, [t]);

  const viewResults = useCallback(
    (experiment: any) => () => {
      modal.openModal({
        title: experiment.name,
        withCloseButton: true,
        children: <ExperimentResults experimentId={experiment.id} />,
      });
    },
    []
  );

  const complete = useCallback(
    (id: string) => async () => {
      await fetch(`/sales-brain/experiments/${id}/complete`, { method: 'POST' });
      mutate();
      toaster.show(t('experiment_completed', 'Experiment completed'), 'success');
    },
    []
  );

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px]">{t('experiments', 'Experiments (A/B testing)')}</h3>
        <Button onClick={openForm}>{t('new_experiment', 'New experiment')}</Button>
      </div>
      <div className="text-[12px] text-customColor18">
        {t(
          'experiments_explainer',
          'Only one active experiment runs at a time. Each new lead\'s very first reply is randomly assigned variant A or B, and conversion is tracked when that lead is marked Won.'
        )}
      </div>
      {!data?.length && (
        <div className="text-customColor18">
          {t('no_experiments_yet', 'No experiments yet.')}
        </div>
      )}
      <div className="flex flex-col gap-[10px]">
        {data?.map((experiment: any) => (
          <div
            key={experiment.id}
            className="bg-sixth border-fifth border rounded-[4px] p-[16px] flex justify-between items-center"
          >
            <div>
              <div className="font-[600]">{experiment.name}</div>
              <div className="text-[12px] text-customColor18">
                {experiment.status} · {experiment._count?.assignments ?? 0}{' '}
                {t('leads_assigned', 'leads assigned')}
              </div>
            </div>
            <div className="flex gap-[8px]">
              <Button onClick={viewResults(experiment)}>
                {t('results', 'Results')}
              </Button>
              {experiment.status === 'ACTIVE' && (
                <Button onClick={complete(experiment.id)}>
                  {t('stop', 'Stop')}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExperimentForm: FC<{ reload: () => void }> = ({ reload }) => {
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();
  const form = useForm({
    values: { name: '', variantAContent: '', variantBContent: '' },
  });

  const submit = useCallback(async (values: any) => {
    await fetch('/sales-brain/experiments', {
      method: 'POST',
      body: JSON.stringify(values),
    });
    toaster.show(t('experiment_created', 'Experiment created'), 'success');
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
        <Textarea
          label="Variant A opening message"
          translationKey="label_variant_a"
          {...form.register('variantAContent')}
        />
        <Textarea
          label="Variant B opening message"
          translationKey="label_variant_b"
          {...form.register('variantBContent')}
        />
        <Button type="submit" className="mt-[10px]">
          {t('save', 'Save')}
        </Button>
      </form>
    </FormProvider>
  );
};

const ExperimentResults: FC<{ experimentId: string }> = ({ experimentId }) => {
  const { data } = useSalesBrainExperimentResults(experimentId);
  const t = useT();

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-[16px]">
      {(['variantA', 'variantB'] as const).map((key) => (
        <div key={key} className="bg-forth rounded-[4px] p-[16px] flex flex-col gap-[6px]">
          <div className="font-[600]">
            {key === 'variantA' ? t('variant_a', 'Variant A') : t('variant_b', 'Variant B')}
          </div>
          <div className="text-[24px] font-[600]">
            {Math.round(data[key].conversionRate * 100)}%
          </div>
          <div className="text-[12px] text-customColor18">
            {data[key].converted} / {data[key].assigned} {t('converted', 'converted')}
          </div>
        </div>
      ))}
    </div>
  );
};
