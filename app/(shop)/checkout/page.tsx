"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Elements, CardElement, CardNumberElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import Image from "next/image";
import { getStripe } from "@/lib/stripe-browser";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import type { CheckoutPaymentChoice } from "@/components/checkout/payment-method-brands";
import type { OfflinePaymentDetails } from "@/lib/checkout/offline-payment-instructions";
import {
  parseStoredShippingAddress,
  splitFullName,
  type CheckoutShippingFields,
} from "@/lib/checkout/checkout-address";
import { resolveEffectiveUnitPrice } from "@/lib/pricing/effective-price";

import { PaymentMethodModal } from "@/components/checkout/payment-method-modal";

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
  const { items, trainingItems, isLoading, clearCart } = useCart();
  const { t, language } = useLanguage();
  const initialName = splitFullName(session?.user?.name || "");
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: initialName.firstName,
    lastName: initialName.lastName,
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
  const [shippingInfo, setShippingInfo] = useState<{
    shippingAmount: number;
    shippingZone: string;
    isFreeShipping: boolean;
  } | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [billingNif, setBillingNif] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  type PaymentChoice = CheckoutPaymentChoice;
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("CARD");
  const [offlineDetails, setOfflineDetails] = useState<OfflinePaymentDetails | null>(null);
  const [offlineExpiryDays, setOfflineExpiryDays] = useState(5);
  const [showAllOrderItems, setShowAllOrderItems] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetch("/api/checkout/offline-payment-copy")
      .then((r) => r.json())
      .then((d) => {
        if (d?.details) {
          setOfflineDetails({
            mbwayPhone: d.details.mbwayPhone || "",
            bankAccountName: d.details.bankAccountName || "",
            bankName: d.details.bankName || "",
            bankIban: d.details.bankIban || "",
            bankBic: d.details.bankBic || "",
          });
        }
        if (typeof d?.expiryDays === "number") {
          setOfflineExpiryDays(d.expiryDays);
        }
      })
      .catch(() => {});
  }, []);

  // Load saved shipping address and prefill contact fields from the logged-in profile
  useEffect(() => {
    const loadSavedAddress = async () => {
      if (!session?.user?.id) return;

      try {
        const res = await fetch("/api/users/profile");
        if (!res.ok) {
          const fromSession = splitFullName(session?.user?.name || "");
          setShippingAddress((prev) => ({
            ...prev,
            firstName: prev.firstName || fromSession.firstName,
            lastName: prev.lastName || fromSession.lastName,
            email: prev.email || session?.user?.email || "",
          }));
          return;
        }

        const data = await res.json();
        const user = data.user;
        const fromName = splitFullName(user?.name || session?.user?.name || "");
        const profilePhone = typeof user?.phone === "string" ? user.phone : "";
        const profileEmail = user?.email || session?.user?.email || "";

        const saved: Partial<CheckoutShippingFields> =
          parseStoredShippingAddress(user?.shippingAddress) || {};

        setShippingAddress((prev) => ({
          firstName: prev.firstName || saved.firstName || fromName.firstName || "",
          lastName: prev.lastName || saved.lastName || fromName.lastName || "",
          email: prev.email || saved.email || profileEmail || "",
          phone: prev.phone || saved.phone || profilePhone || "",
          addressLine1: prev.addressLine1 || saved.addressLine1 || "",
          addressLine2: prev.addressLine2 || saved.addressLine2 || "",
          city: prev.city || saved.city || "",
          postalCode: prev.postalCode || saved.postalCode || "",
          district: prev.district || saved.district || "",
          country: saved.country || prev.country || "Portugal",
        }));

        if (user?.billingNif) {
          setBillingNif((prev) => prev || String(user.billingNif));
        }
        if (user?.billingAddress) {
          setBillingAddress((prev) => prev || String(user.billingAddress));
        }
      } catch (error) {
        console.error("Failed to load saved address:", error);
        const fromSession = splitFullName(session?.user?.name || "");
        setShippingAddress((prev) => ({
          ...prev,
          firstName: prev.firstName || fromSession.firstName,
          lastName: prev.lastName || fromSession.lastName,
          email: prev.email || session?.user?.email || "",
        }));
      }
    };
    loadSavedAddress();
  }, [session]);

  const getSubtotal = () =>
    items.reduce(
      (sum, item) =>
        sum +
        resolveEffectiveUnitPrice(item.product.price, item.product.salePrice) * item.quantity,
      0
    ) +
    trainingItems.reduce((sum, item) => sum + parseFloat(item.program.price), 0);

  const formatTrainingSessionDate = (value: string) =>
    new Date(value).toLocaleDateString(language === "pt" ? "pt-PT" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // Calculate shipping when postal code or subtotal changes
  useEffect(() => {
    const calculateShippingForPostalCode = async () => {
      const subtotal = getSubtotal();
      const discount = appliedCoupon ? parseFloat(appliedCoupon.discountAmount) : 0;
      const subtotalAfterDiscount = Math.max(0, subtotal - discount);

      if (!shippingAddress.postalCode || items.length === 0) {
        setShippingInfo(null);
        return;
      }

      // Extract postal code (handle both "XXXX-XXX" and "XXXXXXX" formats)
      const postalCode = shippingAddress.postalCode.replace(/\D/g, "").slice(0, 7);
      
      if (postalCode.length < 7) {
        setShippingInfo(null);
        return;
      }

      setIsCalculatingShipping(true);
      try {
        const shipRes = await fetch("/api/shipping/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subtotal: subtotalAfterDiscount,
            postalCode: shippingAddress.postalCode,
          }),
        });
        if (shipRes.ok) {
          const data = await shipRes.json();
          setShippingInfo(data);
        } else {
          console.error("Failed to calculate shipping");
          setShippingInfo(null);
        }
      } catch (error) {
        console.error("Error calculating shipping:", error);
        setShippingInfo(null);
      } finally {
        setIsCalculatingShipping(false);
      }
    };

    calculateShippingForPostalCode();
  }, [shippingAddress.postalCode, items, trainingItems, appliedCoupon]);

  const cartLineCount = items.length + trainingItems.length;

  if (isLoading) {
    return <div className="text-center py-8">{t("checkout.loading")}</div>;
  }

  if (cartLineCount === 0) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">{t("checkout.cartEmpty")}</p>
        <Button onClick={() => router.push("/products")}>{t("cart.continueShopping")}</Button>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const discount = appliedCoupon ? parseFloat(appliedCoupon.discountAmount) : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const shipping = shippingInfo?.shippingAmount || 0;
  const total = subtotalAfterDiscount + shipping;
  const orderLines = [
    ...trainingItems.map((item) => ({ kind: "training" as const, item })),
    ...items.map((item) => ({ kind: "product" as const, item })),
  ];
  const visibleOrderLines =
    orderLines.length > 2 && !showAllOrderItems ? orderLines.slice(0, 2) : orderLines;
  const hiddenOrderCount = Math.max(0, orderLines.length - 2);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setError("");
    setShowPaymentModal(true);
  };

  const handlePlaceOrder = async (
    stripeClient?: Stripe | null,
    elementsClient?: StripeElements | null
  ) => {
    setError("");

    const stripeSdk = stripeClient ?? stripe;
    const elementsSdk = elementsClient ?? elements;

    const needsStripe = paymentChoice === "CARD" || paymentChoice === "KLARNA";
    if (needsStripe && !stripeSdk) {
      return;
    }

    setIsProcessing(true);

    try {
      const formattedAddress = `${shippingAddress.firstName} ${shippingAddress.lastName}\n${shippingAddress.email}\n${shippingAddress.phone}\n${shippingAddress.addressLine1}${shippingAddress.addressLine2 ? `\n${shippingAddress.addressLine2}` : ""}\n${shippingAddress.postalCode} ${shippingAddress.city}\n${shippingAddress.district}\n${shippingAddress.country}`;

      const addressJson = JSON.stringify(shippingAddress);
      const nifTrim = billingNif.trim();
      const billingTrim = billingAddress.trim();
      const fullName = `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim();
      try {
        await fetch("/api/users/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName || undefined,
            phone: shippingAddress.phone,
            shippingAddress: addressJson,
            billingNif: nifTrim,
            billingAddress: billingTrim,
          }),
        });
      } catch (error) {
        console.error("Failed to save address to profile:", error);
      }

      const orderBodyBase = {
        shippingAddress: formattedAddress,
        postalCode: shippingAddress.postalCode,
        couponCode: appliedCoupon?.code || null,
        billingNif: nifTrim,
        billingAddress: billingTrim,
        shippingStructured: shippingAddress,
      };

      if (paymentChoice === "MBWAY" || paymentChoice === "BANK") {
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...orderBodyBase,
            shopPaymentMethod: paymentChoice === "MBWAY" ? "MBWAY" : "BANK_TRANSFER",
          }),
        });
        const errJson = orderRes.ok ? null : await orderRes.json().catch(() => ({} as { error?: string }));
        if (!orderRes.ok) {
          throw new Error(errJson?.error || "Failed to create order");
        }
        const order = await orderRes.json();
        await clearCart();
        router.push(`/orders/${order.id}`);
        return;
      }

      if (paymentChoice === "KLARNA") {
        const res = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shippingAddress: formattedAddress,
            postalCode: shippingAddress.postalCode,
            couponCode: appliedCoupon?.code || null,
            paymentMode: "klarna",
            billingNif: nifTrim,
            billingAddress: billingTrim,
            shippingStructured: {
              firstName: shippingAddress.firstName,
              lastName: shippingAddress.lastName,
              email: shippingAddress.email,
              phone: shippingAddress.phone,
              addressLine1: shippingAddress.addressLine1,
              addressLine2: shippingAddress.addressLine2 || "",
              city: shippingAddress.city,
              postalCode: shippingAddress.postalCode,
              district: shippingAddress.district,
              country: shippingAddress.country,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.clientSecret) {
          throw new Error(data.error || "Failed to create payment intent");
        }
        const { error: kErr } = await stripeSdk!.confirmKlarnaPayment(data.clientSecret, {
          return_url: `${window.location.origin}/checkout/payment-return`,
        });
        if (kErr) {
          setError(kErr.message || "Klarna payment failed");
          setIsProcessing(false);
          return;
        }
        return;
      }

      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: formattedAddress,
          postalCode: shippingAddress.postalCode,
          couponCode: appliedCoupon?.code || null,
          paymentMode: "card",
          billingNif: nifTrim,
          billingAddress: billingTrim,
          shippingStructured: shippingAddress,
        }),
      });

      const data = await res.json().catch(() => ({} as { clientSecret?: string; error?: string }));
      const clientSecret = data.clientSecret;

      if (!res.ok || !clientSecret) {
        throw new Error(data.error || "Failed to create payment intent");
      }

      const cardElement =
        elementsSdk?.getElement(CardNumberElement) || elementsSdk?.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      const { error: paymentError, paymentIntent } = await stripeSdk!.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (paymentError) {
        setError(paymentError.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...orderBodyBase,
            paymentIntentId: paymentIntent.id,
            shopPaymentMethod: "STRIPE_CARD",
          }),
        });

        if (orderRes.ok) {
          const order = await orderRes.json();
          await clearCart();
          router.push(`/orders/${order.id}`);
        } else {
          const lookup = await fetch(
            `/api/orders/lookup-by-payment-intent?payment_intent=${encodeURIComponent(paymentIntent.id)}`
          );
          const existing = lookup.ok ? await lookup.json() : null;
          if (existing?.id) {
            await clearCart();
            router.push(`/orders/${existing.id}`);
            return;
          }
          const ed = await orderRes.json().catch(() => ({} as { error?: string }));
          throw new Error(ed.error || "Failed to create order");
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
    <form
      onSubmit={handleContinue}
      className="flex flex-col gap-4 sm:gap-6 md:gap-8 lg:flex-row lg:items-start"
    >
      <div className="order-2 flex-1 space-y-4 sm:space-y-6 lg:order-1">
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
          <CardTitle className="text-lg sm:text-xl">{t("checkout.billingInformation")}</CardTitle>
          <p className="text-sm text-muted-foreground font-normal mt-1">
            {t("checkout.billingInformationHint")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("checkout.billingNif")} *</label>
            <Input
              inputMode="numeric"
              autoComplete="off"
              placeholder={t("checkout.billingNifPlaceholder")}
              value={billingNif}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                setBillingNif(digits);
              }}
              required
              maxLength={9}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("checkout.billingAddress")} *</label>
            <Textarea
              placeholder={t("checkout.billingAddressPlaceholder")}
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              required
              rows={4}
              className="resize-y min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>
      </div>

      <div className="order-1 w-full space-y-4 sm:space-y-6 lg:order-2 lg:w-[min(100%,36rem)] lg:shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{t("checkout.orderItems")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 sm:space-y-6">
                {items.length === 0 && trainingItems.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500 sm:text-base">{t("checkout.cartEmpty")}</p>
                ) : (
                  <>
                    {visibleOrderLines.map((line) =>
                      line.kind === "training" ? (
                      <div key={line.item.id} className="flex gap-3 border-b pb-4 last:border-b-0 last:pb-0 sm:gap-4 sm:pb-6">
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-brand-champagne/15 sm:h-24 sm:w-24">
                          {line.item.program.image ? (
                            <Image
                              src={line.item.program.image}
                              alt={line.item.program.title}
                              fill
                              sizes="(max-width: 640px) 80px, 96px"
                              className="object-cover"
                              unoptimized={
                                line.item.program.image.startsWith("data:") ||
                                line.item.program.image.startsWith("blob:")
                              }
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-brand-champagne">
                              {t("cart.trainingBadge")}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 break-words text-base font-semibold sm:text-lg">
                            {line.item.program.title}
                          </h3>
                          <p className="mb-1 text-xs text-gray-500 sm:text-sm">{t("cart.trainingProgram")}</p>
                          <p className="mb-1 text-xs text-gray-500 sm:text-sm">
                            {formatTrainingSessionDate(line.item.session.startDate)}
                            {line.item.session.location ? ` · ${line.item.session.location}` : ""}
                          </p>
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                            <span className="text-xs text-gray-500 sm:text-sm">{t("checkout.quantity")} 1</span>
                            <span className="text-sm font-semibold sm:text-base">
                              {formatPrice(line.item.program.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                      ) : (
                      <div key={line.item.id} className="flex gap-3 border-b pb-4 last:border-b-0 last:pb-0 sm:gap-4 sm:pb-6">
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-24">
                          {line.item.product.image ? (
                            <Image
                              src={line.item.product.image}
                              alt={line.item.product.name}
                              fill
                              sizes="(max-width: 640px) 80px, 96px"
                              className="object-contain"
                              priority
                              loading="eager"
                              unoptimized={
                                line.item.product.image?.startsWith("data:") ||
                                line.item.product.image?.startsWith("blob:")
                              }
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                              {t("cart.noImage")}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 break-words text-base font-semibold sm:text-lg">{line.item.product.name}</h3>
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                            <span className="text-xs text-gray-500 sm:text-sm">
                              {t("checkout.quantity")} {line.item.quantity}
                            </span>
                            <span className="text-sm font-semibold sm:text-base">
                              {formatPrice(
                                resolveEffectiveUnitPrice(
                                  line.item.product.price,
                                  line.item.product.salePrice
                                ) * line.item.quantity
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      )
                    )}
                    {orderLines.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowAllOrderItems((open) => !open)}
                      >
                        {showAllOrderItems
                          ? t("checkout.seeFewerItems")
                          : t("checkout.seeMoreItems", { count: String(hiddenOrderCount) })}
                      </Button>
                    )}
                  </>
                )}
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
              <div className="flex items-center justify-between gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="min-w-0">
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
                  className="shrink-0 text-red-600 hover:text-red-700"
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
                  className="flex-1 min-w-0"
                />
                <Button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponCode.trim()}
                  className="shrink-0"
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
          <p className="text-xs sm:text-sm text-gray-500">
            Todos os produtos ja incluem IVA a 23%.
          </p>
          <div className="flex justify-between text-sm sm:text-base">
            <span>
              {isCalculatingShipping ? (
                <span className="text-gray-500">{t("checkout.shipping")} (Calculating...)</span>
              ) : shippingInfo?.isFreeShipping ? (
                `${t("checkout.shipping")} (Free)`
              ) : (
                t("checkout.shipping")
              )}
            </span>
            <span>
              {isCalculatingShipping ? (
                <span className="text-gray-500">Calculating...</span>
              ) : (
                formatPrice(shipping)
              )}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-base sm:text-lg">
            <span>{t("checkout.total")}</span>
            <span>{formatPrice(total)}</span>
          </div>
        </CardContent>
      </Card>

      {error && !showPaymentModal && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isProcessing}
      >
        {t("checkout.continueToPayment")}
      </Button>
      </div>

      <PaymentMethodModal
        open={showPaymentModal}
        onClose={() => {
          if (!isProcessing) setShowPaymentModal(false);
        }}
        paymentChoice={paymentChoice}
        onPaymentChoiceChange={setPaymentChoice}
        offlineDetails={offlineDetails}
        expiryDays={offlineExpiryDays}
        total={total}
        error={error}
        isProcessing={isProcessing}
        onConfirm={handlePlaceOrder}
      />
    </form>
  );
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isLoading } = useCart();

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
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 md:py-8">
      <h1 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl md:mb-8 md:text-3xl lg:text-4xl">
        {t("checkout.title")}
      </h1>
      <Elements stripe={getStripe()} options={{ locale: "pt" }}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}
