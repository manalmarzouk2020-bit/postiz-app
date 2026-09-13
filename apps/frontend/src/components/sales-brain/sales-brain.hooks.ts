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
