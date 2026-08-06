import { useStore } from '../store/useStore'
import { CheckinDrawer } from './drawers/CheckinDrawer'
import { CheckoutDrawer } from './drawers/CheckoutDrawer'
import { PayDrawer } from './drawers/PayDrawer'
import { ReceiptDrawer } from './drawers/ReceiptDrawer'
import { ClientDrawer } from './drawers/ClientDrawer'
import { NewBookingDrawer } from './drawers/NewBookingDrawer'
import { AskDrawer } from './drawers/AskDrawer'
import { BookingEditor } from './drawers/BookingEditor'

export function Overlays() {
  const drawer = useStore((s) => s.drawer)
  const calEdit = useStore((s) => s.calEdit)
  return (
    <>
      {drawer === 'checkin' && <CheckinDrawer />}
      {drawer === 'checkout' && <CheckoutDrawer />}
      {drawer === 'pay' && <PayDrawer />}
      {drawer === 'receipt' && <ReceiptDrawer />}
      {drawer === 'client' && <ClientDrawer />}
      {drawer === 'newbooking' && <NewBookingDrawer />}
      {drawer === 'ask' && <AskDrawer />}
      {calEdit && <BookingEditor />}
    </>
  )
}
