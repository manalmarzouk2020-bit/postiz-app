'use client';

import { FC, useCallback, useState } from 'react';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import {
  useSalesBrainRoleplaySessions,
  useSalesBrainRoleplaySession,
  useSalesBrainSalespersons,
} from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { Button } from '@gitroom/react/form/button';
import { Select } from '@gitroom/react/form/select';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const PERSONAS = [
  { value: 'ANGRY_CUSTOMER', label: 'Angry customer' },
  { value: 'PRICE_SENSITIVE', label: 'Price-sensitive customer' },
  { value: 'SKEPTICAL', label: 'Skeptical customer' },
  { value: 'BUSY_EXECUTIVE', label: 'Busy executive' },
  { value: 'DIFFICULT_BUYER', label: 'Difficult buyer' },
  { value: 'INDECISIVE_BUYER', label: 'Indecisive buyer' },
  { value: 'HIGH_TICKET_BUYER', label: 'High-ticket buyer' },
  { value: 'COMPARISON_SHOPPER', label: 'Comparison shopper' },
  { value: 'INTERESTED_BUT_HESITANT', label: 'Interested but hesitant' },
  { value: 'SEND_ME_INFO', label: '"Send me information" customer' },
];

export const SalesBrainRoleplay: FC = () => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  if (activeSessionId) {
    return (
      <RoleplaySessionView
        sessionId={activeSessionId}
        onExit={() => setActiveSessionId(null)}
      />
    );
  }

  return <RoleplayStart onStart={setActiveSessionId} />;
};

const RoleplayStart: FC<{ onStart: (id: string) => void }> = ({ onStart }) => {
  const { data: sessions, mutate } = useSalesBrainRoleplaySessions();
  const { data: salespersons } = useSalesBrainSalespersons();
  const fetch = useFetch();
  const t = useT();
  const [persona, setPersona] = useState(PERSONAS[0].value);
  const [salespersonId, setSalespersonId] = useState('');
  const [starting, setStarting] = useState(false);

  const start = useCallback(async () => {
    setStarting(true);
    try {
      const session = await (
        await fetch('/sales-brain/roleplay', {
          method: 'POST',
          body: JSON.stringify({
            persona,
            ...(salespersonId ? { salespersonId } : {}),
          }),
        })
      ).json();
      await mutate();
      onStart(session.id);
    } finally {
      setStarting(false);
    }
  }, [persona, salespersonId]);

  return (
    <div className="flex flex-col gap-[16px]">
      <h3 className="text-[20px]">{t('roleplay_simulator', 'Roleplay Simulator')}</h3>
      <div className="bg-sixth border-fifth border rounded-[4px] p-[20px] flex flex-col gap-[10px]">
        <Select
          label="Customer persona"
          name="persona"
          translationKey="label_persona"
          disableForm={true}
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
        >
          {PERSONAS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
        {!!salespersons?.length && (
          <Select
            label="Practicing as (optional)"
            name="salesperson"
            translationKey="label_salesperson"
            disableForm={true}
            value={salespersonId}
            onChange={(e) => setSalespersonId(e.target.value)}
          >
            <option value="">{t('none', 'None')}</option>
            {salespersons.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}
        <Button onClick={start} disabled={starting} className="mt-[6px]">
          {t('start_roleplay', 'Start roleplay')}
        </Button>
      </div>

      {!!sessions?.length && (
        <div className="bg-sixth border-fifth border rounded-[4px] p-[20px]">
          <h4 className="text-[14px] font-[600] mb-[10px]">
            {t('past_sessions', 'Past sessions')}
          </h4>
          <div className="flex flex-col gap-[8px]">
            {sessions.map((s: any) => (
              <div
                key={s.id}
                className="flex justify-between items-center cursor-pointer hover:bg-forth rounded-[4px] p-[8px]"
                onClick={() => onStart(s.id)}
              >
                <div className="text-[13px]">
                  {PERSONAS.find((p) => p.value === s.persona)?.label || s.persona}
                  {s.salesperson && ` · ${s.salesperson.name}`}
                </div>
                <div className="text-[12px] text-customColor18">
                  {s.status === 'COMPLETED' ? `${t('score', 'Score')}: ${s.score}` : s.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RoleplaySessionView: FC<{ sessionId: string; onExit: () => void }> = ({
  sessionId,
  onExit,
}) => {
  const { data: session, mutate, isLoading } = useSalesBrainRoleplaySession(sessionId);
  const fetch = useFetch();
  const t = useT();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);

  const send = useCallback(async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch(`/sales-brain/roleplay/${sessionId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content: message }),
      });
      setMessage('');
      await mutate();
    } finally {
      setSending(false);
    }
  }, [message, sessionId, mutate]);

  const complete = useCallback(async () => {
    setCompleting(true);
    try {
      await fetch(`/sales-brain/roleplay/${sessionId}/complete`, { method: 'POST' });
      await mutate();
    } finally {
      setCompleting(false);
    }
  }, [sessionId, mutate]);

  if (isLoading || !session) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingComponent />
      </div>
    );
  }

  const feedback = session.feedback;

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex justify-between items-center">
        <div
          className="flex items-center gap-[6px] cursor-pointer opacity-70 hover:opacity-100"
          onClick={onExit}
        >
          ← {t('back', 'Back')}
        </div>
        {session.status === 'ACTIVE' && (
          <Button onClick={complete} disabled={completing}>
            {t('finish_and_score', 'Finish & score')}
          </Button>
        )}
      </div>

      <div className="bg-sixth border-fifth border rounded-[4px] p-[20px] flex flex-col gap-[10px] min-h-[420px]">
        <div className="flex-1 flex flex-col gap-[10px] overflow-y-auto max-h-[500px]">
          {session.messages.map((m: any) => (
            <div
              key={m.id}
              className={clsx(
                'max-w-[75%] rounded-[8px] p-[10px] text-[14px]',
                m.role === 'CUSTOMER' && 'self-start bg-forth',
                m.role === 'TRAINEE' && 'self-end bg-primary/20'
              )}
            >
              <div className="text-[10px] opacity-60 mb-[2px]">{m.role}</div>
              {m.content}
            </div>
          ))}
        </div>
        {session.status === 'ACTIVE' && (
          <div className="flex gap-[10px]">
            <textarea
              className="flex-1 bg-forth rounded-[4px] p-[10px] text-[14px] outline-none"
              rows={2}
              placeholder={t('type_your_response', 'Type your response...')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button onClick={send} disabled={sending || !message.trim()}>
              {t('send', 'Send')}
            </Button>
          </div>
        )}
      </div>

      {!!feedback && (
        <div className="bg-sixth border-fifth border rounded-[4px] p-[20px] flex flex-col gap-[10px]">
          <div className="text-[22px] font-[600]">
            {feedback.score}
            <span className="text-[12px] text-customColor18">/100</span>
          </div>
          <FeedbackList label={t('what_you_did_well', 'What you did well')} items={feedback.didWell} />
          <FeedbackList label={t('what_you_did_poorly', 'What you did poorly')} items={feedback.didPoorly} />
          <FeedbackList label={t('you_should_have_asked', 'You should have asked')} items={feedback.shouldHaveAsked} />
          <FeedbackList label={t('you_should_have_said', 'You should have said')} items={feedback.shouldHaveSaid} />
          <FeedbackList label={t('better_response_examples', 'Better response examples')} items={feedback.betterResponseExamples} />
          {feedback.whereControlWasLost && (
            <div className="text-[13px]">
              <span className="text-customColor18">
                {t('where_you_lost_control', 'Where you lost control')}:
              </span>{' '}
              {feedback.whereControlWasLost}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FeedbackList: FC<{ label: string; items?: string[] }> = ({ label, items }) => {
  if (!items?.length) return null;
  return (
    <div>
      <div className="text-[13px] font-[600] mb-[4px]">{label}</div>
      <ul className="list-disc ps-[18px] text-[13px] flex flex-col gap-[2px]">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
};
