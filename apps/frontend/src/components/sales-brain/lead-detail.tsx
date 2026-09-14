'use client';

import { FC, useCallback, useState } from 'react';
import clsx from 'clsx';
import { useParams } from 'next/navigation';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useSalesBrainLead } from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { LeadScoreBadge } from '@gitroom/frontend/components/sales-brain/lead-score-badge';
import { Button } from '@gitroom/react/form/button';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

export const SalesBrainLeadDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: lead, mutate, isLoading } = useSalesBrainLead(id);
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const send = useCallback(async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch(`/sales-brain/leads/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: message }),
      });
      setMessage('');
      await mutate();
    } catch (e) {
      toaster.show(
        t('failed_to_send_message', 'Failed to send message'),
        'warning'
      );
    } finally {
      setSending(false);
    }
  }, [message, id, mutate]);

  const approveDraft = useCallback(
    (messageId: string) => async () => {
      await fetch(`/sales-brain/messages/${messageId}/approve`, { method: 'POST' });
      mutate();
    },
    [mutate]
  );

  const rejectDraft = useCallback(
    (messageId: string) => async () => {
      await fetch(`/sales-brain/messages/${messageId}`, { method: 'DELETE' });
      mutate();
    },
    [mutate]
  );

  const [analyzing, setAnalyzing] = useState(false);
  const analyze = useCallback(
    (conversationId: string) => async () => {
      setAnalyzing(true);
      try {
        await fetch(`/sales-brain/conversations/${conversationId}/analyze`, {
          method: 'POST',
        });
        await mutate();
      } finally {
        setAnalyzing(false);
      }
    },
    [mutate]
  );

  if (isLoading || !lead) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingComponent />
      </div>
    );
  }

  const messages = (lead.conversations || []).flatMap((c: any) => c.messages);
  const latestConversation = (lead.conversations || [])[lead.conversations.length - 1];
  const analysis = latestConversation?.analysis;

  return (
    <div className="flex flex-col lg:flex-row gap-[16px]">
      <div className="lg:w-[320px] flex flex-col gap-[12px]">
        <div className="bg-sixth border-fifth border rounded-[4px] p-[20px] flex flex-col gap-[10px]">
          <h3 className="text-[18px]">
            {lead.name || lead.email || t('unnamed_lead', 'Unnamed lead')}
          </h3>
          <div>
            <LeadScoreBadge score={lead.leadScore} />
          </div>
          <InfoRow label={t('email', 'Email')} value={lead.email} />
          <InfoRow label={t('phone', 'Phone')} value={lead.phone} />
          <InfoRow label={t('source', 'Source')} value={lead.source} />
          <InfoRow label={t('buying_stage', 'Buying stage')} value={lead.buyingStage} />
          <InfoRow
            label={t('pipeline_stage', 'Pipeline stage')}
            value={lead.pipelineStage}
          />
          <InfoRow
            label={t('interested_product', 'Interested product')}
            value={lead.productInterest?.name}
          />
          <InfoRow label={t('urgency', 'Urgency')} value={lead.urgency} />
          <InfoRow label={t('budget_signal', 'Budget signal')} value={lead.budgetSignal} />
          <InfoRow
            label={t('authority_level', 'Authority level')}
            value={lead.authorityLevel}
          />
        </div>

        {!!lead.objections?.length && (
          <div className="bg-sixth border-fifth border rounded-[4px] p-[20px]">
            <h4 className="text-[14px] font-[600] mb-[8px]">
              {t('objections', 'Objections')}
            </h4>
            <ul className="flex flex-col gap-[6px] text-[13px]">
              {lead.objections.map((o: any, i: number) => (
                <li key={i}>
                  <span className="text-customColor18">{o.category}:</span>{' '}
                  {o.rawText}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!lead.painPoints?.length && (
          <div className="bg-sixth border-fifth border rounded-[4px] p-[20px]">
            <h4 className="text-[14px] font-[600] mb-[8px]">
              {t('pain_points', 'Pain points')}
            </h4>
            <ul className="flex flex-col gap-[6px] text-[13px]">
              {lead.painPoints.map((p: any, i: number) => (
                <li key={i}>
                  {p.problem} ({p.severity})
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!latestConversation && (
          <div className="bg-sixth border-fifth border rounded-[4px] p-[20px] flex flex-col gap-[10px]">
            <div className="flex justify-between items-center">
              <h4 className="text-[14px] font-[600]">
                {t('conversation_quality', 'Conversation quality')}
              </h4>
              <Button
                onClick={analyze(latestConversation.id)}
                disabled={analyzing || !latestConversation.messages?.length}
              >
                {analysis
                  ? t('re_analyze', 'Re-analyze')
                  : t('analyze', 'Analyze')}
              </Button>
            </div>
            {!analysis && (
              <div className="text-[12px] text-customColor18">
                {t(
                  'not_analyzed_yet',
                  'Not analyzed yet. Score the conversation on discovery, empathy, objection handling and more.'
                )}
              </div>
            )}
            {!!analysis && (
              <>
                <div className="text-[22px] font-[600]">
                  {analysis.score}
                  <span className="text-[12px] text-customColor18">/100</span>
                </div>
                <div className="grid grid-cols-2 gap-x-[10px] gap-y-[4px] text-[12px]">
                  <ScoreRow label="Discovery" value={analysis.discovery} />
                  <ScoreRow label="Personalization" value={analysis.personalization} />
                  <ScoreRow label="Relevance" value={analysis.relevance} />
                  <ScoreRow label="Empathy" value={analysis.empathy} />
                  <ScoreRow label="Value comm." value={analysis.valueCommunication} />
                  <ScoreRow label="Objections" value={analysis.objectionHandling} />
                  <ScoreRow label="Closing" value={analysis.closing} />
                  <ScoreRow label="Follow-up" value={analysis.followUp} />
                  <ScoreRow label="Accuracy" value={analysis.accuracy} />
                </div>
                {analysis.whyBought && (
                  <div className="text-[12px]">
                    <span className="text-customColor18">
                      {t('why_they_bought', 'Why they bought')}:
                    </span>{' '}
                    {analysis.whyBought}
                  </div>
                )}
                {analysis.whyNotBought && (
                  <div className="text-[12px]">
                    <span className="text-customColor18">
                      {t('why_they_did_not_buy', "Why they didn't buy")}:
                    </span>{' '}
                    {analysis.whyNotBought}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 bg-sixth border-fifth border rounded-[4px] p-[20px] flex flex-col gap-[12px] min-h-[420px]">
        <h4 className="text-[16px]">{t('conversation', 'Conversation')}</h4>
        <div className="flex-1 flex flex-col gap-[10px] overflow-y-auto max-h-[500px]">
          {!messages.length && (
            <div className="text-customColor18">
              {t(
                'no_messages_yet',
                'No messages yet. Send the first message as the lead to see the Sales Brain respond.'
              )}
            </div>
          )}
          {messages.map((m: any) => (
            <div
              key={m.id}
              className={clsx(
                'max-w-[75%] rounded-[8px] p-[10px] text-[14px] flex flex-col gap-[6px]',
                m.role === 'LEAD' && 'self-start bg-forth',
                m.role === 'AI' && 'self-end bg-primary/20',
                m.role === 'HUMAN' && 'self-end bg-forth border border-fifth',
                m.isDraft && 'border border-dashed border-yellow-400'
              )}
            >
              <div className="text-[10px] opacity-60">
                {m.role}
                {m.isDraft && (
                  <span className="ms-[6px] text-yellow-400">
                    {t('draft_awaiting_approval', 'draft · awaiting approval')}
                  </span>
                )}
              </div>
              {m.content}
              {m.isDraft && (
                <div className="flex gap-[8px]">
                  <Button onClick={approveDraft(m.id)}>
                    {t('approve_and_send', 'Approve & send')}
                  </Button>
                  <Button secondary={true} onClick={rejectDraft(m.id)}>
                    {t('discard', 'Discard')}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-[10px]">
          <textarea
            className="flex-1 bg-forth rounded-[4px] p-[10px] text-[14px] outline-none"
            rows={2}
            placeholder={t(
              'type_a_message_from_the_lead',
              'Type a message as the lead...'
            )}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={send} disabled={sending || !message.trim()}>
            {t('send', 'Send')}
          </Button>
        </div>
      </div>
    </div>
  );
};

const InfoRow: FC<{ label: string; value?: string | null }> = ({
  label,
  value,
}) => (
  <div className="flex justify-between text-[13px]">
    <span className="text-customColor18">{label}</span>
    <span>{value || '—'}</span>
  </div>
);

const ScoreRow: FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-customColor18">{label}</span>
    <span>{value}</span>
  </div>
);
