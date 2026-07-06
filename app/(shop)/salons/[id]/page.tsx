import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SalonDetailRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/salons?salon=${encodeURIComponent(id)}`);
}
