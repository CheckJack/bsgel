"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";

export default function CartPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  const { items, isLoading, updateQuantity, removeItem, itemCount } = useCart();

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg mb-4">{t("cart.pleaseSignIn")}</p>
        <Link href="/login">
          <Button>{t("cart.signIn")}</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">{t("cart.loadingCart")}</div>;
  }

  if (itemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold mb-4">{t("cart.title")}</h1>
        <p className="text-lg mb-6">{t("cart.empty")}</p>
        <Link href="/products">
          <Button>{t("cart.continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );
  // Tax is calculated at checkout based on postal code
  // Not showing tax in cart page since we don't have postal code yet
  const total = subtotal;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">{t("cart.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {item.product.image ? (
                    <Link href={`/products/${item.product.id}`} className="relative w-full sm:w-24 h-48 sm:h-24 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 96px"
                        className="object-contain rounded"
                        priority
                        loading="eager"
                        unoptimized={item.product.image?.startsWith('data:') || item.product.image?.startsWith('blob:')}
                      />
                    </Link>
                  ) : (
                    <div className="w-full sm:w-24 h-48 sm:h-24 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">{t("cart.noImage")}</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.product.id}`}>
                      <h3 className="font-semibold text-base sm:text-lg hover:underline break-words">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">{formatPrice(item.product.price)}</p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 sm:h-8 sm:w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center text-sm sm:text-base">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 sm:h-8 sm:w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 text-sm sm:text-base"
                      >
                        {t("cart.remove")}
                      </Button>
                    </div>
                  </div>

                  <div className="text-left sm:text-right mt-2 sm:mt-0">
                    <p className="font-bold text-base sm:text-lg">
                      {formatPrice(parseFloat(item.product.price) * item.quantity)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{t("cart.orderSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm sm:text-base">
                <span>{t("cart.subtotal")}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="text-xs text-gray-500 italic">
                Tax will be calculated at checkout based on your shipping address
              </div>
              <div className="border-t pt-4 flex justify-between font-bold text-base sm:text-lg">
                <span>{t("cart.total")}</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push("/checkout")}
              >
                {t("cart.proceedToCheckout")}
              </Button>
              <Link href="/products">
                <Button variant="outline" className="w-full">
                  {t("cart.continueShopping")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

