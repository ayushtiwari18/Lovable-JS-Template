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
  const [isEditing, setIsEditing] = useState(false);

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

  useEffect(() => {
    if (user?.id) {
      loadCustomerData();
    }
  }, [user?.id]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const { data: existingCustomer, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (existingCustomer) {
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
        // Don't prefill anything to avoid accidental submission
        setFormData({
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
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load customer data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      return toast({
        title: "Validation Error",
        description: "Name and email are required.",
        variant: "destructive",
      });
    }

    try {
      setSaving(true);

      const cleanAddress = Object.fromEntries(
        Object.entries(formData.address).filter(([_, v]) => v.trim() !== "")
      );

      const customerData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        address: Object.keys(cleanAddress).length > 0 ? cleanAddress : null,
        bio: formData.bio.trim() || null,
        user_id: user.id,
        profile_completed: true,
      };

      let result;

      if (customerId) {
        result = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", customerId)
          .eq("user_id", user.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("customers")
          .insert([customerData])
          .select()
          .single();
        if (result.data) setCustomerId(result.data.id);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success!",
        description: "Details updated successfully.",
      });

      // ✅ Update profile_completed in auth metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { profile_completed: true },
      });

      if (metadataError) {
        console.error("Failed to update auth metadata:", metadataError);
        toast({
          title: "Warning",
          description: "Details saved but profile status not updated in auth.",
          variant: "destructive",
        });
      } else {
        console.log("✅ profile_completed metadata set to true");
      }

      await loadCustomerData();
      setIsEditing(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Save failed.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
    if (!customerId) {
      // Only insert if user filled name and bio (example condition)
      if (!formData.name || !formData.bio) {
        toast({
          title: "Incomplete Details",
          description: "Please fill required fields to create a profile.",
          variant: "destructive",
        });
        return;
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    loadCustomerData();
  };

  const displayView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {formData.name ? (
          <>
            <p>
              <strong>Name:</strong> {formData.name}
            </p>
            <p>
              <strong>Email:</strong> {formData.email || "—"}
            </p>
            <p>
              <strong>Phone:</strong> {formData.phone || "—"}
            </p>
            <p>
              <strong>Bio:</strong> {formData.bio || "—"}
            </p>
            <p>
              <strong>Street:</strong> {formData.address.street || "—"}
            </p>
            <p>
              <strong>City:</strong> {formData.address.city || "—"}
            </p>
            <p>
              <strong>State:</strong> {formData.address.state || "—"}
            </p>
            <p>
              <strong>ZIP Code:</strong> {formData.address.zipCode || "—"}
            </p>
            <p>
              <strong>Country:</strong> {formData.address.country || "—"}
            </p>
          </>
        ) : (
          <p className="text-gray-500">No personal details added yet.</p>
        )}
        <Button className="mt-4" onClick={() => setIsEditing(true)}>
          {formData.name ? "Edit Details" : "Add Details"}
        </Button>
      </CardContent>
    </Card>
  );

  const displayForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
          </div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
          />
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange("bio", e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="street">Street Address</Label>
          <Input
            id="street"
            value={formData.address.street}
            onChange={(e) => handleAddressChange("street", e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.address.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.address.state}
                onChange={(e) => handleAddressChange("state", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={formData.address.zipCode}
                onChange={(e) => handleAddressChange("zipCode", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.address.country}
                onChange={(e) => handleAddressChange("country", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button type="submit" disabled={saving}>
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
        <Button
          type="button"
          variant="outline"
          onClick={handleCancelEdit}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Personal Details</h1>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2 text-lg">Loading your details...</span>
            </div>
          ) : isEditing ? (
            displayForm()
          ) : (
            displayView()
          )}
        </div>
      </div>
    </Layout>
  );
}
