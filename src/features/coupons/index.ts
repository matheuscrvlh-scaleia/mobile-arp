/* API pública da feature de cupons: outras features importam só daqui. */
export { useCoupons } from "./api/coupons";
export { CouponCard, type CouponCardProps } from "./components/CouponCard";
export {
  MINI_COUPON_WIDTH,
  MiniCouponCard,
  type MiniCouponCardProps,
} from "./components/MiniCouponCard";
export { QrCode } from "./components/QrCode";
