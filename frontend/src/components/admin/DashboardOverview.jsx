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
  TrendingUp,
  IndianRupee,
  ShoppingCart,
  Users,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  RefreshCw,
  Truck,
  XCircle,
  Banknote,
  CreditCard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";

const getStatusIcon = (status) => {
  switch (status) {
    case "delivered":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "processing":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "confirmed":
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case "shipped":
      return <Truck className="h-4 w-4 text-indigo-500" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "processing":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
    case "confirmed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400";
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

export function DashboardOverview({ dashboardData }) {
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // If dashboardData is provided, use it; otherwise fetch data directly
  const {
    totalOrders = 0,
    recentOrders: recentOrdersCount = 0,
    pendingOrders = 0,
    totalMessages = 0,
    unreadMessages = 0,
    totalRevenue = 0,
    codOrders = 0,
    payNowOrders = 0,
    loading: dashboardLoading = false,
    refreshData,
  } = dashboardData || {};

  // Fetch recent orders and messages for display
  const fetchRecentData = async () => {
    try {
      setLoading(true);

      // Fetch recent orders with customer info
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          *,
          customers (
            name,
            email
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(5);

      if (ordersError) throw ordersError;

      // Fetch recent messages
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (messagesError) throw messagesError;

      setRecentOrders(orders || []);
      setRecentMessages(messages || []);
    } catch (error) {
      console.error("Error fetching recent data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentData();
  }, []);

  // Calculate growth percentages (mock data - you can implement real calculations)
  const calculateGrowth = (current, type) => {
    // This is a simplified growth calculation
    // You might want to store previous month's data to calculate real growth
    const mockGrowthRates = {
      revenue: "+15.2%",
      orders: "+23.1%",
      customers: "+12.5%",
      messages: "+8.3%",
    };
    return mockGrowthRates[type] || "+0%";
  };

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      change: calculateGrowth(totalRevenue, "revenue"),
      changeType: "positive",
      icon: IndianRupee,
    },
    {
      title: "Orders",
      value: totalOrders.toString(),
      change: calculateGrowth(totalOrders, "orders"),
      changeType: "positive",
      icon: ShoppingCart,
    },
    {
      title: "Messages",
      value: totalMessages.toString(),
      change: calculateGrowth(totalMessages, "messages"),
      changeType: "positive",
      icon: MessageSquare,
    },
    {
      title: "Pending Orders",
      value: pendingOrders.toString(),
      change: `${unreadMessages} new messages`,
      changeType: "neutral",
      icon: Clock,
    },
  ];

  if (dashboardLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="text-lg font-medium">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome back! Here's what's happening with Shrifal Handicrafts
            today.
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="bg-card border-border hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-card-foreground mb-2">
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground">
                <span
                  className={
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : "text-blue-600"
                  }
                >
                  {stat.change}
                </span>{" "}
                {stat.changeType === "positive" ? "from last month" : ""}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Methods Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Breakdown of payment preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-light">
                <div className="flex items-center gap-3">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Cash on Delivery</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{codOrders}</div>
                  <div className="text-xs text-muted-foreground">orders</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-light">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">PayNow</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{payNowOrders}</div>
                  <div className="text-xs text-muted-foreground">orders</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Quick Actions
            </CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                asChild
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2"
              >
                <Link to="/admin/orders">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-sm">View Orders</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2"
              >
                <Link to="/admin/messages">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-sm">Messages</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2"
              >
                <Link to="/admin/products">
                  <Package className="h-5 w-5" />
                  <span className="text-sm">Products</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-auto p-4 flex flex-col gap-2"
              >
                <Link to="/admin/customers">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Customers</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Messages */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-card-foreground">
                Recent Orders
              </CardTitle>
              <CardDescription>
                Latest {recentOrders.length} orders from your store
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent orders</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface-light hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(order.status)}
                      <div>
                        <p className="font-medium text-foreground">
                          #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.customers?.name || "Unknown Customer"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge
                        className={getStatusColor(order.status)}
                        variant="secondary"
                      >
                        {order.status}
                      </Badge>
                      <div className="text-right">
                        <p className="font-medium text-foreground">
                          ₹{order.amount}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-card-foreground">
                New Messages
              </CardTitle>
              <CardDescription>
                {unreadMessages} unread messages from customers
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/messages">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No new messages</p>
                </div>
              ) : (
                recentMessages.map((message) => (
                  <div
                    key={message.id}
                    className="p-4 rounded-lg border border-border bg-surface-light hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-foreground">
                        {message.subject || "No Subject"}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        New
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      From: {message.name} ({message.email})
                    </p>
                    <p className="text-sm text-foreground line-clamp-2">
                      {message.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
