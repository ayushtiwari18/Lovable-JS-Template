import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

const stats = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    changeType: "positive",
    icon: DollarSign,
  },
  {
    title: "Orders",
    value: "2,350",
    change: "+180.1%",
    changeType: "positive",
    icon: ShoppingCart,
  },
  {
    title: "Customers",
    value: "1,234",
    change: "+19%",
    changeType: "positive",
    icon: Users,
  },
  {
    title: "Products",
    value: "573",
    change: "+201",
    changeType: "positive",
    icon: Package,
  },
];

const recentOrders = [
  {
    id: "#ORD-001",
    customer: "John Doe",
    amount: "$129.99",
    status: "completed",
    date: "2024-01-20",
  },
  {
    id: "#ORD-002",
    customer: "Jane Smith",
    amount: "$89.50",
    status: "pending",
    date: "2024-01-20",
  },
  {
    id: "#ORD-003",
    customer: "Bob Johnson",
    amount: "$199.99",
    status: "shipped",
    date: "2024-01-19",
  },
  {
    id: "#ORD-004",
    customer: "Alice Brown",
    amount: "$79.99",
    status: "completed",
    date: "2024-01-19",
  },
  {
    id: "#ORD-005",
    customer: "Charlie Wilson",
    amount: "$159.99",
    status: "processing",
    date: "2024-01-18",
  },
];

const getStatusIcon = (status) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "processing":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "shipped":
      return <TrendingUp className="h-4 w-4 text-blue-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "shipped":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    default:
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
  }
};

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last
                month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Recent Orders</CardTitle>
          <CardDescription>
            You have {recentOrders.length} orders this week.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface-light"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="font-medium text-foreground">{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer}
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
                      {order.amount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
