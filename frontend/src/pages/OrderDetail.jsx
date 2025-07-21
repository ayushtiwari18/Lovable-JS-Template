import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  MapPin,
  Eye,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

// ----- Status helpers -----
const getStatusIcon = (status) => {
  switch (status) {
    case "delivered":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "shipped":
      return <Package className="h-4 w-4 text-blue-600" />;
    case "confirmed":
    case "processing":
      return <Clock className="h-4 w-4 text-blue-600" />;
    case "cancelled":
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-800";
    case "shipped":
      return "bg-blue-100 text-blue-800";
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "processing":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function OrderDetail() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !user) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .eq("user_id", user.id)
          .single();

        console.log("Order fetch result:", { data, error });
        setOrder(data || null);
      } catch (error) {
        console.error("Error fetching order:", error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // No automatic refresh - user can manually refresh page if needed
  }, [orderId, user]);

  // Add a manual refresh button for better UX
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

      setOrder(data || null);
    } catch (error) {
      console.error("Error refreshing order:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="h-10" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div className="mt-6 text-lg text-gray-600">
            Loading order details...
          </div>
        </div>
      </Layout>
    );

  if (!order)
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The order you're looking for doesn't exist or you don't have
              access.
            </p>
            <Link to="/my-orders">
              <Button>Back to Orders</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );

  // Defensive: Ensure some deeply nested fields don't error
  const shipping = order.shipping_info ?? {};
  const delivery = order.delivery_info ?? {};
  const orderItems = Array.isArray(order.items) ? order.items : [];
  const orderCreated = order.created_at
    ? new Date(order.created_at).toLocaleString()
    : "—";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/my-orders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
            </Link>
            
            {/* Add manual refresh button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold">
                Order #{order.id.slice(0, 8)}
              </h1>
              <p className="text-muted-foreground">Placed on {orderCreated}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Status & Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order status */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Order Status</CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm">
                    Payment status:{" "}
                    <span className="font-semibold">
                      {order.payment_status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {order.status === "cancelled" ? (
                    <div className="text-red-600 font-medium">
                      This order was cancelled.
                    </div>
                  ) : (
                    <div>
                      {order.payment_method && (
                        <div className="mb-2">
                          <b>Payment Method:</b> {order.payment_method}
                          {order.upi_reference && (
                            <span className="ml-2 text-xs text-gray-500">
                              (Ref: {order.upi_reference})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 py-3 border-b last:border-b-0"
                      >
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                          {item.customization &&
                            Object.values(item.customization).some(
                              (v) => v
                            ) && (
                              <div className="text-xs text-gray-600 mt-1">
                                {item.customization.text && (
                                  <div>Text: {item.customization.text}</div>
                                )}
                                {item.customization.color && (
                                  <div>Color: {item.customization.color}</div>
                                )}
                                {item.customization.size && (
                                  <div>Size: {item.customization.size}</div>
                                )}
                                {item.customization.uploadedImage && (
                                  <div>
                                    Image: {item.customization.uploadedImage}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                        <p className="font-medium">
                          ₹
                          {item.price?.toLocaleString
                            ? item.price.toLocaleString()
                            : item.price}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary, Address, Tracking */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{(order.amount / 1.08).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (8%)</span>
                    <span>
                      ₹{(order.amount - order.amount / 1.08).toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total paid</span>
                    <span>
                      ₹{order.amount?.toLocaleString?.() ?? order.amount}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">
                        {shipping.firstName} {shipping.lastName}
                      </span>
                    </div>
                    <div>{shipping.address}</div>
                    <div>
                      {shipping.city}, {shipping.state} {shipping.zipCode}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {delivery.trackingNumber && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium">Tracking Number:</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {delivery.trackingNumber}
                    </div>
                    {order.status === "delivered" &&
                      delivery.actualDelivery && (
                        <div className="text-sm text-green-600">
                          Delivered on{" "}
                          {new Date(
                            delivery.actualDelivery
                          ).toLocaleDateString()}
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
