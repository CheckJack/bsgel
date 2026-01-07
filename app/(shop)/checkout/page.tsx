"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import Image from "next/image";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  district: string;
  country: string;
}

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { data: session } = useSession();
  const { items, isLoading, clearCart } = useCart();
  const { t } = useLanguage();
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    email: session?.user?.email || "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    district: "",
    country: "Portugal",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: string;
    description?: string;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [taxInfo, setTaxInfo] = useState<{
    taxAmount: number;
    taxRate: number;
    taxRegion: string;
  } | null>(null);
  const [isCalculatingTax, setIsCalculatingTax] = useState(false);

  // Load saved shipping address and update email when session loads
  useEffect(() => {
    const loadSavedAddress = async () => {
      if (session?.user?.id) {
        try {
          const res = await fetch("/api/users/profile");
          if (res.ok) {
            const data = await res.json();
            if (data.user?.shippingAddress) {
              try {
                // Try to parse as JSON first (new format)
                const parsed = JSON.parse(data.user.shippingAddress);
                setShippingAddress({
                  firstName: parsed.firstName || "",
                  lastName: parsed.lastName || "",
                  email: parsed.email || session?.user?.email || "",
                  phone: parsed.phone || "",
                  addressLine1: parsed.addressLine1 || "",
                  addressLine2: parsed.addressLine2 || "",
                  city: parsed.city || "",
                  postalCode: parsed.postalCode || "",
                  district: parsed.district || "",
                  country: parsed.country || "Portugal",
                });
              } catch {
                // If not JSON, it's the old string format - just use email from session
                setShippingAddress((prev) => ({
                  ...prev,
                  email: session?.user?.email || "",
                }));
              }
            } else {
              // No saved address, just set email
              setShippingAddress((prev) => ({
                ...prev,
                email: session?.user?.email || "",
              }));
            }
          }
        } catch (error) {
          console.error("Failed to load saved address:", error);
          // Just set email if loading fails
          setShippingAddress((prev) => ({
            ...prev,
            email: session?.user?.email || "",
          }));
        }
      }
    };
    loadSavedAddress();
  }, [session]);

  // Calculate tax when postal code or subtotal changes
  useEffect(() => {
    const calculateTaxForPostalCode = async () => {
      const subtotal = items.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
        0
      );
      const discount = appliedCoupon ? parseFloat(appliedCoupon.discountAmount) : 0;
      const subtotalAfterDiscount = Math.max(0, subtotal - discount);

      // Only calculate if we have a postal code and items
      if (!shippingAddress.postalCode || items.length === 0) {
        setTaxInfo(null);
        return;
      }

      // Extract postal code (handle both "XXXX-XXX" and "XXXXXXX" formats)
      const postalCode = shippingAddress.postalCode.replace(/\D/g, "").slice(0, 4);
      
      if (postalCode.length < 1) {
        setTaxInfo(null);
        return;
      }

      setIsCalculatingTax(true);
      try {
        const res = await fetch("/api/tax/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subtotal: subtotalAfterDiscount,
            postalCode: shippingAddress.postalCode,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setTaxInfo(data);
        } else {
          console.error("Failed to calculate tax");
          setTaxInfo(null);
        }
      } catch (error) {
        console.error("Error calculating tax:", error);
        setTaxInfo(null);
      } finally {
        setIsCalculatingTax(false);
      }
    };

    calculateTaxForPostalCode();
  }, [shippingAddress.postalCode, items, appliedCoupon]);

  if (isLoading) {
    return <div className="text-center py-8">{t("checkout.loading")}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">{t("checkout.cartEmpty")}</p>
        <Button onClick={() => router.push("/products")}>{t("cart.continueShopping")}</Button>
      </div>
    );
  }

  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );
  const discount = appliedCoupon ? parseFloat(appliedCoupon.discountAmount) : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const tax = taxInfo?.taxAmount || 0;
  const total = subtotalAfterDiscount + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Format shipping address as a string for order storage
      const formattedAddress = `${shippingAddress.firstName} ${shippingAddress.lastName}\n${shippingAddress.email}\n${shippingAddress.phone}\n${shippingAddress.addressLine1}${shippingAddress.addressLine2 ? `\n${shippingAddress.addressLine2}` : ""}\n${shippingAddress.postalCode} ${shippingAddress.city}\n${shippingAddress.district}\n${shippingAddress.country}`;

      // Save shipping address to user profile as JSON for easy parsing later
      const addressJson = JSON.stringify(shippingAddress);
      try {
        await fetch("/api/users/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shippingAddress: addressJson }),
        });
      } catch (error) {
        console.error("Failed to save address to profile:", error);
        // Continue with payment even if saving address fails
      }

      // Create payment intent
      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          shippingAddress: formattedAddress,
          postalCode: shippingAddress.postalCode,
          couponCode: appliedCoupon?.code || null,
        }),
      });

      const { clientSecret, paymentIntentId } = await res.json();

      if (!clientSecret) {
        throw new Error("Failed to create payment intent");
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Confirm payment
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (paymentError) {
        setError(paymentError.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        // Create order
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shippingAddress: formattedAddress,
            paymentIntentId: paymentIntent.id,
            couponCode: appliedCoupon?.code || null,
          }),
        });

        if (orderRes.ok) {
          const order = await orderRes.json();
          await clearCart();
          router.push(`/orders/${order.id}`);
        } else {
          throw new Error("Failed to create order");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal: subtotal,
          cartItems: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCouponError(data.error || "Invalid coupon code");
        setAppliedCoupon(null);
        return;
      }

      if (data.valid) {
        setAppliedCoupon({
          code: data.coupon.code,
          discountAmount: data.discountAmount,
          description: data.coupon.description,
        });
        setCouponError("");
      }
    } catch (err: any) {
      setCouponError("Failed to apply coupon. Please try again.");
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">{t("checkout.shippingInformation")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("checkout.firstName")} *</label>
              <Input
                placeholder={t("checkout.firstNamePlaceholder")}
                value={shippingAddress.firstName}
                onChange={(e) => handleAddressChange("firstName", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("checkout.lastName")} *</label>
              <Input
                placeholder={t("checkout.lastNamePlaceholder")}
                value={shippingAddress.lastName}
                onChange={(e) => handleAddressChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("checkout.email")} *</label>
            <Input
              type="email"
              placeholder={t("checkout.emailPlaceholder")}
              value={shippingAddress.email}
              onChange={(e) => handleAddressChange("email", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("checkout.phoneNumber")} *</label>
            <Input
              type="tel"
              placeholder={t("checkout.phonePlaceholder")}
              value={shippingAddress.phone}
              onChange={(e) => handleAddressChange("phone", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("checkout.addressLine1")} *</label>
            <Input
              placeholder={t("checkout.addressLine1Placeholder")}
              value={shippingAddress.addressLine1}
              onChange={(e) => handleAddressChange("addressLine1", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("checkout.addressLine2")}</label>
            <Input
              placeholder={t("checkout.addressLine2Placeholder")}
              value={shippingAddress.addressLine2}
              onChange={(e) => handleAddressChange("addressLine2", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("checkout.postalCode")} *</label>
              <Input
                placeholder={t("checkout.postalCodePlaceholder")}
                value={shippingAddress.postalCode}
                onChange={(e) => {
                  let input = e.target.value;
                  
                  // Remove everything except digits and hyphen
                  let cleaned = input.replace(/[^\d-]/g, "");
                  
                  // Extract only digits to check length
                  let digits = cleaned.replace(/-/g, "");
                  
                  // Limit to 7 digits maximum
                  if (digits.length > 7) {
                    digits = digits.slice(0, 7);
                  }
                  
                  // Format: if we have digits, format as XXXX-XXX
                  let formatted = "";
                  if (digits.length === 0) {
                    formatted = "";
                  } else if (digits.length <= 4) {
                    formatted = digits;
                  } else {
                    // Always format as XXXX-XXX when we have more than 4 digits
                    formatted = digits.slice(0, 4) + "-" + digits.slice(4);
                  }
                  
                  handleAddressChange("postalCode", formatted);
                }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("checkout.city")} *</label>
              <Input
                placeholder={t("checkout.cityPlaceholder")}
                value={shippingAddress.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("checkout.district")} *</label>
            <Input
              placeholder={t("checkout.districtPlaceholder")}
              value={shippingAddress.district}
              onChange={(e) => handleAddressChange("district", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("checkout.country")} *</label>
            <Input
              value={shippingAddress.country}
              onChange={(e) => handleAddressChange("country", e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">{t("checkout.paymentInformation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-3 sm:p-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#9e2146",
                  },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">{t("checkout.couponCode")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {appliedCoupon ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                <div>
                  <p className="font-medium text-green-800">
                    {t("checkout.couponApplied")}: {appliedCoupon.code}
                  </p>
                  {appliedCoupon.description && (
                    <p className="text-sm text-green-600">{appliedCoupon.description}</p>
                  )}
                  <p className="text-sm font-semibold text-green-700 mt-1">
                    {t("checkout.discount")}: -{formatPrice(parseFloat(appliedCoupon.discountAmount))}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="text-red-600 hover:text-red-700"
                >
                  {t("checkout.removeCoupon")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={t("checkout.couponCode")}
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyCoupon();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponCode.trim()}
                >
                  {isApplyingCoupon ? t("checkout.processing") : t("checkout.applyCoupon")}
                </Button>
              </div>
              {couponError && (
                <p className="text-sm text-red-600">{couponError}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">{t("checkout.orderSummary")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm sm:text-base">
            <span>{t("checkout.subtotal")}</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-green-600 text-sm sm:text-base">
              <span>{t("checkout.discount")} ({appliedCoupon.code})</span>
              <span>-{formatPrice(parseFloat(appliedCoupon.discountAmount))}</span>
            </div>
          )}
          <div className="flex justify-between text-sm sm:text-base">
            <span>
              {isCalculatingTax ? (
                <span className="text-gray-500">Tax (Calculating...)</span>
              ) : taxInfo ? (
                `Tax ${Math.round(taxInfo.taxRate)}% (${taxInfo.taxRegion})`
              ) : (
                "Tax"
              )}
            </span>
            <span>
              {isCalculatingTax ? (
                <span className="text-gray-500">Calculating...</span>
              ) : (
                formatPrice(tax)
              )}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-base sm:text-lg">
            <span>{t("checkout.total")}</span>
            <span>{formatPrice(total)}</span>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? t("checkout.processing") : `${t("checkout.placeOrder")} ${formatPrice(total)}`}
      </Button>
    </form>
  );
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, isLoading } = useCart();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const { t } = useLanguage();

  if (status === "loading" || isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">{t("checkout.loading")}</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 md:mb-8">{t("checkout.title")}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {/* Left Container - Checkout Information */}
        <div className="lg:pr-8 order-2 lg:order-1">
          <Elements stripe={stripePromise}>
            <CheckoutForm />
          </Elements>
        </div>

        {/* Right Container - Product Photos and Info */}
        <div className="lg:pl-8 order-1 lg:order-2">
          <Card className="lg:sticky lg:top-20 lg:top-24">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{t("checkout.orderItems")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 sm:space-y-6">
                {items.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 text-sm sm:text-base">{t("checkout.cartEmpty")}</p>
                ) : (
                  items.map((item) => (
                  <div key={item.id} className="flex gap-3 sm:gap-4 pb-4 sm:pb-6 border-b last:border-b-0 last:pb-0">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          sizes="(max-width: 640px) 80px, 96px"
                          className="object-contain"
                          priority
                          loading="eager"
                          unoptimized={item.product.image?.startsWith('data:') || item.product.image?.startsWith('blob:')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {t("cart.noImage")}
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg mb-1 break-words">{item.product.name}</h3>
                      {item.product.description && (
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">
                          {item.product.description}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-500">{t("checkout.quantity")} {item.quantity}</span>
                        <span className="font-semibold text-sm sm:text-base">
                          {formatPrice(parseFloat(item.product.price) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

