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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const { toast } = useToast();

  // Filter options
  const filterOptions = [
    { key: "all", label: "All Orders", icon: Package },
    { key: "pending", label: "Pending", icon: Clock },
    { key: "confirmed", label: "Confirmed", icon: CheckCircle },
    { key: "cod", label: "COD Orders", icon: Banknote },
    { key: "paynow_paid", label: "PayNow Paid", icon: CreditCard },
  ];

  // Apply filters
  const applyFilter = (filterKey) => {
    setActiveFilter(filterKey);
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
  };

  // Fetch orders from Supabase
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          customers (
            name,
            email,
            phone
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setFilteredOrders(data || []);
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

      fetchOrders();
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

      fetchOrders();
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
      <Badge className={`${config.color} gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  // Get payment method badge
  const getPaymentMethodBadge = (method) => {
    return method === "COD" ? (
      <Badge variant="outline" className="gap-1">
        <Banknote className="h-3 w-3" />
        Cash on Delivery
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <CreditCard className="h-3 w-3" />
        PayNow
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
      <Badge className={config[status] || config.pending}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  // Format shipping info for display
  const formatShippingInfo = (shippingInfo) => {
    if (!shippingInfo) return null;

    return (
      <div className="space-y-3">
        {shippingInfo.address && (
          <div>
            <span className="font-medium text-sm">Address:</span>
            <p className="text-sm text-muted-foreground mt-1">
              {shippingInfo.address}
            </p>
          </div>
        )}
        {shippingInfo.city && (
          <div className="flex justify-between">
            <span className="font-medium text-sm">City:</span>
            <span className="text-sm">{shippingInfo.city}</span>
          </div>
        )}
        {shippingInfo.state && (
          <div className="flex justify-between">
            <span className="font-medium text-sm">State:</span>
            <span className="text-sm">{shippingInfo.state}</span>
          </div>
        )}
        {shippingInfo.pincode && (
          <div className="flex justify-between">
            <span className="font-medium text-sm">Pincode:</span>
            <span className="text-sm">{shippingInfo.pincode}</span>
          </div>
        )}
        {shippingInfo.phone && (
          <div className="flex justify-between">
            <span className="font-medium text-sm">Phone:</span>
            <span className="text-sm">{shippingInfo.phone}</span>
          </div>
        )}
      </div>
    );
  };

  // Format order items for display
  const formatOrderItems = (items) => {
    if (!items || !Array.isArray(items)) return null;

    return (
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 bg-muted/30">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">
                {item.name || item.title || `Item ${index + 1}`}
              </h4>
              <Badge variant="outline">₹{item.price || item.amount || 0}</Badge>
            </div>

            {item.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {item.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {item.quantity && (
                <div>
                  <span className="font-medium">Quantity:</span> {item.quantity}
                </div>
              )}
              {item.size && (
                <div>
                  <span className="font-medium">Size:</span> {item.size}
                </div>
              )}
              {item.color && (
                <div>
                  <span className="font-medium">Color:</span> {item.color}
                </div>
              )}
              {item.material && (
                <div>
                  <span className="font-medium">Material:</span> {item.material}
                </div>
              )}
            </div>

            {item.customization && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                <span className="font-medium">Customization:</span>{" "}
                {item.customization}
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
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="text-lg font-medium">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-lg">
            Manage customer orders and shipments
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filter Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
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
                  className="gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  {filter.label}
                  {isActive && <X className="h-3 w-3 ml-1" />}
                </Button>
              );
            })}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o) => o.status === "pending").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">COD Orders</CardTitle>
            <Banknote className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o) => o.payment_method === "COD").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹
              {orders
                .reduce((sum, o) => sum + (o.amount || 0), 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>
            Manage and track all customer orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-10">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No orders found</p>
                <p className="text-muted-foreground">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-6 rounded-lg border border-border bg-surface-light hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-surface-medium rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {String(order.customers?.name || "Unknown Customer")}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="font-medium text-foreground">
                        ₹{Number(order.amount) || 0}
                      </p>

                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>

                    <div className="text-center">
                      <p className="font-medium text-foreground">
                        {Array.isArray(order.items) ? order.items.length : 0}
                      </p>

                      <p className="text-sm text-muted-foreground">Items</p>
                    </div>

                    <div className="flex flex-col gap-1">
                      {getStatusBadge(order.status)}
                      {getPaymentMethodBadge(order.payment_method)}
                    </div>

                    <div className="flex flex-col gap-1">
                      {getPaymentStatusBadge(order.payment_status)}
                      {order.production_status && (
                        <Badge variant="outline" className="text-xs">
                          {order.production_status}
                        </Badge>
                      )}
                    </div>

                    <div className="flex space-x-2">
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
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center justify-between">
                  <span>Order #{selectedOrder.id.slice(0, 8)}</span>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedOrder.status)}
                    {getPaymentMethodBadge(selectedOrder.payment_method)}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Name:</span>
                      <span>{selectedOrder.customers?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span className="text-sm">
                        {selectedOrder.customers?.email || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Phone:</span>
                      <span>{selectedOrder.customers?.phone || "N/A"}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Payment:</span>
                      {getPaymentMethodBadge(selectedOrder.payment_method)}
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Payment Status:</span>
                      {getPaymentStatusBadge(selectedOrder.payment_status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-bold text-lg">
                        ₹{selectedOrder.amount}
                      </span>
                    </div>
                    {selectedOrder.transaction_id && (
                      <div className="flex justify-between">
                        <span className="font-medium">Transaction ID:</span>
                        <span className="text-sm font-mono">
                          {selectedOrder.transaction_id}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Shipping Info */}
                {selectedOrder.shipping_info && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
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
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Delivery Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedOrder.delivery_info.estimated_date && (
                          <div>
                            <span className="font-medium text-sm">
                              Estimated Date:
                            </span>
                            <p className="text-sm">
                              {selectedOrder.delivery_info.estimated_date}
                            </p>
                          </div>
                        )}
                        {selectedOrder.delivery_info.estimated_time && (
                          <div>
                            <span className="font-medium text-sm">
                              Estimated Time:
                            </span>
                            <p className="text-sm">
                              {selectedOrder.delivery_info.estimated_time}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Order Notes */}
                {selectedOrder.order_notes && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Order Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm bg-muted p-3 rounded">
                        {selectedOrder.order_notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Items */}
                {selectedOrder.items && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Order Items</CardTitle>
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
        <DialogContent className="max-w-2xl">
          {editingOrder && (
            <>
              <DialogHeader>
                <DialogTitle>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Order Status</Label>
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
                    <Label htmlFor="payment_status">Payment Status</Label>
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
                  <Label htmlFor="production_status">Production Status</Label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="delivery_date">Delivery Date</Label>
                    <Input
                      name="delivery_date"
                      type="date"
                      defaultValue={
                        editingOrder.delivery_info?.estimated_date || ""
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="delivery_time">Delivery Time</Label>
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
                  <Label htmlFor="order_notes">Order Notes</Label>
                  <Textarea
                    name="order_notes"
                    placeholder="Add notes about this order..."
                    defaultValue={editingOrder.order_notes || ""}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order #
              {deleteOrder?.id.slice(0, 8)}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
