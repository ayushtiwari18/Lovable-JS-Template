import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { PersonalDetailsHeader } from "../components/PersonalDetailsHeader.jsx";
import { PersonalDetailsView } from "../components/PersonalDetailsView";
import { PersonalDetailsForm } from "../components/PersonalDetailsForm";
import { LoadingCard } from "../components/LoadingCard";

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

  const handleSubmit = async (updatedFormData) => {
    if (!updatedFormData.name.trim() || !updatedFormData.email.trim()) {
      return toast({
        title: "Validation Error",
        description: "Name and email are required.",
        variant: "destructive",
      });
    }

    try {
      setSaving(true);

      const cleanAddress = Object.fromEntries(
        Object.entries(updatedFormData.address).filter(
          ([_, v]) => v.trim() !== ""
        )
      );

      const customerData = {
        name: updatedFormData.name.trim(),
        email: updatedFormData.email.trim(),
        phone: updatedFormData.phone.trim() || null,
        address: Object.keys(cleanAddress).length > 0 ? cleanAddress : null,
        bio: updatedFormData.bio.trim() || null,
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <LoadingCard />
            ) : isEditing ? (
              <PersonalDetailsForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                onCancel={handleCancelEdit}
                saving={saving}
                customerId={customerId}
              />
            ) : (
              <PersonalDetailsView
                formData={formData}
                onEditClick={() => setIsEditing(true)}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
