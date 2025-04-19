import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import LandingLeft from "@/components/landing-left";
import { ErrorText } from "@/components/error-text";
import { EyeFilledIcon, EyeSlashFilledIcon } from "@/components/icons/icons";

import { loginUser } from "@/lib/services/login-user";
import { BaseForm } from "@/types";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const [formData, setFormData] = useState<BaseForm>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const isFormValid =
    formData.email.trim() !== "" && formData.password.trim() !== "";
  const isEmailInvalid =
    formData.email.trim() !== "" && !/\S+@\S+\.\S+/.test(formData.email);

  const handleLogin = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    setApiError("");

    try {
      const response = await loginUser(formData);

      if (response.status === 200 && response.result) {
        navigate("/dashboard");
      } else {
        setApiError(response.errorMessage || "An error occurred during login");
      }
    } catch (error) {
      setApiError("An unexpected error occurred");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 h-screen">
      <LandingLeft />
      <div className="flex items-center justify-center min-h-screen">
        <div className="px-6 sm:px-0 w-full max-w-md">
          <div className="mb-7">
            <h1 className="text-3xl font-figtree font-bold text-[#1A1A1A]">
              Where genuine care meets{" "}
              <span className="text-[#f15A24]">unparalleled service.</span>
            </h1>
            <p className="mt-6 text-md font-medium">
              Access your healthcare benefits—log in now.
            </p>
          </div>
          {apiError && <ErrorText text={apiError} />}
          <div className="mb-4">
            <Input
              label="Email"
              placeholder="Enter your email (e.g. user@leadway.com)"
              value={formData.email}
              radius="sm"
              size="lg"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              isInvalid={isEmailInvalid}
              errorMessage={
                isEmailInvalid ? "Please enter a valid email address" : ""
              }
              isDisabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <Input
              label="Password"
              placeholder="Enter your password"
              type={isVisible ? "text" : "password"}
              value={formData.password}
              radius="sm"
              size="lg"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              endContent={
                <button
                  aria-label="toggle password visibility"
                  className="focus:outline-none"
                  type="button"
                  onClick={toggleVisibility}
                >
                  {isVisible ? (
                    <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                  ) : (
                    <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                  )}
                </button>
              }
              isDisabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-4 mt-6 justify-center">
            <Button
              color="warning"
              className="font-semibold text-white"
              size="lg"
              radius="sm"
              fullWidth
              isDisabled={!isFormValid || isLoading}
              isLoading={isLoading}
              onPress={handleLogin}
            >
              {isLoading ? "Logging in..." : "Log In"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
