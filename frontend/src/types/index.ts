export type Role = 'ROLE_ADMIN' | 'ROLE_KITCHEN_STAFF' | 'ROLE_WAITER' | 'ROLE_CUSTOMER';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: Role[];
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  iconName?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export type SpiceLevel = 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT';

export interface CustomizationOption {
  id: number;
  name: string;
  additionalPrice: number;
  isDefault: boolean;
}

export interface CustomizationGroup {
  id: number;
  groupName: string;
  isRequired: boolean;
  allowMultiple: boolean;
  options: CustomizationOption[];
}

export interface FoodItem {
  id: number;
  categoryId: number;
  categoryName: string;
  stationId?: number;
  stationName?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel: SpiceLevel;
  prepTimeMinutes: number;
  allergyInfo?: string;
  ingredients?: string;
  isAvailable: boolean;
  isPopular: boolean;
  isSpecialOffer: boolean;
  originalPrice?: number;
  customizations: CustomizationGroup[];
}

export interface CartCustomization {
  optionId: number;
  groupName: string;
  optionName: string;
  additionalPrice: number;
}

export interface CartItem {
  id: string; // unique cart uuid
  foodItem: FoodItem;
  quantity: number;
  selectedPortion: string;
  selectedSpiceLevel: SpiceLevel;
  removedIngredients?: string;
  itemNotes?: string;
  customizations: CartCustomization[];
  unitTotal: number;
  lineTotal: number;
}

export type OrderStatus =
  | 'NEW_ORDER'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItemResponse {
  id: number;
  foodItemId: number;
  foodItemName: string;
  foodItemImage: string;
  categoryName: string;
  stationId?: number;
  stationName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  selectedPortion: string;
  selectedSpiceLevel: string;
  removedIngredients?: string;
  itemNotes?: string;
  allergyInfo?: string;
  status: string;
  customizations: CartCustomization[];
}

export interface Order {
  id: number;
  orderCode: string;
  tableNumber: number;
  customerName: string;
  customerPhone?: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  appliedCouponCode?: string;
  grandTotal: number;
  specialInstructions?: string;
  estimatedPrepMinutes: number;
  createdAt: string;
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  servedAt?: string;
  items: OrderItemResponse[];
}

export interface Table {
  id: number;
  tableNumber: number;
  seatingCapacity: number;
  floorZone: string;
  status: string; // AVAILABLE, OCCUPIED, ORDER_RECEIVED, PREPARING, FOOD_READY, ASSISTANCE_REQUESTED, BILLING_REQUESTED
  isActive: boolean;
  accessToken: string;
  qrTargetUrl: string;
  qrImageData: string;
  activeOrderId?: number;
  activeOrderCode?: string;
}

export type WaiterRequestType =
  | 'ASSISTANCE'
  | 'WATER'
  | 'EXTRA_PLATES'
  | 'MENU_HELP'
  | 'BILL_REQUEST'
  | 'OTHER';

export type WaiterRequestStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';

export interface WaiterRequest {
  id: number;
  tableNumber: number;
  requestType: WaiterRequestType;
  additionalNote?: string;
  status: WaiterRequestStatus;
  assignedWaiterName?: string;
  requestedAt: string;
  acceptedAt?: string;
  resolvedAt?: string;
}

export interface BillItem {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface BillSplit {
  id: number;
  splitNumber: number;
  splitType: string;
  allocatedAmount: number;
  isPaid: boolean;
  payerName?: string;
  paymentMethod?: string;
}

export interface Bill {
  id: number;
  billNumber: string;
  tableNumber: number;
  orderId: number;
  orderCode: string;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  tipAmount: number;
  loyaltyDiscount: number;
  finalPayableAmount: number;
  paidAmount: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  createdAt: string;
  paidAt?: string;
  paymentMethod?: string;
  items: BillItem[];
  splits: BillSplit[];
}

export interface RestaurantSettings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  wifiName: string;
  wifiPassword: string;
  taxPercentage: number;
  serviceChargePercentage: number;
  currency: string;
  currencySymbol: string;
  openingTime: string;
  closingTime: string;
}
