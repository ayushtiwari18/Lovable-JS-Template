import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge, PaymentMethodBadge } from "./OrderBadges";
import { OrderDetailsCustomer } from "./OrderDetailsCustomer";
import { OrderDetailsOrder } from "./OrderDetailsOrder";
import { OrderDetailsShipping } from "./OrderDetailsShipping";
import { OrderDetailsDelivery } from "./OrderDetailsDelivery";
import { OrderDetailsItems } from "./OrderDetailsItems";
import { OrderDetailsNotes } from "./OrderDetailsNotes";

export function OrderViewDialog({ open, onOpenChange, order }) {
  if (!order) return null;
  console.log(order.customization_details, order.items);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="truncate">Order #{order.id.slice(0, 8)}</span>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              <StatusBadge status={order.status} />
              <PaymentMethodBadge method={order.payment_method} />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <OrderDetailsCustomer
            customer={order.customers}
            customerId={order.customer_id}
          />
          <OrderDetailsOrder order={order} />
          <OrderDetailsShipping
            shippingInfo={order.shipping_info}
            customerName={order.customers?.name || "Unknown Customer"}
          />

          <OrderDetailsDelivery deliveryInfo={order.delivery_info} />
          <OrderDetailsNotes notes={order.order_notes} />
          <OrderDetailsItems
            items={order.items}
            customizationDetails={order.customization_details}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
