'use client';

import { FC, useEffect, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import {
  useSalesBrainMetaChannel,
  useSalesBrainTelegramChannel,
} from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { Button } from '@gitroom/react/form/button';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const WebhookUrlField: FC<{ label: string; value: string }> = ({
  label,
  value,
}) => {
  const toaster = useToaster();
  const t = useT();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toaster.show(t('copied_to_clipboard', 'Copied to clipboard'), 'success');
    } catch {
      toaster.show(t('copy_failed', 'Could not copy, copy it manually'), 'warning');
    }
  };

  return (
    <div className="flex flex-col gap-[4px]">
      <span className="text-[12px] text-customColor18">{label}</span>
      <div className="flex gap-[10px]">
        <input
          readOnly
          className="flex-1 bg-forth rounded-[4px] p-[10px] text-[13px] outline-none"
          value={value}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button onClick={copy}>{t('copy', 'Copy')}</Button>
      </div>
    </div>
  );
};

const TextField: FC<{
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, placeholder, value, onChange }) => (
  <div className="flex flex-col gap-[4px]">
    <span className="text-[12px] text-customColor18">{label}</span>
    <input
      className="bg-forth rounded-[4px] p-[10px] text-[13px] outline-none"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const MetaChannelSection: FC = () => {
  const { data, mutate } = useSalesBrainMetaChannel();
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    verifyToken: '',
    appSecret: '',
    whatsappAccessToken: '',
    whatsappPhoneNumberId: '',
    pageAccessToken: '',
    pageId: '',
    instagramAccountId: '',
  });

  useEffect(() => {
    if (!data) return;
    setForm((prev) => ({
      ...prev,
      verifyToken: data.verifyToken || prev.verifyToken,
      whatsappPhoneNumberId: data.whatsappPhoneNumberId || '',
      pageId: data.pageId || '',
      instagramAccountId: data.instagramAccountId || '',
    }));
  }, [data]);

  const save = async () => {
    if (!form.verifyToken) {
      toaster.show(t('verify_token_required', 'A verify token is required'), 'warning');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, string> = { verifyToken: form.verifyToken };
      if (form.appSecret) body.appSecret = form.appSecret;
      if (form.whatsappAccessToken) body.whatsappAccessToken = form.whatsappAccessToken;
      if (form.whatsappPhoneNumberId) body.whatsappPhoneNumberId = form.whatsappPhoneNumberId;
      if (form.pageAccessToken) body.pageAccessToken = form.pageAccessToken;
      if (form.pageId) body.pageId = form.pageId;
      if (form.instagramAccountId) body.instagramAccountId = form.instagramAccountId;

      await fetch('/sales-brain/channels/meta', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      await mutate();
      setForm((prev) => ({
        ...prev,
        appSecret: '',
        whatsappAccessToken: '',
        pageAccessToken: '',
      }));
      toaster.show(t('channel_saved', 'Channel settings saved'), 'success');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-sixth border-fifth border rounded-[4px] p-[16px] flex flex-col gap-[14px]">
      <div className="flex items-center justify-between">
        <h4 className="font-[600]">
          {t('whatsapp_messenger_instagram', 'WhatsApp / Messenger / Instagram')}
        </h4>
        <span
          className={
            data?.configured
              ? 'text-[11px] text-primary'
              : 'text-[11px] text-customColor18'
          }
        >
          {data?.configured
            ? t('connected', 'Connected')
            : t('not_connected', 'Not connected')}
        </span>
      </div>
      <div className="text-[13px] text-customColor18">
        {t(
          'meta_channel_explainer',
          'Create a Meta App in your own developer account, add the WhatsApp, Messenger and Instagram products, and point its webhook at the URL below. One app covers all three channels.'
        )}
      </div>

      {data?.webhookUrl && (
        <WebhookUrlField
          label={t('webhook_callback_url', 'Webhook callback URL')}
          value={data.webhookUrl}
        />
      )}

      <TextField
        label={t('verify_token', 'Verify token (set this in the Meta App webhook config)')}
        placeholder="my-verify-token"
        value={form.verifyToken}
        onChange={(v) => setForm((p) => ({ ...p, verifyToken: v }))}
      />
      <TextField
        label={t('app_secret', 'App secret (used to verify incoming webhooks)')}
        placeholder={data?.appSecret || '••••'}
        value={form.appSecret}
        onChange={(v) => setForm((p) => ({ ...p, appSecret: v }))}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
        <TextField
          label={t('whatsapp_access_token', 'WhatsApp permanent access token')}
          placeholder={data?.whatsappAccessToken || '••••'}
          value={form.whatsappAccessToken}
          onChange={(v) => setForm((p) => ({ ...p, whatsappAccessToken: v }))}
        />
        <TextField
          label={t('whatsapp_phone_number_id', 'WhatsApp phone number ID')}
          value={form.whatsappPhoneNumberId}
          onChange={(v) => setForm((p) => ({ ...p, whatsappPhoneNumberId: v }))}
        />
        <TextField
          label={t('page_access_token', 'Facebook Page access token (Messenger + Instagram)')}
          placeholder={data?.pageAccessToken || '••••'}
          value={form.pageAccessToken}
          onChange={(v) => setForm((p) => ({ ...p, pageAccessToken: v }))}
        />
        <TextField
          label={t('page_id', 'Facebook Page ID')}
          value={form.pageId}
          onChange={(v) => setForm((p) => ({ ...p, pageId: v }))}
        />
        <TextField
          label={t('instagram_account_id', 'Instagram Business Account ID')}
          value={form.instagramAccountId}
          onChange={(v) => setForm((p) => ({ ...p, instagramAccountId: v }))}
        />
      </div>

      <div>
        <Button onClick={save} disabled={saving}>
          {t('save', 'Save')}
        </Button>
      </div>
    </div>
  );
};

const TelegramChannelSection: FC = () => {
  const { data, mutate } = useSalesBrainTelegramChannel();
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const [saving, setSaving] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  const save = async () => {
    if (!botToken) {
      toaster.show(t('bot_token_required', 'A bot token is required'), 'warning');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, string> = { botToken };
      if (webhookSecret) body.webhookSecret = webhookSecret;

      await fetch('/sales-brain/channels/telegram', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      await mutate();
      setBotToken('');
      setWebhookSecret('');
      toaster.show(t('channel_saved', 'Channel settings saved'), 'success');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-sixth border-fifth border rounded-[4px] p-[16px] flex flex-col gap-[14px]">
      <div className="flex items-center justify-between">
        <h4 className="font-[600]">{t('telegram', 'Telegram')}</h4>
        <span
          className={
            data?.configured
              ? 'text-[11px] text-primary'
              : 'text-[11px] text-customColor18'
          }
        >
          {data?.configured
            ? t('connected', 'Connected')
            : t('not_connected', 'Not connected')}
        </span>
      </div>
      <div className="text-[13px] text-customColor18">
        {t(
          'telegram_channel_explainer',
          'Create a bot with @BotFather on Telegram, copy its token below, then register the webhook URL by calling the Telegram Bot API setWebhook once with that URL.'
        )}
      </div>

      {data?.webhookUrl && (
        <WebhookUrlField
          label={t('webhook_callback_url', 'Webhook callback URL')}
          value={data.webhookUrl}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
        <TextField
          label={t('bot_token', 'Bot token')}
          placeholder={data?.botToken || '••••'}
          value={botToken}
          onChange={setBotToken}
        />
        <TextField
          label={t('webhook_secret_optional', 'Webhook secret token (optional)')}
          placeholder={data?.webhookSecret || '••••'}
          value={webhookSecret}
          onChange={setWebhookSecret}
        />
      </div>

      <div>
        <Button onClick={save} disabled={saving}>
          {t('save', 'Save')}
        </Button>
      </div>
    </div>
  );
};

export const SalesBrainChannels: FC = () => {
  const t = useT();
  return (
    <div className="flex flex-col gap-[24px]">
      <div className="text-[13px] text-customColor18">
        {t(
          'channels_intro',
          'Connect real messaging channels so the AI can reply directly to leads on WhatsApp, Messenger, Instagram and Telegram, instead of staying in-app only.'
        )}
      </div>
      <MetaChannelSection />
      <TelegramChannelSection />
    </div>
  );
};
