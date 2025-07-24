import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  UserCheck,
  UserX,
  IndianRupee,
  ShoppingCart,
  RefreshCw,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from "lucide-react";
import { CustomerForm } from "../forms/CustomerForm";
import { useToast } from "@/hooks/use-toast";

export function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteCustomer, setDeleteCustomer] = useState(null);
  const { toast } = useToast();

  // Fetch customers and orders from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (customersError) throw customersError;

      // Fetch orders to calculate customer stats
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("customer_id, amount, payment_status")
        .eq("payment_status", "completed");

      if (ordersError) throw ordersError;

      setCustomers(customersData || []);
      setOrders(ordersData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error fetching customers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate customer statistics
  const getCustomerStats = (customerId) => {
    const customerOrders = orders.filter(
      (order) => order.customer_id === customerId
    );
    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce(
      (sum, order) => sum + (parseFloat(order.amount) || 0),
      0
    );

    return {
      orders: totalOrders,
      spent: totalSpent,
      status: totalOrders > 0 ? "active" : "inactive",
    };
  };

  // Create customer handler
  const handleCreate = async (data) => {
    try {
      const { error } = await supabase.from("customers").insert([data]);

      if (error) throw error;

      toast({ title: "Customer created successfully" });
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Error creating customer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Edit customer handler
  const handleEdit = async (data) => {
    if (!editingCustomer) return;

    try {
      const { error } = await supabase
        .from("customers")
        .update(data)
        .eq("id", editingCustomer.id);

      if (error) throw error;

      toast({ title: "Customer updated successfully" });
      setEditingCustomer(null);
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({
        title: "Error updating customer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete customer handler
  const handleDelete = async () => {
    if (!deleteCustomer) return;

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", deleteCustomer.id);

      if (error) throw error;

      toast({ title: "Customer deleted successfully" });
      setDeleteCustomer(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error deleting customer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // View customer details
  const viewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = searchTerm
      ? customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      : true;

    const stats = getCustomerStats(customer.id);
    const matchesStatus =
      statusFilter === "all" || stats.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate overall stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(
    (c) => getCustomerStats(c.id).orders > 0
  ).length;
  const inactiveCustomers = totalCustomers - activeCustomers;
  const completedProfiles = customers.filter((c) => c.profile_completed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="text-lg font-medium">Loading customers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Customers
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your customer relationships and data
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Customers
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground">Have placed orders</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <UserX className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveCustomers}</div>
            <p className="text-xs text-muted-foreground">No orders yet</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Complete Profiles
            </CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProfiles}</div>
            <p className="text-xs text-muted-foreground">Profile completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="min-w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="active">Active Customers</SelectItem>
                  <SelectItem value="inactive">Inactive Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || statusFilter !== "all") && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Customer Directory</span>
            <Badge variant="outline">
              {filteredCustomers.length} of {totalCustomers} customers
            </Badge>
          </CardTitle>
          <CardDescription>
            {statusFilter !== "all"
              ? `Showing ${statusFilter} customers`
              : "All registered customers"}
            {searchTerm && ` matching "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No customers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Get started by adding your first customer"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Customer
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => {
                const stats = getCustomerStats(customer.id);
                return (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-6 rounded-lg border border-border bg-surface-light hover:bg-muted/30 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                          {customer.name
                            ? customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            : "CU"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {customer.name || "No Name"}
                          </p>
                          {customer.profile_completed && (
                            <Badge variant="outline" className="text-xs">
                              Profile Complete
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined{" "}
                          {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium text-foreground">
                            {stats.orders}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">Orders</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium text-foreground">
                            {stats.spent.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Total Spent
                        </p>
                      </div>

                      <Badge
                        className={
                          stats.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                        }
                      >
                        {stats.status}
                      </Badge>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewCustomer(customer)}
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCustomer(customer);
                            setIsFormOpen(true);
                          }}
                          className="hover:bg-green-50 hover:border-green-300"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-red-50 hover:border-red-300"
                          onClick={() => setDeleteCustomer(customer)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedCustomer.name
                        ? selectedCustomer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : "CU"}
                    </AvatarFallback>
                  </Avatar>
                  {selectedCustomer.name || "Customer Details"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.name || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.email || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.phone || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Profile Status
                        </label>
                        <Badge
                          variant={
                            selectedCustomer.profile_completed
                              ? "default"
                              : "secondary"
                          }
                        >
                          {selectedCustomer.profile_completed
                            ? "Complete"
                            : "Incomplete"}
                        </Badge>
                      </div>
                    </div>

                    {selectedCustomer.bio && (
                      <div>
                        <label className="text-sm font-medium">Bio</label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedCustomer.bio}
                        </p>
                      </div>
                    )}

                    {selectedCustomer.address && (
                      <div>
                        <label className="text-sm font-medium">Address</label>
                        <div className="text-sm text-muted-foreground mt-1 bg-muted p-3 rounded">
                          <pre>
                            {JSON.stringify(selectedCustomer.address, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium">
                        Member Since
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(
                          selectedCustomer.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Purchase History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold">
                          {getCustomerStats(selectedCustomer.id).orders}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Orders
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold flex items-center justify-center gap-1">
                          <IndianRupee className="h-5 w-5" />
                          {getCustomerStats(selectedCustomer.id).spent.toFixed(
                            2
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Spent
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Customer Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingCustomer(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <CustomerForm
            customer={editingCustomer}
            onSubmit={editingCustomer ? handleEdit : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingCustomer(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteCustomer}
        onOpenChange={() => setDeleteCustomer(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {deleteCustomer?.name || "this customer"}"? This action cannot be
              undone and will remove all customer data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
