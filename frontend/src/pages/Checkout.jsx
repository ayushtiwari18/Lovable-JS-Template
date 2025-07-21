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

const PHONEPE_PAY_URL = "http://localhost:3000/pay";

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

  useEffect(() => {
    if (user) {
      fetchUserProfile();
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

  // COD: Insert order in DB immediately with correct user_id and customer_id
  const handleCODPayment = async () => {
    if (!validateForm()) return;
    setProcessingPayment(true);
    try {
      // 1. Fetch customer's row for user_id
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (customerError || !customer) {
        toast({
          title: "Profile Error",
          description:
            "Profile missing. Please complete your profile in Account settings.",
          variant: "destructive",
        });
        setProcessingPayment(false);
        return;
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
          image: item.image,
          customization: item.customization || {},
        })),
        total_price: totalPaise,
        amount: total,
        status: "pending",
        payment_status: "pending",
        shipping_info: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        delivery_info: {
          method: "standard",
          estimatedDays: 3 - 5,
        },
        payment_method: "COD",
        upi_reference: "",
        transaction_id: "",
      };

      const { data, error } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (error) throw new Error("Order creation failed: " + error.message);

      toast({
        title: "Order Placed Successfully!",
        description: `Order #${data.id.slice(
          0,
          8
        )} has been placed. You'll pay on delivery.`,
      });
      clearCart();
      navigate(`/order/${data.id}`);
    } catch (error) {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  // PG/PhonePe: send info to backend, not create order here
  const handlePayNow = async () => {
    if (!validateForm()) return;
    setProcessingPayment(true);
    try {
      document.getElementById("pp-cart-items").value = JSON.stringify(
        items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          customization: item.customization || {},
        }))
      );
      document.getElementById("pp-shipping-info").value = JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      });
      document.getElementById("pp-customer-email").value = formData.email;
      document.getElementById("pp-customer-phone").value = formData.phone;
      document.getElementById(
        "pp-customer-name"
      ).value = `${formData.firstName} ${formData.lastName}`;
      document.getElementById("pp-payment-method").value = "PayNow";
      document.getElementById("pp-total-amount").value = Math.round(
        getTotalPrice() * 1.08 * 100
      );

      payFormRef.current.submit();
    } catch (err) {
      toast({
        title: "Payment Error",
        description: err.message,
        variant: "destructive",
      });
      setProcessingPayment(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
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
            {/* Checkout Form */}
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
        <input type="hidden" id="pp-cart-items" name="cartItems" />
        <input type="hidden" id="pp-shipping-info" name="shippingInfo" />
        <input type="hidden" id="pp-customer-email" name="customerEmail" />
        <input type="hidden" id="pp-customer-phone" name="customerPhone" />
        <input type="hidden" id="pp-customer-name" name="customerName" />
        <input type="hidden" id="pp-payment-method" name="paymentMethod" />
        <input type="hidden" id="pp-total-amount" name="totalAmount" />
      </form>
    </Layout>
  );
};

export default Checkout;
