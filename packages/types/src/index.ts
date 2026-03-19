// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: AccountType;
  iat?: number;
  exp?: number;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export type AccountType = 'retail' | 'wholesale' | 'admin' | 'manufacturer';
export type WholesaleTier = 'bronze' | 'silver' | 'gold';

export interface UserDto {
  id: string;
  email: string;
  emailVerifiedAt?: string;
  fullName: string;
  phone?: string;
  accountType: AccountType;
  wholesaleTier?: WholesaleTier;
  companyName?: string;
  vatNumber?: string;
  isApproved: boolean;
  locale: string;
  currency: string;
  createdAt: string;
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface ProductDto {
  id: string;
  slug: string;
  sku?: string;
  name: string;
  description?: string;
  basePrice: number;
  wholesalePrice?: number;
  moq: number;
  isCustomizable: boolean;
  images: ProductImageDto[];
  variants: ProductVariantDto[];
  tags: string[];
  leadTimeDays: number;
  category: { id: string; slug: string; name: string };
}

export interface ProductImageDto {
  url: string;
  altText?: string;
  isPrimary: boolean;
  layerType?: string;
  layerVariantKey?: string;
}

export interface ProductVariantDto {
  id: string;
  sku: string;
  size?: string;
  color?: string;
  material?: string;
  priceModifier: number;
  stockQty: number;
}

// ─── Configurator ─────────────────────────────────────────────────────────────

export type ConfiguratorAssetType = 'base' | 'color' | 'hardware' | 'padding' | 'stitch' | 'overlay';

export interface ConfiguratorStep {
  id: string;
  order: number;
  title: string;
  description?: string;
  ui_type: 'image_card_grid' | 'swatch' | 'icon_radio' | 'quantity_delivery' | 'notes_upload' | 'toggle' | 'dropdown' | 'text_input' | 'date_picker';
  required: boolean;
  min_quantity?: number;
  conditional?: { show_if: Record<string, string> };
  options: ConfiguratorOption[];
}

export interface ConfiguratorOption {
  id: string;
  label: string;
  price_modifier: number;
  description?: string;
  image?: string;
  icon?: string;
  color_hex?: string | null;
  layer_key?: string;
  is_express?: boolean;
}

export interface ConfiguratorSchemaDto {
  schemaVersionId: string;
  categorySlug: string;
  basePrice: number;
  moq: number;
  leadTimeStandardDays: number;
  leadTimeExpressDays: number;
  expressPriceMultiplier: number;
  steps: ConfiguratorStep[];
}

// ─── B2B Sampling ────────────────────────────────────────────────────────────

export type SampleStatus =
  | 'requested'
  | 'in_review'
  | 'sample_sent'
  | 'approved'
  | 'rejected'
  | 'revision_requested';

export interface SampleDto {
  id: string;
  userId: string;
  categorySlug: string;
  productName: string;
  description?: string;
  status: SampleStatus;
  version: number;
  parentSampleId?: string;
  configSnapshot: Record<string, unknown>;
  schemaVersionId?: string;
  quantity: number;
  samplingFee?: number;
  samplingFeeRecovered: boolean;
  adminNotes?: string;
  clientNotes?: string;
  referenceFiles: string[];
  approvedAt?: string;
  requestedAt: string;
  updatedAt: string;
  user?: { id: string; fullName: string; companyName?: string; email: string; wholesaleTier?: string };
  revisions?: SampleDto[];
  template?: SampleTemplateDto;
}

export interface SampleTemplateDto {
  id: string;
  sampleId: string;
  name: string;
  description?: string;
  categorySlug: string;
  isPublic: boolean;
  configSnapshot: Record<string, unknown>;
  usageCount: number;
  createdAt: string;
  sample?: Partial<SampleDto>;
}

export interface ConfiguratorAssetDto {
  id: string;
  layerKey: string;
  assetType: ConfiguratorAssetType;
  url: string;
  sortOrder: number;
}

export interface PriceEstimate {
  min: number;
  max: number;
  unitPrice: number;
  currency: string;
  leadTimeDays: number;
  quantityDiscount?: number;
}

export interface CustomOrderDraftDto {
  id: string;
  status: CustomOrderStatus;
  selections: Record<string, string>;
  quantity: number;
  estimatedPrice?: PriceEstimate;
  completionPercent: number;
  notes?: string;
  internalRef?: string;
  referenceFiles?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartDto {
  id: string;
  items: CartItemDto[];
  subtotal: number;
  itemCount: number;
}

export interface CartItemDto {
  id: string;
  productId: string;
  product: Pick<ProductDto, 'id' | 'name' | 'slug' | 'images'>;
  variantId?: string;
  variant?: ProductVariantDto;
  customOrderDraftId?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  itemType: 'standard' | 'custom';
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';
export type OrderType = 'standard' | 'custom' | 'mixed';
export type CustomOrderStatus = 'draft' | 'submitted' | 'quoted' | 'approved' | 'in_production' | 'shipped' | 'cancelled';

export interface OrderDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  currency: string;
  items: OrderItemDto[];
  placedAt: string;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export interface QuoteDto {
  id: string;
  customOrderId: string;
  unitPrice: number;
  totalPrice: number;
  leadTimeDays: number;
  validUntil: string;
  status: 'sent' | 'accepted' | 'declined' | 'expired' | 'revised';
  message?: string;
  pdfUrl?: string;
  sentAt: string;
  respondedAt?: string;
}

export interface QuoteRevisionDto {
  id: string;
  revisionNumber: number;
  unitPrice: number;
  message?: string;
  createdById?: string;
  createdAt: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
