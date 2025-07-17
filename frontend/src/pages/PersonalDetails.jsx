import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { User, MapPin, Save, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function PersonalDetails() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    bio: "",
  });

  // Load customer data on component mount
  useEffect(() => {
    if (user?.id) {
      loadCustomerData();
    }
  }, [user?.id]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);

      // Check if user is authenticated
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // First, try to find existing customer record by user_id instead of email
      const { data: existingCustomer, error: fetchError } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully

      if (fetchError) {
        console.error("Error fetching customer:", fetchError);
        throw fetchError;
      }

      if (existingCustomer) {
        // Customer exists, populate form with existing data
        setCustomerId(existingCustomer.id);
        setFormData({
          name: existingCustomer.name || "",
          email: existingCustomer.email || "",
          phone: existingCustomer.phone || "",
          address: existingCustomer.address || {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },
          bio: existingCustomer.bio || "",
        });
      } else {
        // New customer, populate with auth user data
        setFormData((prev) => ({
          ...prev,
          name:
            user?.user_metadata?.full_name || user?.user_metadata?.name || "",
          email: user?.email || "",
        }));
      }
    } catch (error) {
      console.error("Error loading customer data:", error);
      toast({
        title: "Error",
        description: "Failed to load customer data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Name and email are required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to save your details.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Clean up address data - remove empty fields
      const cleanAddress = Object.fromEntries(
        Object.entries(formData.address).filter(
          ([_, value]) => value.trim() !== ""
        )
      );

      const customerData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        address: Object.keys(cleanAddress).length > 0 ? cleanAddress : null,
        bio: formData.bio.trim() || null,
        user_id: user.id, // This is crucial for RLS policies
      };

      let result;

      if (customerId) {
        // Update existing customer
        result = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", customerId)
          .eq("user_id", user.id) // Additional security check
          .select()
          .single();
      } else {
        // Create new customer
        result = await supabase
          .from("customers")
          .insert([customerData])
          .select()
          .single();

        if (result.data) {
          setCustomerId(result.data.id);
        }
      }

      if (result.error) {
        console.error("Supabase error response:", result.error);

        // Handle specific error cases
        if (result.error.code === "42501") {
          throw new Error(
            "Permission denied. Please check your authentication status."
          );
        } else if (result.error.code === "23505") {
          throw new Error(
            "Email already exists. Please use a different email."
          );
        } else {
          throw result.error;
        }
      }

      toast({
        title: "Success!",
        description: "Your personal details have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving customer data:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to save your details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2 text-lg">Loading your details...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Personal Details</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.address.street}
                    onChange={(e) =>
                      handleAddressChange("street", e.target.value)
                    }
                    placeholder="Enter your street address"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                      onChange={(e) =>
                        handleAddressChange("city", e.target.value)
                      }
                      placeholder="Enter your city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.address.state}
                      onChange={(e) =>
                        handleAddressChange("state", e.target.value)
                      }
                      placeholder="Enter your state"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.address.zipCode}
                      onChange={(e) =>
                        handleAddressChange("zipCode", e.target.value)
                      }
                      placeholder="Enter your ZIP code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.address.country}
                      onChange={(e) =>
                        handleAddressChange("country", e.target.value)
                      }
                      placeholder="Enter your country"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
