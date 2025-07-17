import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const VerifyPhone = () => {
  const { state } = useLocation(); // contains userId, firstName, lastName, email
  const navigate = useNavigate();
  const { toast } = useToast();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("enter-phone");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);

    if (error) {
      toast({
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "OTP Sent", description: "Please check your phone" });
      setStep("enter-otp");
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    setLoading(false);

    if (error) {
      toast({
        title: "OTP Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Phone Verified",
        description: "Your number has been linked.",
      });

      // Save phone number and user profile in the customers table
      await supabase.from("customers").upsert({
        id: state.userId,
        name: `${state.firstName} ${state.lastName}`,
        email: state.email,
        phone: phone,
      });

      navigate("/my-orders");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      {step === "enter-phone" ? (
        <>
          <label className="block mb-2 text-sm font-medium">
            Enter Phone Number
          </label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91XXXXXXXXXX"
          />
          <Button
            onClick={handleSendOtp}
            className="mt-4 w-full"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </>
      ) : (
        <>
          <label className="block mb-2 text-sm font-medium">Enter OTP</label>
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit OTP"
          />
          <Button
            onClick={handleVerifyOtp}
            className="mt-4 w-full"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify & Finish"}
          </Button>
        </>
      )}
    </div>
  );
};

export default VerifyPhone;
