import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { Eye, Package, Plus, Edit, Trash2 } from "lucide-react";
import { OrderForm } from "../forms/OrderForm";
import { useToast } from "@/hooks/use-toast";

const initialOrders = [
  {
    id: 1001,
    customer: "John Doe",
    total: 129.99,
    status: "delivered",
    date: "2024-01-20",
    items: 3,
  },
  {
    id: 1002,
    customer: "Jane Smith",
    total: 89.5,
    status: "pending",
    date: "2024-01-20",
    items: 1,
  },
  {
    id: 1003,
    customer: "Bob Johnson",
    total: 199.99,
    status: "shipped",
    date: "2024-01-19",
    items: 2,
  },
  {
    id: 1004,
    customer: "Alice Brown",
    total: 79.99,
    status: "delivered",
    date: "2024-01-19",
    items: 1,
  },
  {
    id: 1005,
    customer: "Charlie Wilson",
    total: 159.99,
    status: "processing",
    date: "2024-01-18",
    items: 4,
  },
];

export function OrdersPage() {
  const [orders, setOrders] = useState(initialOrders);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState();
  const [deleteOrder, setDeleteOrder] = useState();
  const { toast } = useToast();

  const handleCreate = (data) => {
    const newOrder = {
      ...data,
      id: Math.max(...orders.map((o) => o.id)) + 1,
    };
    setOrders([...orders, newOrder]);
    setIsFormOpen(false);
    toast({ title: "Order created successfully" });
  };

  const handleEdit = (data) => {
    if (editingOrder) {
      setOrders(
        orders.map((o) => (o.id === editingOrder.id ? { ...o, ...data } : o))
      );
      setEditingOrder(undefined);
      toast({ title: "Order updated successfully" });
    }
  };

  const handleDelete = () => {
    if (deleteOrder) {
      setOrders(orders.filter((o) => o.id !== deleteOrder.id));
      setDeleteOrder(undefined);
      toast({ title: "Order deleted successfully" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders and shipments
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Order
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Recent Orders</CardTitle>
          <CardDescription>
            You have {orders.length} orders to review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface-light"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-surface-medium rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">#{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="font-medium text-foreground">
                      ${order.total}
                    </p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{order.items}</p>
                    <p className="text-sm text-muted-foreground">Items</p>
                  </div>
                  <Badge
                    className={
                      order.status === "delivered"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : order.status === "pending"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                        : order.status === "processing"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        : "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                    }
                  >
                    {order.status}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingOrder(order)}
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
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isFormOpen || !!editingOrder}
        onOpenChange={() => {
          setIsFormOpen(false);
          setEditingOrder(undefined);
        }}
      >
        <DialogContent>
          <OrderForm
            order={editingOrder}
            onSubmit={editingOrder ? handleEdit : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingOrder(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteOrder}
        onOpenChange={() => setDeleteOrder(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order #{deleteOrder?.id}? This
              action cannot be undone.
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
