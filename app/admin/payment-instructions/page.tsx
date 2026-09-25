"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Loader2, Save } from "lucide-react";

type FormState = {
  mbwayPhone: string;
  bankAccountName: string;
  bankName: string;
  bankIban: string;
  bankBic: string;
};

export default function OfflinePaymentInstructionsPage() {
  const [form, setForm] = useState<FormState>({
    mbwayPhone: "",
    bankAccountName: "",
    bankName: "",
    bankIban: "",
    bankBic: "",
  });
  const [preview, setPreview] = useState({ mbwayHtml: "", bankTransferHtml: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/admin/offline-payment-instructions");
        if (!res.ok) {
          toast("Failed to load payment instructions", "error");
          return;
        }
        const data = await res.json();
        setForm({
          mbwayPhone: data.mbwayPhone || "",
          bankAccountName: data.bankAccountName || "",
          bankName: data.bankName || "",
          bankIban: data.bankIban || "",
          bankBic: data.bankBic || "",
        });
        setPreview({
          mbwayHtml: data.mbwayHtml || "",
          bankTransferHtml: data.bankTransferHtml || "",
        });
      } catch {
        toast("Failed to load payment instructions", "error");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/admin/offline-payment-instructions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Failed to save", "error");
        return;
      }
      setPreview({
        mbwayHtml: data.mbwayHtml || "",
        bankTransferHtml: data.bankTransferHtml || "",
      });
      toast(
        data.bankIban
          ? "Payment instructions saved"
          : "Saved — add the IBAN when you have it so bank transfer shows full details",
        data.bankIban ? "success" : "info",
        5000
      );
    } catch {
      toast("Failed to save payment instructions", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Offline payment instructions
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Shown at checkout when customers choose MB Way or bank transfer. Saving regenerates the
          customer-facing copy from these details.
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment details</CardTitle>
            <CardDescription>
              Use the business MB Way number and IBAN. Without an IBAN, bank transfer still works but
              asks the customer to request it by email/phone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="mbwayPhone">
                MB Way phone
              </label>
              <Input
                id="mbwayPhone"
                value={form.mbwayPhone}
                onChange={(e) => setForm((f) => ({ ...f, mbwayPhone: e.target.value }))}
                placeholder="+351 935 172 295"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="bankAccountName">
                Bank beneficiary
              </label>
              <Input
                id="bankAccountName"
                value={form.bankAccountName}
                onChange={(e) => setForm((f) => ({ ...f, bankAccountName: e.target.value }))}
                placeholder="BS Gel lda"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="bankName">
                Bank
              </label>
              <Input
                id="bankName"
                value={form.bankName}
                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                placeholder="Santander"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="bankIban">
                IBAN
              </label>
              <Input
                id="bankIban"
                value={form.bankIban}
                onChange={(e) => setForm((f) => ({ ...f, bankIban: e.target.value.toUpperCase() }))}
                placeholder="PT50 ACCT-000003"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="bankBic">
                BIC / SWIFT (optional)
              </label>
              <Input
                id="bankBic"
                value={form.bankBic}
                onChange={(e) => setForm((f) => ({ ...f, bankBic: e.target.value.toUpperCase() }))}
                placeholder="XXXXPTPL"
                autoComplete="off"
              />
            </div>
            <Button type="button" onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save instructions
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>MB Way preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="overflow-hidden bg-white [&_a]:text-brand-champagne"
                dangerouslySetInnerHTML={{ __html: preview.mbwayHtml }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Bank transfer preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="overflow-hidden bg-white [&_a]:text-brand-champagne"
                dangerouslySetInnerHTML={{ __html: preview.bankTransferHtml }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
