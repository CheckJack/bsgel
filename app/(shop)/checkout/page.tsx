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

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">Your cart is empty.</p>
        <Button onClick={() => router.push("/products")}>Continue Shopping</Button>
      </div>
    );
  }

  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );
  const discount = appliedCoupon ? parseFloat(appliedCoupon.discountAmount) : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const tax = subtotalAfterDiscount * 0.1;
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
          <CardTitle className="text-lg sm:text-xl">Shipping Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name *</label>
              <Input
                placeholder="First Name"
                value={shippingAddress.firstName}
                onChange={(e) => handleAddressChange("firstName", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name *</label>
              <Input
                placeholder="Last Name"
                value={shippingAddress.lastName}
                onChange={(e) => handleAddressChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={shippingAddress.email}
              onChange={(e) => handleAddressChange("email", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number *</label>
            <Input
              type="tel"
              placeholder="+351 XXX XXX XXX"
              value={shippingAddress.phone}
              onChange={(e) => handleAddressChange("phone", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
            <Input
              placeholder="Street address, house number"
              value={shippingAddress.addressLine1}
              onChange={(e) => handleAddressChange("addressLine1", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address Line 2</label>
            <Input
              placeholder="Apartment, suite, etc. (optional)"
              value={shippingAddress.addressLine2}
              onChange={(e) => handleAddressChange("addressLine2", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Postal Code *</label>
              <Input
                placeholder="XXXX-XXX"
                value={shippingAddress.postalCode}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.length > 4) {
                    value = value.slice(0, 4) + "-" + value.slice(4, 7);
                  }
                  handleAddressChange("postalCode", value);
                }}
                maxLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City *</label>
              <Input
                placeholder="City"
                value={shippingAddress.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">District *</label>
            <Input
              placeholder="District (e.g., Lisboa, Porto, Braga)"
              value={shippingAddress.district}
              onChange={(e) => handleAddressChange("district", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Country *</label>
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
          <CardTitle className="text-lg sm:text-xl">Payment Information</CardTitle>
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
          <CardTitle className="text-lg sm:text-xl">Coupon Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {appliedCoupon ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                <div>
                  <p className="font-medium text-green-800">
                    Coupon Applied: {appliedCoupon.code}
                  </p>
                  {appliedCoupon.description && (
                    <p className="text-sm text-green-600">{appliedCoupon.description}</p>
                  )}
                  <p className="text-sm font-semibold text-green-700 mt-1">
                    Discount: -{formatPrice(parseFloat(appliedCoupon.discountAmount))}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
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
                  {isApplyingCoupon ? "Applying..." : "Apply"}
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
          <CardTitle className="text-lg sm:text-xl">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm sm:text-base">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-green-600 text-sm sm:text-base">
              <span>Discount ({appliedCoupon.code})</span>
              <span>-{formatPrice(parseFloat(appliedCoupon.discountAmount))}</span>
            </div>
          )}
          <div className="flex justify-between text-sm sm:text-base">
            <span>Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-base sm:text-lg">
            <span>Total</span>
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
        {isProcessing ? "Processing..." : `Pay ${formatPrice(total)}`}
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

  if (status === "loading" || isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Left Container - Checkout Information */}
        <div className="lg:pr-8 order-2 lg:order-1">
          <Elements stripe={stripePromise}>
            <CheckoutForm />
          </Elements>
        </div>

        {/* Right Container - Product Photos and Info */}
        <div className="lg:pl-8 order-1 lg:order-2">
          <Card className="sticky top-20 lg:top-24">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 sm:space-y-6">
                {items.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 text-sm sm:text-base">Your cart is empty</p>
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
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
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
                        <span className="text-xs sm:text-sm text-gray-500">Quantity: {item.quantity}</span>
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

