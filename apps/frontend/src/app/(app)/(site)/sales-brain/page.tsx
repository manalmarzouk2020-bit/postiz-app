export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { SalesBrain } from '@gitroom/frontend/components/sales-brain/sales-brain';
import { isGeneralServerSide } from '@gitroom/helpers/utils/is.general.server.side';
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'Postiz' : 'Gitroom'} Sales Brain`,
  description: '',
};
export default async function Index() {
  return <SalesBrain />;
}
