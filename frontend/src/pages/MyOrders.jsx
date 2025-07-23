import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  MapPin,
  ShoppingBag,
  Eye,
  ArrowRight,
  Loader2,
  Star,
  Weight,
  Ruler,
  Tags,
  Wrench,
} from "lucide-react";





const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "confirmed":
      return <CheckCircle className="h-4 w-4" />;
    case "processing":
      return <Package className="h-4 w-4" />;
    case "shipped":
      return <Truck className="h-4 w-4" />;
    case "delivered":
      return <CheckCircle className="h-4 w-4" />;
    case "cancelled":
      return <XCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "confirmed":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "processing":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getProductionStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-gray-100 text-gray-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "quality_check":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getEstimatedArrival = (createdAt, status, estimatedDays = 7) => {
  const orderDate = new Date(createdAt);
  const today = new Date();

  switch (status?.toLowerCase()) {
    case "delivered":
      return { date: null, text: "Delivered", isPast: true };
    case "cancelled":
      return { date: null, text: "Cancelled", isPast: true };
    case "shipped":
      const arrivalDate = new Date(orderDate);
      arrivalDate.setDate(arrivalDate.getDate() + 3); // 3 days for shipping
      return {
        date: arrivalDate,
        text: `Arriving ${arrivalDate.toLocaleDateString()}`,
        isPast: arrivalDate < today,
      };
    case "processing":
      const processingDate = new Date(orderDate);
      processingDate.setDate(processingDate.getDate() + estimatedDays);
      return {
        date: processingDate,
        text: `Expected ${processingDate.toLocaleDateString()}`,
        isPast: false,
      };
    default:
      const defaultDate = new Date(orderDate);
      defaultDate.setDate(defaultDate.getDate() + estimatedDays);
      return {
        date: defaultDate,
        text: `Expected ${defaultDate.toLocaleDateString()}`,
        isPast: false,
      };
  }
};

export default function MyOrders() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [productsCache, setProductsCache] = useState(new Map());

  useEffect(() => {
    if (!user) {
      console.log("No user found"); // Debug log
      return;
    }

    console.log("Loading orders for user:", user.id); // Debug log
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      console.log("User:", user); // Debug log
      console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL); // Debug log

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      console.log("Orders query result:", { ordersData, ordersError }); // Debug log

      if (ordersError) {
        console.error("Supabase error:", ordersError);
        throw ordersError;
      }

      if (ordersData && ordersData.length > 0) {
        // Extract all unique product IDs from orders
        const productIds = new Set();

        ordersData.forEach((order) => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item) => {
              if (item.id) productIds.add(item.id);
            });
          }
          if (order.catalog_items && Array.isArray(order.catalog_items)) {
            order.catalog_items.forEach((item) => {
              if (item.id) productIds.add(item.id);
            });
          }
        });

        console.log("Product IDs to fetch:", Array.from(productIds)); // Debug log

        // Fetch product details for all unique IDs
        if (productIds.size > 0) {
          const { data: productsData, error: productsError } = await supabase
            .from("products")
            .select("*")
            .in("id", Array.from(productIds));

          console.log("Products query result:", {
            productsData,
            productsError,
          }); // Debug log

          if (!productsError && productsData) {
            const cache = new Map();
            productsData.forEach((product) => {
              cache.set(product.id, product);
            });
            setProductsCache(cache);
          }
        }
      }

      setOrders(ordersData || []);
    } catch (error) {
      console.error("Error loading orders:", error);

      // Add toast notification for debugging
      toast({
        title: "Debug Info",
        description: `Error: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrderItems = (order) => {
    // Check both items and catalog_items
    const items = order.items || [];
    const catalogItems = order.catalog_items || [];

    // Combine and enhance with product details
    const allItems = [...items, ...catalogItems];

    return allItems.map((item) => ({
      ...item,
      productDetails: productsCache.get(item.id) || null,
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50/50">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
            <div className="max-w-4xl mx-auto">
              <Card className="border border-gray-200">
                <CardContent className="p-8 sm:p-12">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Loading Your Orders
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mt-1">
                        Please wait while we fetch your order history...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!orders.length) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50/50">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10 mb-6 sm:mb-8">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                        My Orders
                      </h1>
                      <p className="text-sm sm:text-base text-gray-600">
                        Track and manage your order history
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Empty State */}
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 sm:p-12 text-center">
                  <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    No Orders Yet
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                    You haven't placed any orders yet. Start shopping to see
                    your orders here.
                  </p>
                  <Link to="/shop">
                    <Button size="lg" className="px-6 sm:px-8">
                      Start Shopping
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10 mb-6 sm:mb-8">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                        My Orders
                      </h1>
                      <p className="text-sm sm:text-base text-gray-600">
                        Track and manage your order history
                      </p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="text-xs sm:text-sm text-gray-600">
                      Total Orders
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-sm sm:text-base px-3 py-1 mt-1"
                    >
                      {orders.length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders List */}
            <div className="space-y-4 sm:space-y-6">
              {orders.map((order) => {
                const orderItems = getOrderItems(order);
                const arrival = getEstimatedArrival(
                  order.created_at,
                  order.status,
                  order.estimated_delivery_days
                );
                const isExpanded = expandedOrder === order.id;

                return (
                  <Card
                    key={order.id}
                    className="border border-gray-200 hover:border-primary/30 transition-colors overflow-hidden"
                  >
                    {/* Order Header */}
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base sm:text-lg">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </CardTitle>
                            <Badge
                              className={`${getStatusColor(
                                order.status
                              )} text-xs`}
                            >
                              <div className="flex items-center gap-1">
                                {getStatusIcon(order.status)}
                                <span className="capitalize">
                                  {order.status}
                                </span>
                              </div>
                            </Badge>

                            {/* Order Type Badge */}
                            {order.order_type &&
                              order.order_type !== "standard" && (
                                <Badge variant="outline" className="text-xs">
                                  {order.order_type.replace("_", " ")}
                                </Badge>
                              )}

                            {/* Customization Badge */}
                            {order.requires_customization && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                              >
                                <Wrench className="h-3 w-3 mr-1" />
                                Custom
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>
                                Placed{" "}
                                {new Date(
                                  order.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>

                            {arrival.text && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span
                                  className={
                                    arrival.isPast
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }
                                >
                                  {arrival.text}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>
                                {orderItems.length} item
                                {orderItems.length > 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>

                          {/* Production Status */}
                          {order.production_status &&
                            order.production_status !== "pending" && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">
                                  Production:
                                </span>
                                <Badge
                                  className={`${getProductionStatusColor(
                                    order.production_status
                                  )} text-xs`}
                                >
                                  {order.production_status.replace("_", " ")}
                                </Badge>
                              </div>
                            )}
                        </div>

                        <div className="text-left sm:text-right space-y-2">
                          <p className="text-lg sm:text-xl font-bold text-gray-900">
                            ₹{Number(order.amount)?.toLocaleString() || "0"}
                          </p>
                          <div className="space-y-1">
                            {order.payment_method && (
                              <p className="text-xs sm:text-sm text-gray-600 capitalize">
                                {order.payment_method.replace("_", " ")}
                              </p>
                            )}
                            {order.payment_status && (
                              <Badge
                                variant={
                                  order.payment_status === "completed"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {order.payment_status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Order Items */}
                    <CardContent className="pt-0">
                      {orderItems.length > 0 && (
                        <div className="space-y-3 sm:space-y-4">
                          {/* First item preview */}
                          <div className="flex items-center gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg">
                            {orderItems[0].productDetails?.image_url && (
                              <img
                                src={orderItems[0].productDetails.image_url}
                                alt={
                                  orderItems[0].productDetails.title ||
                                  orderItems[0].title
                                }
                                className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded-md border"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm sm:text-base text-gray-900 truncate">
                                {orderItems[0].productDetails?.title ||
                                  orderItems[0].title ||
                                  "Product"}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm text-gray-600">
                                <span>Qty: {orderItems[0].quantity || 1}</span>
                                <span>•</span>
                                <span>
                                  ₹
                                  {Number(
                                    orderItems[0].price || 0
                                  ).toLocaleString()}
                                </span>
                                {orderItems[0].productDetails
                                  ?.catalog_number && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      {
                                        orderItems[0].productDetails
                                          .catalog_number
                                      }
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Customization info */}
                              {orderItems[0].customization && (
                                <div className="mt-1 text-xs text-orange-600">
                                  <Wrench className="h-3 w-3 inline mr-1" />
                                  Customized
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Show more items indicator */}
                          {orderItems.length > 1 && !isExpanded && (
                            <div className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedOrder(order.id)}
                                className="text-primary hover:text-primary/80"
                              >
                                +{orderItems.length - 1} more item
                                {orderItems.length > 2 ? "s" : ""}
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          )}

                          {/* Expanded items */}
                          {isExpanded && orderItems.length > 1 && (
                            <div className="space-y-3 border-t pt-3">
                              {orderItems.slice(1).map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg"
                                >
                                  {item.productDetails?.image_url && (
                                    <img
                                      src={item.productDetails.image_url}
                                      alt={
                                        item.productDetails.title || item.title
                                      }
                                      className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded-md border"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm sm:text-base text-gray-900 truncate">
                                      {item.productDetails?.title ||
                                        item.title ||
                                        "Product"}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm text-gray-600">
                                      <span>Qty: {item.quantity || 1}</span>
                                      <span>•</span>
                                      <span>
                                        ₹
                                        {Number(
                                          item.price || 0
                                        ).toLocaleString()}
                                      </span>
                                      {item.productDetails?.catalog_number && (
                                        <>
                                          <span>•</span>
                                          <span>
                                            {item.productDetails.catalog_number}
                                          </span>
                                        </>
                                      )}
                                    </div>

                                    {/* Additional product details */}
                                    {(item.productDetails?.material_type ||
                                      item.productDetails?.weight_grams ||
                                      item.productDetails?.dimensions) && (
                                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                                        {item.productDetails.material_type && (
                                          <div className="flex items-center gap-1">
                                            <Tags className="h-3 w-3" />
                                            <span>
                                              {
                                                item.productDetails
                                                  .material_type
                                              }
                                            </span>
                                          </div>
                                        )}
                                        {item.productDetails.weight_grams && (
                                          <div className="flex items-center gap-1">
                                            <Weight className="h-3 w-3" />
                                            <span>
                                              {item.productDetails.weight_grams}
                                              g
                                            </span>
                                          </div>
                                        )}
                                        {item.productDetails.dimensions && (
                                          <div className="flex items-center gap-1">
                                            <Ruler className="h-3 w-3" />
                                            <span>
                                              {
                                                item.productDetails.dimensions
                                                  .length
                                              }
                                              ×
                                              {
                                                item.productDetails.dimensions
                                                  .width
                                              }
                                              ×
                                              {
                                                item.productDetails.dimensions
                                                  .height
                                              }
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Customization info */}
                                    {item.customization && (
                                      <div className="mt-2 text-xs text-orange-600">
                                        <Wrench className="h-3 w-3 inline mr-1" />
                                        Customized
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}

                              <div className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedOrder(null)}
                                  className="text-gray-600 hover:text-gray-800"
                                >
                                  Show less
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Order Notes */}
                      {order.order_notes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> {order.order_notes}
                          </p>
                        </div>
                      )}

                      <Separator className="my-4" />

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Link
                          to={`/order/${order.id}`}
                          className="flex-1 sm:flex-none"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>

                        {order.status === "delivered" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Rate Order
                          </Button>
                        )}

                        {order.status === "shipped" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Track Package
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
