'use client';

import { FC, useCallback, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useSalesBrainSalespersons } from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const SECTION_LABELS: Record<string, string> = {
  strengths: 'Strengths',
  weaknesses: 'Weaknesses',
  missedOpportunities: 'Missed opportunities',
  badQuestions: 'Bad questions',
  weakResponses: 'Weak responses',
  missedClosingMoments: 'Missed closing moments',
  objectionHandlingMistakes: 'Objection-handling mistakes',
  recommendedImprovements: 'Recommended improvements',
};

export const SalesBrainCoach: FC = () => {
  const { data, mutate } = useSalesBrainSalespersons();
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [coaching, setCoaching] = useState<string | null>(null);

  const openAdd = useCallback(() => {
    modal.openModal({
      title: t('add_salesperson', 'Add salesperson'),
      withCloseButton: true,
      children: <AddSalesperson reload={mutate} />,
    });
  }, [t]);

  const coach = useCallback(
    (id: string) => async () => {
      setCoaching(id);
      try {
        await fetch(`/sales-brain/salespersons/${id}/coach`, { method: 'POST' });
        await mutate();
        setExpanded(id);
      } catch (e) {
        toaster.show(
          t(
            'coaching_failed',
            'No conversations found for this salesperson yet - have them send at least one reply first'
          ),
          'warning'
        );
      } finally {
        setCoaching(null);
      }
    },
    [mutate]
  );

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px]">{t('sales_coach', 'Sales Coach')}</h3>
        <Button onClick={openAdd}>{t('add_salesperson', 'Add salesperson')}</Button>
      </div>
      {!data?.length && (
        <div className="text-customColor18">
          {t(
            'no_salespersons_yet',
            'No salespeople yet. Add one, then have them reply to leads as a human in the Leads tab to build up conversations to coach on.'
          )}
        </div>
      )}
      <div className="flex flex-col gap-[10px]">
        {data?.map((person: any) => {
          const report = person.coachingReports?.[0]?.content;
          return (
            <div
              key={person.id}
              className="bg-sixth border-fifth border rounded-[4px] p-[16px] flex flex-col gap-[10px]"
            >
              <div className="flex justify-between items-center">
                <div className="font-[600]">{person.name}</div>
                <div className="flex gap-[8px]">
                  <Button
                    onClick={coach(person.id)}
                    disabled={coaching === person.id}
                  >
                    {report ? t('re_coach', 'Re-coach') : t('coach', 'Coach')}
                  </Button>
                  {!!report && (
                    <Button
                      onClick={() =>
                        setExpanded(expanded === person.id ? null : person.id)
                      }
                    >
                      {expanded === person.id
                        ? t('hide', 'Hide')
                        : t('view_report', 'View report')}
                    </Button>
                  )}
                </div>
              </div>
              {expanded === person.id && report && (
                <div className="flex flex-col gap-[10px] border-t border-fifth pt-[10px]">
                  <div className="text-[22px] font-[600]">
                    {report.overallScore}
                    <span className="text-[12px] text-customColor18">/100</span>
                  </div>
                  {Object.entries(SECTION_LABELS).map(([key, label]) => {
                    const items = report[key];
                    if (!items?.length) return null;
                    return (
                      <div key={key}>
                        <div className="text-[13px] font-[600] mb-[4px]">{label}</div>
                        <ul className="list-disc ps-[18px] text-[13px] flex flex-col gap-[2px]">
                          {items.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AddSalesperson: FC<{ reload: () => void }> = ({ reload }) => {
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();
  const form = useForm({ values: { name: '', email: '' } });

  const submit = useCallback(async (values: any) => {
    await fetch('/sales-brain/salespersons', {
      method: 'POST',
      body: JSON.stringify(values),
    });
    toaster.show(t('salesperson_added', 'Salesperson added'), 'success');
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
        <Button type="submit" className="mt-[10px]">
          {t('save', 'Save')}
        </Button>
      </form>
    </FormProvider>
  );
};
