'use client';

import { FC, useCallback, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Button } from '@gitroom/react/form/button';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const SUGGESTIONS = [
  'Who are my hottest leads?',
  'Why are we losing sales?',
  'What are customers complaining about?',
  'What objections are increasing?',
  'What should my sales team do today?',
];

export const SalesBrainAsk: FC = () => {
  const fetch = useFetch();
  const t = useT();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await (
        await fetch('/sales-brain/ask', {
          method: 'POST',
          body: JSON.stringify({ question: q }),
        })
      ).json();
      setAnswer(res.answer);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col gap-[16px]">
      <h3 className="text-[20px]">{t('ask_the_sales_brain', 'Ask the Sales Brain')}</h3>
      <div className="flex flex-wrap gap-[8px]">
        {SUGGESTIONS.map((s) => (
          <div
            key={s}
            onClick={() => {
              setQuestion(s);
              ask(s);
            }}
            className="text-[12px] px-[10px] py-[6px] rounded-full bg-forth cursor-pointer hover:opacity-80"
          >
            {s}
          </div>
        ))}
      </div>
      <div className="flex gap-[10px]">
        <input
          className="flex-1 bg-forth rounded-[4px] p-[10px] text-[14px] outline-none"
          placeholder={t(
            'ask_a_question_about_your_business',
            'Ask a question about your business...'
          )}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask(question)}
        />
        <Button onClick={() => ask(question)} disabled={loading || !question.trim()}>
          {t('ask', 'Ask')}
        </Button>
      </div>
      {loading && (
        <div className="text-customColor18">{t('thinking', 'Thinking...')}</div>
      )}
      {!!answer && (
        <div className="bg-sixth border-fifth border rounded-[4px] p-[16px] whitespace-pre-wrap text-[14px]">
          {answer}
        </div>
      )}
    </div>
  );
};
