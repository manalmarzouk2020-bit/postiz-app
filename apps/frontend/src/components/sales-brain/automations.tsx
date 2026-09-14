'use client';

import { FC, Fragment, useCallback, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useSalesBrainAutomations } from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { Select } from '@gitroom/react/form/select';
import { Checkbox } from '@gitroom/react/form/checkbox';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const TRIGGER_TYPES = [
  { value: 'LEAD_SCORE_ABOVE', label: 'Lead score is above a threshold' },
  { value: 'BUYING_STAGE_EQUALS', label: 'Buying stage equals' },
  { value: 'PIPELINE_STAGE_EQUALS', label: 'Pipeline stage equals' },
  { value: 'OBJECTION_DETECTED', label: 'An objection is detected' },
  { value: 'HANDOFF_NEEDED', label: 'Conversation needs a human' },
];

const ACTION_TYPES = [
  { value: 'SEND_NOTIFICATION', label: 'Send an in-app notification' },
  { value: 'CALL_WEBHOOK', label: 'Call a webhook (Zapier/Make/n8n)' },
];

const BUYING_STAGES = [
  'UNAWARE',
  'PROBLEM_AWARE',
  'SOLUTION_AWARE',
  'PRODUCT_AWARE',
  'COMPARING',
  'CONSIDERING',
  'READY_TO_BUY',
  'NEGOTIATING',
  'POSTPONING',
  'LOST',
  'CUSTOMER',
  'REPEAT_BUYER',
];

const PIPELINE_STAGES = [
  'NEW',
  'QUALIFIED',
  'OPPORTUNITY',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
  'NURTURE',
];

export const SalesBrainAutomations: FC = () => {
  const { data, mutate } = useSalesBrainAutomations();
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();

  const openForm = useCallback(() => {
    modal.openModal({
      title: t('new_automation_rule', 'New automation rule'),
      withCloseButton: true,
      classNames: { modal: 'w-[560px] max-w-full' },
      children: <AutomationForm reload={mutate} />,
    });
  }, [t]);

  const toggle = useCallback(
    (rule: any) => async () => {
      await fetch(`/sales-brain/automations/${rule.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      mutate();
    },
    []
  );

  const remove = useCallback(
    (rule: any) => async () => {
      if (
        await deleteDialog(
          t(
            'are_you_sure_you_want_to_delete_rule',
            `Are you sure you want to delete "${rule.name}"?`,
            { name: rule.name }
          )
        )
      ) {
        await fetch(`/sales-brain/automations/${rule.id}`, { method: 'DELETE' });
        mutate();
        toaster.show(t('rule_deleted', 'Rule deleted'), 'success');
      }
    },
    []
  );

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px]">{t('automations', 'Automations')}</h3>
        <Button onClick={openForm}>{t('new_rule', 'New rule')}</Button>
      </div>
      {!data?.length && (
        <div className="text-customColor18">
          {t(
            'no_automation_rules_yet',
            'No automation rules yet. Create one, e.g. "if lead score > 80, notify me" or "if a conversation needs a human, call my webhook".'
          )}
        </div>
      )}
      <div className="flex flex-col gap-[10px]">
        {data?.map((rule: any) => (
          <div
            key={rule.id}
            className="bg-sixth border-fifth border rounded-[4px] p-[16px] flex justify-between items-center"
          >
            <div>
              <div className="font-[600]">{rule.name}</div>
              <div className="text-[12px] text-customColor18">
                {TRIGGER_TYPES.find((x) => x.value === rule.triggerType)?.label} →{' '}
                {ACTION_TYPES.find((x) => x.value === rule.actionType)?.label}
              </div>
              <div className="text-[11px] text-customColor18">
                {t('fired', 'Fired')}: {rule._count?.logs ?? 0}
              </div>
            </div>
            <div className="flex gap-[8px]">
              <Button onClick={toggle(rule)}>
                {rule.isActive ? t('pause', 'Pause') : t('activate', 'Activate')}
              </Button>
              <Button onClick={remove(rule)}>{t('delete', 'Delete')}</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AutomationForm: FC<{ reload: () => void }> = ({ reload }) => {
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();
  const [triggerType, setTriggerType] = useState('LEAD_SCORE_ABOVE');
  const [actionType, setActionType] = useState('SEND_NOTIFICATION');
  const form = useForm({
    values: {
      name: '',
      threshold: 80,
      stage: 'READY_TO_BUY',
      category: '',
      message: '',
      sendEmail: false,
      url: '',
    },
  });

  const submit = useCallback(
    async (values: any) => {
      const triggerValue: Record<string, unknown> = {};
      if (triggerType === 'LEAD_SCORE_ABOVE') triggerValue.threshold = Number(values.threshold);
      if (triggerType === 'BUYING_STAGE_EQUALS' || triggerType === 'PIPELINE_STAGE_EQUALS')
        triggerValue.stage = values.stage;
      if (triggerType === 'OBJECTION_DETECTED' && values.category)
        triggerValue.category = values.category;

      const actionValue: Record<string, unknown> =
        actionType === 'SEND_NOTIFICATION'
          ? { message: values.message || undefined, sendEmail: !!values.sendEmail }
          : { url: values.url };

      await fetch('/sales-brain/automations', {
        method: 'POST',
        body: JSON.stringify({
          name: values.name,
          triggerType,
          triggerValue,
          actionType,
          actionValue,
        }),
      });
      toaster.show(t('rule_created', 'Rule created'), 'success');
      modal.closeAll();
      reload();
    },
    [triggerType, actionType]
  );

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="flex flex-col gap-[10px]"
      >
        <Input label="Name" translationKey="label_name" {...form.register('name')} />

        <Select
          label="When"
          name="triggerType"
          translationKey="label_trigger"
          disableForm={true}
          value={triggerType}
          onChange={(e) => setTriggerType(e.target.value)}
        >
          {TRIGGER_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        {triggerType === 'LEAD_SCORE_ABOVE' && (
          <Input
            label="Threshold (0-100)"
            type="number"
            translationKey="label_threshold"
            {...form.register('threshold')}
          />
        )}
        {(triggerType === 'BUYING_STAGE_EQUALS' ||
          triggerType === 'PIPELINE_STAGE_EQUALS') && (
          <Select
            label="Stage"
            name="stage"
            translationKey="label_stage"
            {...form.register('stage')}
          >
            {(triggerType === 'BUYING_STAGE_EQUALS'
              ? BUYING_STAGES
              : PIPELINE_STAGES
            ).map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </Select>
        )}
        {triggerType === 'OBJECTION_DETECTED' && (
          <Input
            label="Objection category (leave blank for any)"
            translationKey="label_objection_category"
            {...form.register('category')}
          />
        )}

        <Select
          label="Then"
          name="actionType"
          translationKey="label_action"
          disableForm={true}
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
        >
          {ACTION_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        {actionType === 'SEND_NOTIFICATION' && (
          <Fragment>
            <Input
              label="Message (optional)"
              translationKey="label_message"
              {...form.register('message')}
            />
            <Checkbox name="sendEmail" label="Also send by email" />
          </Fragment>
        )}
        {actionType === 'CALL_WEBHOOK' && (
          <Input
            label="Webhook URL"
            translationKey="label_webhook_url"
            {...form.register('url')}
          />
        )}

        <Button type="submit" className="mt-[10px]">
          {t('save', 'Save')}
        </Button>
      </form>
    </FormProvider>
  );
};
