import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  MapPin,
  Save,
  Loader2,
  Edit3,
  Phone,
  Mail,
  FileText,
  Home,
  Globe,
  X,
  Check,
} from "lucide-react";
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
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    loadCustomerData();
  };

  const getProfileCompleteness = () => {
    const fields = [
      formData.name,
      formData.email,
      formData.phone,
      formData.bio,
      formData.address.street,
      formData.address.city,
      formData.address.state,
      formData.address.zipCode,
      formData.address.country,
    ];
    const filledFields = fields.filter(
      (field) => field && field.trim() !== ""
    ).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const displayView = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Card */}
      <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Personal Details
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Manage your profile information
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs sm:text-sm text-gray-600">
                Profile Complete
              </div>
              <Badge
                variant={
                  getProfileCompleteness() > 80 ? "default" : "secondary"
                }
                className="text-xs sm:text-sm px-2 sm:px-3 py-1"
              >
                {getProfileCompleteness()}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {formData.name ? (
        <div className="grid gap-4 sm:gap-6">
          {/* Personal Information Card */}
          <Card className="border border-gray-200 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 sm:gap-6">
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">
                      Full Name
                    </p>
                    <p className="font-medium text-sm sm:text-base truncate">
                      {formData.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">
                      Email Address
                    </p>
                    <p className="font-medium text-sm sm:text-base truncate">
                      {formData.email || "Not provided"}
                    </p>
                  </div>
                </div>

                {formData.phone && (
                  <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">
                        Phone Number
                      </p>
                      <p className="font-medium text-sm sm:text-base">
                        {formData.phone}
                      </p>
                    </div>
                  </div>
                )}

                {formData.bio && (
                  <div className="flex gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Bio</p>
                      <p className="font-medium text-sm sm:text-base leading-relaxed">
                        {formData.bio}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address Information Card */}
          {(formData.address.street ||
            formData.address.city ||
            formData.address.state ||
            formData.address.zipCode ||
            formData.address.country) && (
            <Card className="border border-gray-200 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:gap-4">
                  {formData.address.street && (
                    <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <Home className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Street Address
                        </p>
                        <p className="font-medium text-sm sm:text-base">
                          {formData.address.street}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {formData.address.city && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">City</p>
                        <p className="font-medium text-sm">
                          {formData.address.city}
                        </p>
                      </div>
                    )}
                    {formData.address.state && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">State</p>
                        <p className="font-medium text-sm">
                          {formData.address.state}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {formData.address.zipCode && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">ZIP Code</p>
                        <p className="font-medium text-sm">
                          {formData.address.zipCode}
                        </p>
                      </div>
                    )}
                    {formData.address.country && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Globe className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="text-xs text-gray-600">Country</p>
                          <p className="font-medium text-sm">
                            {formData.address.country}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 sm:p-12 text-center">
            <User className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No Personal Details
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
              Add your personal information to complete your profile and enhance
              your shopping experience.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={() => setIsEditing(true)}
          size="lg"
          className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
        >
          <Edit3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          {formData.name ? "Edit Details" : "Add Details"}
        </Button>
      </div>
    </div>
  );

  const displayForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {/* Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Edit3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {customerId ? "Edit Personal Details" : "Add Personal Details"}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Update your profile information
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Basic Information
          </CardTitle>
          <p className="text-xs sm:text-sm text-gray-600">
            Fields marked with * are required
          </p>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm sm:text-base font-medium"
              >
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                className="h-10 sm:h-11"
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm sm:text-base font-medium"
              >
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className="h-10 sm:h-11"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm sm:text-base font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="h-10 sm:h-11"
              placeholder="Enter your phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm sm:text-base font-medium">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              rows={3}
              className="resize-none"
              placeholder="Tell us a bit about yourself..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Address Information
          </CardTitle>
          <p className="text-xs sm:text-sm text-gray-600">
            Optional but helps with delivery and location-based services
          </p>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="street"
              className="text-sm sm:text-base font-medium"
            >
              Street Address
            </Label>
            <Input
              id="street"
              value={formData.address.street}
              onChange={(e) => handleAddressChange("street", e.target.value)}
              className="h-10 sm:h-11"
              placeholder="Enter your street address"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="city"
                className="text-sm sm:text-base font-medium"
              >
                City
              </Label>
              <Input
                id="city"
                value={formData.address.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                className="h-10 sm:h-11"
                placeholder="Enter your city"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="state"
                className="text-sm sm:text-base font-medium"
              >
                State/Province
              </Label>
              <Input
                id="state"
                value={formData.address.state}
                onChange={(e) => handleAddressChange("state", e.target.value)}
                className="h-10 sm:h-11"
                placeholder="Enter your state"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="zipCode"
                className="text-sm sm:text-base font-medium"
              >
                ZIP/Postal Code
              </Label>
              <Input
                id="zipCode"
                value={formData.address.zipCode}
                onChange={(e) => handleAddressChange("zipCode", e.target.value)}
                className="h-10 sm:h-11"
                placeholder="Enter ZIP code"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="country"
                className="text-sm sm:text-base font-medium"
              >
                Country
              </Label>
              <Input
                id="country"
                value={formData.address.country}
                onChange={(e) => handleAddressChange("country", e.target.value)}
                className="h-10 sm:h-11"
                placeholder="Enter your country"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="border border-gray-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between">
            <Button
              type="submit"
              disabled={saving}
              size="lg"
              className="order-2 sm:order-1 w-full sm:w-auto px-6 sm:px-8"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              disabled={saving}
              size="lg"
              className="order-1 sm:order-2 w-full sm:w-auto px-6 sm:px-8"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <Card className="border border-gray-200">
                <CardContent className="p-8 sm:p-12">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Loading Your Details
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mt-1">
                        Please wait while we fetch your information...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : isEditing ? (
              displayForm()
            ) : (
              displayView()
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
