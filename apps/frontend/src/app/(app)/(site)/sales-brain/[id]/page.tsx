export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { SalesBrainLeadDetailPage } from '@gitroom/frontend/components/sales-brain/lead-detail-page';
import { isGeneralServerSide } from '@gitroom/helpers/utils/is.general.server.side';
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'Postiz' : 'Gitroom'} Sales Brain - Lead`,
  description: '',
};
export default async function Page() {
  return <SalesBrainLeadDetailPage />;
}
