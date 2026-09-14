import { useCallback } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export const useSalesBrainDashboard = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/sales-brain/leads/dashboard')).json();
  }, []);
  return useSWR('sales-brain-dashboard', load, { refreshInterval: 30000 });
};

export const useSalesBrainLeads = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/sales-brain/leads')).json();
  }, []);
  return useSWR('sales-brain-leads', load, { refreshInterval: 30000 });
};

export const useSalesBrainLead = (id?: string) => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch(`/sales-brain/leads/${id}`)).json();
  }, [id]);
  return useSWR(id ? `sales-brain-lead-${id}` : null, id ? load : null);
};

export const useSalesBrainProducts = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/sales-brain/products')).json();
  }, []);
  return useSWR('sales-brain-products', load);
};

export const useSalesBrainSettings = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/sales-brain/settings')).json();
  }, []);
  return useSWR('sales-brain-settings', load);
};

export const useSalesBrainHandoffs = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/sales-brain/handoffs')).json();
  }, []);
  return useSWR('sales-brain-handoffs', load, { refreshInterval: 30000 });
};

export const useSalesBrainFollowups = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/sales-brain/followups')).json();
  }, []);
  return useSWR('sales-brain-followups', load, { refreshInterval: 30000 });
};

export const useSalesBrainPlaybook = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/sales-brain/playbook')).json();
  }, []);
  return useSWR('sales-brain-playbook', load);
};

export const useSalesBrainAutomations = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/sales-brain/automations')).json();
  }, []);
  return useSWR('sales-brain-automations', load);
};
