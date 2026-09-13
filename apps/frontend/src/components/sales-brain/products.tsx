'use client';

import { FC, Fragment, useCallback } from 'react';
import { object, string, number } from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useSalesBrainProducts } from '@gitroom/frontend/components/sales-brain/sales-brain.hooks';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { Textarea } from '@gitroom/react/form/textarea';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const splitLines = (value?: string) =>
  (value || '')
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);

export const SalesBrainProducts: FC = () => {
  const { data, mutate } = useSalesBrainProducts();
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();

  const openForm = useCallback(
    (product?: any) => () => {
      modal.openModal({
        title: product
          ? t('edit_product', 'Edit product')
          : t('add_product', 'Add product'),
        withCloseButton: true,
        classNames: { modal: 'w-[600px] max-w-full' },
        children: <ProductForm data={product} reload={mutate} />,
      });
    },
    [t]
  );

  const remove = useCallback(
    (product: any) => async () => {
      if (
        await deleteDialog(
          t(
            'are_you_sure_you_want_to_delete_product',
            `Are you sure you want to delete ${product.name}?`,
            { name: product.name }
          )
        )
      ) {
        await fetch(`/sales-brain/products/${product.id}`, { method: 'DELETE' });
        mutate();
        toaster.show(t('product_deleted', 'Product deleted'), 'success');
      }
    },
    []
  );

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px]">{t('products_offers', 'Products & Offers')}</h3>
        <Button onClick={openForm()}>{t('add_product', 'Add product')}</Button>
      </div>
      <div className="bg-sixth border-fifth border rounded-[4px] p-[24px]">
        {!data?.length && (
          <div className="text-customColor18">
            {t(
              'no_products_yet',
              'No products yet. Add what you sell so the Sales Brain can recommend it.'
            )}
          </div>
        )}
        {!!data?.length && (
          <div className="grid grid-cols-[1.5fr,1fr,1fr,1fr] w-full gap-y-[12px]">
            <div className="font-[600]">{t('name', 'Name')}</div>
            <div className="font-[600]">{t('price', 'Price')}</div>
            <div className="font-[600]">{t('edit', 'Edit')}</div>
            <div className="font-[600]">{t('delete', 'Delete')}</div>
            {data.map((product: any) => (
              <Fragment key={product.id}>
                <div className="flex flex-col justify-center">{product.name}</div>
                <div className="flex flex-col justify-center">
                  {product.price != null ? `$${product.price}` : '—'}
                </div>
                <div className="flex flex-col justify-center">
                  <Button onClick={openForm(product)}>{t('edit', 'Edit')}</Button>
                </div>
                <div className="flex flex-col justify-center">
                  <Button onClick={remove(product)}>{t('delete', 'Delete')}</Button>
                </div>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const schema = object().shape({
  name: string().required(),
  description: string(),
  price: number().nullable().transform((v) => (Number.isNaN(v) ? undefined : v)),
  primaryOutcome: string(),
  guarantees: string(),
  refundPolicy: string(),
  features: string(),
  benefits: string(),
});

const ProductForm: FC<{ data?: any; reload: () => void }> = ({
  data,
  reload,
}) => {
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();
  const form = useForm({
    resolver: yupResolver(schema),
    values: {
      name: data?.name || '',
      description: data?.description || '',
      price: data?.price ?? undefined,
      primaryOutcome: data?.primaryOutcome || '',
      guarantees: data?.guarantees || '',
      refundPolicy: data?.refundPolicy || '',
      features: (data?.features || []).join('\n'),
      benefits: (data?.benefits || []).join('\n'),
    },
  });

  const submit = useCallback(
    async (values: any) => {
      await fetch('/sales-brain/products', {
        method: 'POST',
        body: JSON.stringify({
          ...(data?.id ? { id: data.id } : {}),
          name: values.name,
          description: values.description,
          price: values.price ? Number(values.price) : undefined,
          primaryOutcome: values.primaryOutcome,
          guarantees: values.guarantees,
          refundPolicy: values.refundPolicy,
          features: splitLines(values.features),
          benefits: splitLines(values.benefits),
        }),
      });
      toaster.show(t('product_saved', 'Product saved'), 'success');
      modal.closeAll();
      reload();
    },
    [data]
  );

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="flex flex-col gap-[10px]"
      >
        <Input label="Name" translationKey="label_name" {...form.register('name')} />
        <Textarea
          label="Description"
          translationKey="label_description"
          {...form.register('description')}
        />
        <Input
          label="Price"
          type="number"
          translationKey="label_price"
          {...form.register('price')}
        />
        <Input
          label="Primary outcome"
          translationKey="label_primary_outcome"
          {...form.register('primaryOutcome')}
        />
        <Textarea
          label="Features (one per line)"
          translationKey="label_features"
          {...form.register('features')}
        />
        <Textarea
          label="Benefits (one per line)"
          translationKey="label_benefits"
          {...form.register('benefits')}
        />
        <Input
          label="Guarantees"
          translationKey="label_guarantees"
          {...form.register('guarantees')}
        />
        <Input
          label="Refund policy"
          translationKey="label_refund_policy"
          {...form.register('refundPolicy')}
        />
        <Button type="submit" className="mt-[10px]">
          {t('save', 'Save')}
        </Button>
      </form>
    </FormProvider>
  );
};
