import { redirect } from "next/navigation";

// Coupon codes are part of the Sale feature now.
export default function Coupons() {
  redirect("/admin/features/sale#coupons");
}
