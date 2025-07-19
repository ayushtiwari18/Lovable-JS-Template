import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Eye, Plus, Edit, Trash2 } from "lucide-react";
import { CustomerForm } from "../forms/CustomerForm";
import { useToast } from "@/hooks/use-toast";

const initialCustomers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    orders: 12,
    spent: 1234.5,
    status: "active",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    orders: 8,
    spent: 890.25,
    status: "active",
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob@example.com",
    orders: 15,
    spent: 2100.75,
    status: "active",
  },
  {
    id: 4,
    name: "Alice Brown",
    email: "alice@example.com",
    orders: 3,
    spent: 320.0,
    status: "inactive",
  },
  {
    id: 5,
    name: "Charlie Wilson",
    email: "charlie@example.com",
    orders: 22,
    spent: 3450.8,
    status: "active",
  },
];

export function CustomersPage() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState();
  const [deleteCustomer, setDeleteCustomer] = useState();
  const { toast } = useToast();

  const handleCreate = (data) => {
    const newCustomer = {
      ...data,
      id: Math.max(...customers.map((c) => c.id)) + 1,
      orders: 0,
      spent: 0,
    };
    setCustomers([...customers, newCustomer]);
    setIsFormOpen(false);
    toast({ title: "Customer created successfully" });
  };

  const handleEdit = (data) => {
    if (editingCustomer) {
      setCustomers(
        customers.map((c) =>
          c.id === editingCustomer.id ? { ...c, ...data } : c
        )
      );
      setEditingCustomer(undefined);
      toast({ title: "Customer updated successfully" });
    }
  };

  const handleDelete = () => {
    if (deleteCustomer) {
      setCustomers(customers.filter((c) => c.id !== deleteCustomer.id));
      setDeleteCustomer(undefined);
      toast({ title: "Customer deleted successfully" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Customer List</CardTitle>
          <CardDescription>
            You have {customers.length} registered customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface-light"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {customer.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {customer.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="font-medium text-foreground">
                      {customer.orders}
                    </p>
                    <p className="text-sm text-muted-foreground">Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">
                      ${customer.spent}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                  </div>
                  <Badge
                    className={
                      customer.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                    }
                  >
                    {customer.status}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingCustomer(customer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteCustomer(customer)}
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
        open={isFormOpen || !!editingCustomer}
        onOpenChange={() => {
          setIsFormOpen(false);
          setEditingCustomer(undefined);
        }}
      >
        <DialogContent>
          <CustomerForm
            customer={editingCustomer}
            onSubmit={editingCustomer ? handleEdit : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingCustomer(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteCustomer}
        onOpenChange={() => setDeleteCustomer(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCustomer?.name}"? This
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
