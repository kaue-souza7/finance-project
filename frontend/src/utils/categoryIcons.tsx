import type { ReactNode } from "react";
import {
  Apple,
  Armchair,
  Baby,
  Banknote,
  BookOpen,
  Briefcase,
  Car,
  CreditCard,
  Dumbbell,
  Gamepad2,
  Gift,
  Heart,
  Home,
  Lightbulb,
  MoreHorizontal,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  Salad,
  Shirt,
  ShoppingBag,
  Smartphone,
  Syringe,
  Utensils,
  Wifi,
} from "lucide-react";

const iconMap: Record<string, typeof Apple> = {
  apple: Apple,
  armchair: Armchair,
  baby: Baby,
  banknote: Banknote,
  bookopen: BookOpen,
  briefcase: Briefcase,
  car: Car,
  creditcard: CreditCard,
  dumbbell: Dumbbell,
  gamepad2: Gamepad2,
  gift: Gift,
  heart: Heart,
  home: Home,
  lightbulb: Lightbulb,
  morehorizontal: MoreHorizontal,
  music: Music,
  pawprint: PawPrint,
  piggybank: PiggyBank,
  plane: Plane,
  salad: Salad,
  shirt: Shirt,
  shoppingbag: ShoppingBag,
  smartphone: Smartphone,
  syringe: Syringe,
  utensils: Utensils,
  wifi: Wifi,
};

const iconList: { key: string; component: typeof Apple }[] =
  Object.entries(iconMap).map(([key, component]) => ({ key, component }));

export function getCategoryIcon(
  name: string,
  size: number,
  color?: string,
): ReactNode {
  const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const Icon = iconMap[baseName];
  if (!Icon) return null;
  return <Icon size={size} color={color} />;
}

export { iconList };
export type { iconMap };
