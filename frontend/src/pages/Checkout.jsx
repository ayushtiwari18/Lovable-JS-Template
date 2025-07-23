import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

// At the top of your Checkout.jsx
const PHONEPE_PAY_URL =
  process.env.NODE_ENV === "production"
    ? "https://shrifal-handicrafts.onrender.com/pay" // Replace with your actual Render URL
    : "http://localhost:3000/pay";


const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const payFormRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Add useEffect to redirect if cart becomes empty
  useEffect(() => {
    if (!loading && items.length === 0) {
      console.log("Cart is empty, redirecting to cart page...");
      navigate("/cart");
      return;
    }
  }, [items.length, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data: authUser } = await supabase.auth.getUser();
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const address = customer?.address || {};
      setFormData({
        firstName: customer?.name?.split(" ")[0] || "",
        lastName: customer?.name?.split(" ").slice(1).join(" ") || "",
        email: authUser.user?.email || customer?.email || "",
        phone: authUser.user?.phone || customer?.phone || "",
        address: address.street || "",
        city: address.city || "",
        state: address.state || "",
        zipCode: address.zipCode || "",
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const required = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zipCode",
    ];
    for (const field of required) {
      if (!formData[field].trim()) {
        toast({
          title: "Validation Error",
          description: `Please fill in ${field
            .replace(/([A-Z])/g, " $1")
            .toLowerCase()}`,
          variant: "destructive",
        });
        return false;
      }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ""))) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const createOrder = async (paymentMethod = "PayNow") => {
    try {
      console.log("=== CREATING ORDER ===");
      console.log("User ID:", user.id);

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (customerError) {
        console.error("❌ Customer lookup failed:", customerError);
        throw new Error("Customer lookup failed: " + customerError.message);
      }

      if (!customer || !customer.id) {
        console.error("❌ No customer ID found");
        throw new Error("Customer profile not found");
      }

      const subtotal = getTotalPrice();
      const tax = subtotal * 0.08;
      const total = subtotal + tax;
      const totalPaise = Math.round(total * 100);

      const orderData = {
        user_id: user.id,
        customer_id: customer.id,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || "",
          customization: item.customization || {},
        })),
        shipping_info: {
          firstName: formData.firstName || "",
          lastName: formData.lastName || "",
          phone: formData.phone || "",
          address: formData.address || "",
          city: formData.city || "",
          state: formData.state || "",
          zipCode: formData.zipCode || "",
        },
        delivery_info: {
          method: "standard",
          estimatedDays: "3-5",
        },
        total_price: totalPaise,
        amount: total,
        status: "pending",
        payment_status: "pending",
        payment_method: paymentMethod || "PayNow",
        upi_reference: null,
        transaction_id: null,
        order_notes: null,
      };

      // Insert with immediate verification
      const { data, error } = await supabase
        .from("orders")
        .insert([orderData])
        .select("*")
        .single();

      if (error) {
        console.error("💥 INSERT ERROR:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      // VERIFY the order was created by fetching it back
      const { data: verifyOrder, error: verifyError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", data.id)
        .single();

      if (verifyError || !verifyOrder) {
        console.error("❌ Order verification failed:", verifyError);
        throw new Error("Order creation verification failed");
      }

      console.log("✅ Order created and verified:", verifyOrder);
      return verifyOrder;
    } catch (error) {
      console.error("🚨 CREATE ORDER FAILED:", error);
      throw error;
    }
  };

  // COD Payment Handler - FIXED with proper async/await
  const handleCODPayment = async () => {
    if (!validateForm()) return;
    setProcessingPayment(true);

    try {
      const order = await createOrder("COD");

      // Clear cart FIRST and AWAIT it
      console.log("🧹 Clearing cart after successful COD order...");
      await clearCart();
      console.log("✅ Cart cleared successfully");

      toast({
        title: "Order Placed Successfully!",
        description: `Order #${order.id.slice(
          0,
          8
        )} has been placed. You'll pay on delivery.`,
      });

      // Navigate after cart is cleared
      navigate(`/order/${order.id}`);
    } catch (error) {
      console.error("COD Payment error:", error);
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  // PayNow Handler - Clear cart after PhonePe redirect
  const handlePayNow = async () => {
    if (!validateForm()) return;
    setProcessingPayment(true);

    try {
      // Store cart data before clearing (needed for PhonePe form)
      const cartItemsForPhonePe = items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        customization: item.customization || {},
      }));

      // Create order in database first
      const order = await createOrder("PayNow");

      // Add a small delay to ensure database consistency
      // await new Promise((resolve) => setTimeout(resolve, 1000));

      // Clear cart immediately after order creation
      console.log("🧹 Clearing cart before PhonePe redirect...");
      await clearCart();
      console.log("✅ Cart cleared successfully");

      const totalAmount = Math.round(getTotalPrice() * 1.08 * 100);

      // Set form values for PhonePe using stored cart data
      document.getElementById("pp-order-id").value = order.id;
      document.getElementById("pp-amount").value = totalAmount;
      document.getElementById("pp-customer-email").value = formData.email;
      document.getElementById("pp-customer-phone").value = formData.phone;
      document.getElementById(
        "pp-customer-name"
      ).value = `${formData.firstName} ${formData.lastName}`;

      // Use stored cart data since cart is now cleared
      document.getElementById("pp-cart-items").value =
        JSON.stringify(cartItemsForPhonePe);

      document.getElementById("pp-shipping-info").value = JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      });

      // Submit to PhonePe
      payFormRef.current.submit();
    } catch (error) {
      console.error("PayNow failed:", error);
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
      setProcessingPayment(false);
    }
  };

  // Early return if cart is empty
  if (items.length === 0 && !loading) {
    return null; // Will be redirected by useEffect
  }

  if (loading) {
    return (
      <Layout>
        <div className="py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-2xl font-semibold">Loading checkout...</h1>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <Layout>
      <div className="py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rest of your existing JSX remains the same */}
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        required
                        value={formData.zipCode}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <Button
                    onClick={handlePayNow}
                    disabled={processingPayment}
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    {processingPayment
                      ? "Processing..."
                      : `Pay Now - ₹${total.toFixed(2)}`}
                  </Button>
                  <div className="text-center text-gray-500">or</div>
                  <Button
                    onClick={handleCODPayment}
                    disabled={processingPayment}
                    variant="outline"
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    {processingPayment ? "Processing..." : "Cash on Delivery"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Pay Now: Secure online payment via PhonePe
                  <br />
                  COD: Pay when your order is delivered
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-6 h-fit">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${JSON.stringify(item.customization)}`}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg mr-3"
                        onError={(e) => {
                          e.target.src = "/placeholder-image.jpg";
                        }}
                      />
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 mb-6 pb-6 border-b">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">₹{tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold text-primary">
                  ₹{total.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Choose your preferred payment method above
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* HIDDEN FORM for PhonePe payment */}
      <form
        ref={payFormRef}
        id="phonepe-pay-form"
        method="POST"
        action={PHONEPE_PAY_URL}
        style={{ display: "none" }}
      >
        <input type="hidden" id="pp-order-id" name="orderId" />
        <input type="hidden" id="pp-amount" name="amount" />
        <input type="hidden" id="pp-customer-email" name="customerEmail" />
        <input type="hidden" id="pp-customer-phone" name="customerPhone" />
        <input type="hidden" id="pp-customer-name" name="customerName" />
        <input type="hidden" id="pp-cart-items" name="cartItems" />
        <input type="hidden" id="pp-shipping-info" name="shippingInfo" />
      </form>
    </Layout>
  );
};

export default Checkout;
