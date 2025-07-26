import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Eye,
  Package,
  Edit,
  Trash2,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  RefreshCw,
  Calendar,
  IndianRupee,
  User,
  MapPin,
  Filter,
  X,
  ChevronDown,
  MoreVertical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const { toast } = useToast();

  const ORDERS_PER_PAGE = 50;

  // Filter options
  const filterOptions = [
    { key: "all", label: "All Orders", icon: Package },
    { key: "pending", label: "Pending", icon: Clock },
    { key: "confirmed", label: "Confirmed", icon: CheckCircle },
    { key: "cod", label: "COD Orders", icon: Banknote },
    { key: "paynow_paid", label: "PayNow Paid", icon: CreditCard },
  ];

  // Apply filters and pagination
  const applyFilter = (filterKey) => {
    setActiveFilter(filterKey);
    setCurrentPage(1);
    let filtered = [...orders];

    switch (filterKey) {
      case "pending":
        filtered = orders.filter((order) => order.status === "pending");
        break;
      case "confirmed":
        filtered = orders.filter((order) => order.status === "confirmed");
        break;
      case "cod":
        filtered = orders.filter((order) => order.payment_method === "COD");
        break;
      case "paynow_paid":
        filtered = orders.filter(
          (order) =>
            order.payment_method === "PayNow" &&
            order.payment_status === "completed"
        );
        break;
      default:
        filtered = orders;
    }

    setFilteredOrders(filtered);
    setDisplayedOrders(filtered.slice(0, ORDERS_PER_PAGE));
    setHasMore(filtered.length > ORDERS_PER_PAGE);
  };

  // Load more orders
  const loadMoreOrders = () => {
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * ORDERS_PER_PAGE;
    const endIndex = startIndex + ORDERS_PER_PAGE;

    setTimeout(() => {
      const newOrders = filteredOrders.slice(startIndex, endIndex);
      setDisplayedOrders((prev) => [...prev, ...newOrders]);
      setCurrentPage(nextPage);
      setHasMore(endIndex < filteredOrders.length);
      setLoadingMore(false);
    }, 500);
  };

  // Fetch orders from Supabase with pagination
  const fetchOrders = async (reset = true) => {
    try {
      setLoading(reset);

      // Get total count first
      const { count, error: countError } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;
      setTotalOrders(count || 0);

      // Fetch initial orders
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          customers (
            id,
            user_id,
            name,
            email,
            phone,
            address,
            bio,
            created_at
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(ORDERS_PER_PAGE * 2); // Load first 2 pages worth

      if (error) throw error;

      const fetchedOrders = data || [];
      setOrders(fetchedOrders);
      setFilteredOrders(fetchedOrders);
      setDisplayedOrders(fetchedOrders.slice(0, ORDERS_PER_PAGE));
      setHasMore(fetchedOrders.length > ORDERS_PER_PAGE);
      setCurrentPage(1);
    } catch (err) {
      console.error("Fetch error:", err);
      toast({
        title: "Error fetching orders",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update order status and delivery info
  const updateOrder = async (orderId, updates) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Order updated successfully",
        description: "The order has been updated with new information.",
      });

      fetchOrders(false);
      setIsEditDialogOpen(false);
      setEditingOrder(null);
    } catch (err) {
      console.error("Update error:", err);
      toast({
        title: "Error updating order",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Delete order
  const handleDelete = async () => {
    if (!deleteOrder) return;

    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", deleteOrder.id);

      if (error) throw error;

      toast({
        title: "Order deleted successfully",
        description: "The order has been removed from the system.",
      });

      fetchOrders(false);
      setDeleteOrder(null);
    } catch (err) {
      console.error("Delete error:", err);
      toast({
        title: "Error deleting order",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Get status badge with colors
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
        icon: Clock,
      },
      confirmed: {
        color:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
        icon: CheckCircle,
      },
      processing: {
        color:
          "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
        icon: Package,
      },
      shipped: {
        color:
          "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
        icon: Truck,
      },
      delivered: {
        color:
          "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
        icon: CheckCircle,
      },
      rejected: {
        color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} gap-1 text-xs`}>
        <IconComponent className="h-3 w-3" />
        <span className="hidden sm:inline">
          {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </span>
        <span className="sm:hidden">{status?.charAt(0).toUpperCase()}</span>
      </Badge>
    );
  };

  // Get payment method badge
  const getPaymentMethodBadge = (method) => {
    return method === "COD" ? (
      <Badge variant="outline" className="gap-1 text-xs">
        <Banknote className="h-3 w-3" />
        <span className="hidden sm:inline">Cash on Delivery</span>
        <span className="sm:hidden">COD</span>
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1 text-xs">
        <CreditCard className="h-3 w-3" />
        <span className="hidden sm:inline">PayNow</span>
        <span className="sm:hidden">Pay</span>
      </Badge>
    );
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status) => {
    const config = {
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      completed:
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      failed: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };

    return (
      <Badge className={`${config[status] || config.pending} text-xs`}>
        <span className="hidden sm:inline">
          {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </span>
        <span className="sm:hidden">{status?.charAt(0).toUpperCase()}</span>
      </Badge>
    );
  };

  // Format shipping info for display - FIXED VERSION
  const formatShippingInfo = (shippingInfo) => {
    if (!shippingInfo || typeof shippingInfo !== "object")
      return (
        <p className="text-sm text-muted-foreground">
          No shipping information available
        </p>
      );

    return (
      <div className="space-y-3">
        {shippingInfo.address && (
          <div>
            <span className="font-medium text-sm">Address:</span>
            <p className="text-sm text-muted-foreground mt-1 break-words">
              {String(shippingInfo.address)}
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {shippingInfo.city && (
            <div className="flex justify-between">
              <span className="font-medium text-sm">City:</span>
              <span className="text-sm">{String(shippingInfo.city)}</span>
            </div>
          )}
          {shippingInfo.state && (
            <div className="flex justify-between">
              <span className="font-medium text-sm">State:</span>
              <span className="text-sm">{String(shippingInfo.state)}</span>
            </div>
          )}
          {shippingInfo.pincode && (
            <div className="flex justify-between">
              <span className="font-medium text-sm">Pincode:</span>
              <span className="text-sm">{String(shippingInfo.pincode)}</span>
            </div>
          )}
          {shippingInfo.phone && (
            <div className="flex justify-between">
              <span className="font-medium text-sm">Phone:</span>
              <span className="text-sm">{String(shippingInfo.phone)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Format order items for display - FIXED VERSION
  const formatOrderItems = (items) => {
    if (!items)
      return (
        <p className="text-sm text-muted-foreground">No items available</p>
      );

    // Handle case where items might be a string (JSON) or already an array
    let parsedItems = items;
    if (typeof items === "string") {
      try {
        parsedItems = JSON.parse(items);
      } catch (e) {
        console.error("Failed to parse items:", e);
        return (
          <p className="text-sm text-muted-foreground">Invalid items data</p>
        );
      }
    }

    if (!Array.isArray(parsedItems)) {
      return (
        <p className="text-sm text-muted-foreground">No items available</p>
      );
    }

    return (
      <div className="space-y-4">
        {parsedItems.map((item, index) => (
          <div key={index} className="border rounded-lg p-3 sm:p-4 bg-muted/30">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-2 sm:space-y-0">
              <h4 className="font-medium text-sm sm:text-base break-words">
                {String(item.name || item.title || `Item ${index + 1}`)}
              </h4>
              <Badge variant="outline" className="self-start">
                ₹{String(item.price || item.amount || 0)}
              </Badge>
            </div>

            {item.description && (
              <p className="text-sm text-muted-foreground mb-2 break-words">
                {String(item.description)}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
              {item.quantity && (
                <div>
                  <span className="font-medium">Quantity:</span>{" "}
                  {String(item.quantity)}
                </div>
              )}
              {item.size && (
                <div>
                  <span className="font-medium">Size:</span> {String(item.size)}
                </div>
              )}
              {item.color && (
                <div>
                  <span className="font-medium">Color:</span>{" "}
                  {String(item.color)}
                </div>
              )}
              {item.material && (
                <div>
                  <span className="font-medium">Material:</span>{" "}
                  {String(item.material)}
                </div>
              )}
            </div>

            {item.customization && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm break-words">
                <span className="font-medium">Customization:</span>{" "}
                {String(item.customization)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilter(activeFilter);
  }, [orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 sm:py-20">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="text-base sm:text-lg font-medium">
            Loading orders...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Orders
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            Manage customer orders and shipments
          </p>
        </div>
        <Button
          onClick={() => fetchOrders()}
          variant="outline"
          className="gap-2 self-start"
          size="sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Filter Buttons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Filter Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => {
              const IconComponent = filter.icon;
              const isActive = activeFilter === filter.key;

              return (
                <Button
                  key={filter.key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyFilter(filter.key)}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{filter.label}</span>
                  <span className="sm:hidden">
                    {filter.label.split(" ")[0]}
                  </span>
                  {isActive && <X className="h-3 w-3 ml-1" />}
                </Button>
              );
            })}
          </div>
          <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Showing {displayedOrders.length} of {filteredOrders.length} orders
            {totalOrders > 0 && ` (${totalOrders} total)`}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              Total Orders
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {orders.length}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {orders.filter((o) => o.status === "pending").length}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              COD Orders
            </CardTitle>
            <Banknote className="h-4 w-4 text-green-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {orders.filter((o) => o.payment_method === "COD").length}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              Revenue
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
              ₹
              {orders
                .reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Orders ({displayedOrders.length})
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage and track all customer orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {displayedOrders.length === 0 ? (
              <div className="text-center py-8 sm:py-10">
                <Package className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-base sm:text-lg font-medium">
                  No orders found
                </p>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <>
                {displayedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 sm:p-4 lg:p-6 rounded-lg border border-border bg-surface-light hover:bg-muted/30 transition-colors space-y-4 lg:space-y-0"
                  >
                    {/* Order Info */}
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-medium rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {String(order.customers?.name || "Unknown Customer")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Order Details - Mobile Layout */}
                    <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 lg:gap-6">
                      {/* Amount and Items */}
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="font-medium text-foreground text-sm sm:text-base">
                            ₹{Number(order.amount) || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-foreground text-sm sm:text-base">
                            {Array.isArray(order.items)
                              ? order.items.length
                              : 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Items</p>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {getStatusBadge(order.status)}
                        {getPaymentMethodBadge(order.payment_method)}
                        {getPaymentStatusBadge(order.payment_status)}
                        {order.production_status && (
                          <Badge variant="outline" className="text-xs">
                            <span className="hidden sm:inline">
                              {String(order.production_status)}
                            </span>
                            <span className="sm:hidden">
                              {String(order.production_status)
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-1 sm:space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingOrder(order);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteOrder(order)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={loadMoreOrders}
                      disabled={loadingMore}
                      variant="outline"
                      className="gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Load More Orders
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl lg:text-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="truncate">
                    Order #{selectedOrder.id.slice(0, 8)}
                  </span>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {getStatusBadge(selectedOrder.status)}
                    {getPaymentMethodBadge(selectedOrder.payment_method)}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedOrder.customers?.id && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium text-sm">
                          Customer ID:
                        </span>
                        <span className="text-sm font-mono break-all">
                          {String(selectedOrder.customers.id)}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-sm">Name:</span>
                      <span className="text-sm break-words">
                        {String(selectedOrder.customers?.name || "N/A")}
                      </span>
                    </div>

                    {selectedOrder.customers?.email && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium text-sm">Email:</span>
                        <span className="text-sm break-all">
                          {String(selectedOrder.customers.email)}
                        </span>
                      </div>
                    )}

                    {selectedOrder.customers?.phone && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium text-sm">Phone:</span>
                        <span className="text-sm">
                          {String(selectedOrder.customers.phone)}
                        </span>
                      </div>
                    )}

                    {selectedOrder.customers?.address && (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">Address:</span>
                        <div className="text-sm bg-muted p-2 rounded break-words">
                          {typeof selectedOrder.customers.address === "string"
                            ? String(selectedOrder.customers.address)
                            : JSON.stringify(
                                selectedOrder.customers.address,
                                null,
                                2
                              )}
                        </div>
                      </div>
                    )}

                    {selectedOrder.customers?.bio && (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">Bio:</span>
                        <p className="text-sm text-muted-foreground break-words">
                          {String(selectedOrder.customers.bio)}
                        </p>
                      </div>
                    )}

                    {selectedOrder.customers?.created_at && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium text-sm">
                          Customer Since:
                        </span>
                        <span className="text-sm">
                          {new Date(
                            selectedOrder.customers.created_at
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}

                    {selectedOrder.customers?.user_id && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium text-sm">User ID:</span>
                        <span className="text-sm font-mono break-all">
                          {String(selectedOrder.customers.user_id)}
                        </span>
                      </div>
                    )}

                    {/* Fallback if customer info is missing */}
                    {!selectedOrder.customers && selectedOrder.customer_id && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium text-sm">
                          Customer ID:
                        </span>
                        <span className="text-sm font-mono break-all">
                          {String(selectedOrder.customer_id)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                      Order Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-sm">Status:</span>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-sm">Payment:</span>
                      {getPaymentMethodBadge(selectedOrder.payment_method)}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-sm">
                        Payment Status:
                      </span>
                      {getPaymentStatusBadge(selectedOrder.payment_status)}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium text-sm">Total Amount:</span>
                      <span className="font-bold text-base sm:text-lg">
                        ₹{String(selectedOrder.amount || 0)}
                      </span>
                    </div>
                    {selectedOrder.transaction_id && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium text-sm">
                          Transaction ID:
                        </span>
                        <span className="text-sm font-mono break-all">
                          {String(selectedOrder.transaction_id)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Shipping Info */}
                {selectedOrder.shipping_info && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                        Shipping Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {formatShippingInfo(selectedOrder.shipping_info)}
                    </CardContent>
                  </Card>
                )}

                {/* Delivery Info */}
                {selectedOrder.delivery_info && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                        Delivery Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedOrder.delivery_info.estimated_date && (
                          <div>
                            <span className="font-medium text-sm">
                              Estimated Date:
                            </span>
                            <p className="text-sm">
                              {String(
                                selectedOrder.delivery_info.estimated_date
                              )}
                            </p>
                          </div>
                        )}
                        {selectedOrder.delivery_info.estimated_time && (
                          <div>
                            <span className="font-medium text-sm">
                              Estimated Time:
                            </span>
                            <p className="text-sm">
                              {String(
                                selectedOrder.delivery_info.estimated_time
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Order Notes */}
                {selectedOrder.order_notes && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">
                        Order Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm bg-muted p-3 rounded break-words">
                        {String(selectedOrder.order_notes)}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Items */}
                {selectedOrder.items && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">
                        Order Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {formatOrderItems(selectedOrder.items)}
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xs sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto">
          {editingOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  Edit Order #{editingOrder.id.slice(0, 8)}
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const updates = {
                    status: formData.get("status"),
                    payment_status: formData.get("payment_status"),
                    production_status: formData.get("production_status"),
                    order_notes: formData.get("order_notes"),
                  };

                  // Add delivery info if provided
                  const deliveryDate = formData.get("delivery_date");
                  const deliveryTime = formData.get("delivery_time");
                  if (deliveryDate || deliveryTime) {
                    updates.delivery_info = {
                      ...editingOrder.delivery_info,
                      estimated_date: deliveryDate,
                      estimated_time: deliveryTime,
                    };
                  }

                  updateOrder(editingOrder.id, updates);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status" className="text-sm">
                      Order Status
                    </Label>
                    <Select name="status" defaultValue={editingOrder.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="payment_status" className="text-sm">
                      Payment Status
                    </Label>
                    <Select
                      name="payment_status"
                      defaultValue={editingOrder.payment_status}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="production_status" className="text-sm">
                    Production Status
                  </Label>
                  <Select
                    name="production_status"
                    defaultValue={editingOrder.production_status}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="quality_check">
                        Quality Check
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="delivery_date" className="text-sm">
                      Delivery Date
                    </Label>
                    <Input
                      name="delivery_date"
                      type="date"
                      defaultValue={
                        editingOrder.delivery_info?.estimated_date || ""
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="delivery_time" className="text-sm">
                      Delivery Time
                    </Label>
                    <Input
                      name="delivery_time"
                      type="time"
                      defaultValue={
                        editingOrder.delivery_info?.estimated_time || ""
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="order_notes" className="text-sm">
                    Order Notes
                  </Label>
                  <Textarea
                    name="order_notes"
                    placeholder="Add notes about this order..."
                    defaultValue={editingOrder.order_notes || ""}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    Save Changes
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteOrder}
        onOpenChange={() => setDeleteOrder(null)}
      >
        <AlertDialogContent className="max-w-xs sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Delete Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete order #
              {deleteOrder?.id.slice(0, 8)}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
