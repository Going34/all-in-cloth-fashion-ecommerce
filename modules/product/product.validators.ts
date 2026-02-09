import { ValidationError } from '@/lib/errors';
import type { CreateProductRequest, ProductListQuery, AdminProductListQuery, CreateProductVariantRequest, UpdateProductRequest } from './product.types';

export function validateProductListQuery(query: Record<string, string | undefined>): ProductListQuery {
  const limit = query.limit ? parseInt(query.limit, 10) : undefined;
  const direction = query.direction === 'prev' ? 'prev' : 'next';

  if (limit !== undefined && (limit < 1 || limit > 100)) {
    throw new ValidationError('Limit must be between 1 and 100', { limit: 'Invalid limit value' });
  }

  return {
    cursor: query.cursor,
    limit: limit || 20,
    direction,
    status: query.status === 'draft' || query.status === 'live' ? query.status : undefined,
    categoryId: query.categoryId,
    featured: query.featured === 'true' ? true : query.featured === 'false' ? false : undefined,
  };
}

export function validateCreateProductRequest(body: unknown): CreateProductRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body is required');
  }

  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.name = 'Product name is required';
  } else if (data.name.length > 200) {
    errors.name = 'Product name must be less than 200 characters';
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.description = 'Product description is required';
  } else if (data.description.length > 5000) {
    errors.description = 'Product description must be less than 5000 characters';
  }

  if (data.base_price === undefined || typeof data.base_price !== 'number') {
    errors.base_price = 'Base price is required and must be a number';
  } else if (data.base_price < 0) {
    errors.base_price = 'Base price must be non-negative';
  }

  if (data.status !== undefined) {
    if (data.status !== 'draft' && data.status !== 'live') {
      errors.status = 'Status must be either "draft" or "live"';
    }
  }

  if (data.featured !== undefined && typeof data.featured !== 'boolean') {
    errors.featured = 'Featured must be a boolean';
  }

  if (data.category_ids !== undefined) {
    if (!Array.isArray(data.category_ids)) {
      errors.category_ids = 'Category IDs must be an array';
    } else if (!data.category_ids.every((id) => typeof id === 'string')) {
      errors.category_ids = 'All category IDs must be strings';
    }
  }

  if (data.variants !== undefined) {
    if (!Array.isArray(data.variants)) {
      errors.variants = 'Variants must be an array';
    } else {
      data.variants.forEach((variant, index) => {
        if (!variant || typeof variant !== 'object') {
          errors[`variants[${index}]`] = 'Variant must be an object';
          return;
        }

        if (!variant.color || typeof variant.color !== 'string') {
          errors[`variants[${index}].color`] = 'Color is required';
        }

        if (!variant.size || typeof variant.size !== 'string') {
          errors[`variants[${index}].size`] = 'Size is required';
        }

        if (variant.price_override !== undefined && variant.price_override !== null) {
          if (typeof variant.price_override !== 'number' || variant.price_override < 0) {
            errors[`variants[${index}].price_override`] = 'Price override must be a non-negative number';
          }
        }

        if (variant.stock !== undefined && (typeof variant.stock !== 'number' || variant.stock < 0)) {
          errors[`variants[${index}].stock`] = 'Stock must be a non-negative number';
        }
      });
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return {
    name: (data.name as string).trim(),
    description: (data.description as string).trim(),
    base_price: data.base_price as number,
    status: data.status as 'draft' | 'live' | undefined,
    featured: data.featured as boolean | undefined,
    category_ids: data.category_ids as string[] | undefined,
    variants: data.variants as CreateProductRequest['variants'],
  };
}

export function validateAdminProductListQuery(query: Record<string, string | undefined>): AdminProductListQuery {
  const page = query.page ? parseInt(query.page, 10) : undefined;
  const limit = query.limit ? parseInt(query.limit, 10) : undefined;

  if (page !== undefined && (page < 1 || isNaN(page))) {
    throw new ValidationError('Page must be a positive integer', { page: 'Invalid page value' });
  }

  if (limit !== undefined && (limit < 1 || limit > 100 || isNaN(limit))) {
    throw new ValidationError('Limit must be between 1 and 100', { limit: 'Invalid limit value' });
  }

  if (query.status && query.status !== 'draft' && query.status !== 'live') {
    throw new ValidationError('Status must be either "draft" or "live"', { status: 'Invalid status' });
  }

  const validSorts = ['name:asc', 'name:desc', 'created_at:asc', 'created_at:desc', 'price:asc', 'price:desc'];
  if (query.sort && !validSorts.includes(query.sort)) {
    throw new ValidationError(`Sort must be one of: ${validSorts.join(', ')}`, { sort: 'Invalid sort value' });
  }

  return {
    page: page || 1,
    limit: limit || 10,
    search: query.search,
    category: query.category,
    status: query.status as AdminProductListQuery['status'],
    sort: (query.sort as AdminProductListQuery['sort']) || 'created_at:desc',
  };
}

export function validateUpdateProductRequest(body: unknown): UpdateProductRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body is required');
  }

  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // All fields are optional for updates
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.name = 'Product name must be a non-empty string';
    } else if (data.name.length > 200) {
      errors.name = 'Product name must be less than 200 characters';
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== 'string' || data.description.trim().length === 0) {
      errors.description = 'Product description must be a non-empty string';
    } else if (data.description.length > 5000) {
      errors.description = 'Product description must be less than 5000 characters';
    }
  }

  if (data.base_price !== undefined) {
    if (typeof data.base_price !== 'number') {
      errors.base_price = 'Base price must be a number';
    } else if (data.base_price < 0) {
      errors.base_price = 'Base price must be non-negative';
    }
  }

  if (data.status !== undefined) {
    if (data.status !== 'draft' && data.status !== 'live') {
      errors.status = 'Status must be either "draft" or "live"';
    }
  }

  if (data.featured !== undefined && typeof data.featured !== 'boolean') {
    errors.featured = 'Featured must be a boolean';
  }

  // Handle both categoryIds (camelCase) and category_ids (snake_case) for backwards compatibility
  const categoryIds = data.category_ids || data.categoryIds;
  if (categoryIds !== undefined) {
    if (!Array.isArray(categoryIds)) {
      errors.category_ids = 'Category IDs must be an array';
    } else if (!categoryIds.every((id) => typeof id === 'string')) {
      errors.category_ids = 'All category IDs must be strings';
    }
  }

  if (data.variants !== undefined) {
    if (!Array.isArray(data.variants)) {
      errors.variants = 'Variants must be an array';
    } else {
      data.variants.forEach((variant, index) => {
        if (!variant || typeof variant !== 'object') {
          errors[`variants[${index}]`] = 'Variant must be an object';
          return;
        }

        // ID is optional (for new variants)
        if (variant.id !== undefined && typeof variant.id !== 'string') {
          errors[`variants[${index}].id`] = 'Variant ID must be a string';
        }

        if (variant.color === undefined || typeof variant.color !== 'string' || variant.color.trim().length === 0) {
          errors[`variants[${index}].color`] = 'Color is required';
        }

        if (variant.size === undefined || typeof variant.size !== 'string' || variant.size.trim().length === 0) {
          errors[`variants[${index}].size`] = 'Size is required';
        }

        if (variant.sku !== undefined && typeof variant.sku !== 'string') {
          errors[`variants[${index}].sku`] = 'SKU must be a string';
        }

        if (variant.price_override !== undefined && variant.price_override !== null) {
          if (typeof variant.price_override !== 'number' || variant.price_override < 0) {
            errors[`variants[${index}].price_override`] = 'Price override must be a non-negative number';
          }
        }

        if (variant.stock !== undefined) {
          if (typeof variant.stock !== 'number' || variant.stock < 0) {
            errors[`variants[${index}].stock`] = 'Stock must be a non-negative number';
          }
        }

        if (variant.low_stock_threshold !== undefined) {
          if (typeof variant.low_stock_threshold !== 'number' || variant.low_stock_threshold < 0) {
            errors[`variants[${index}].low_stock_threshold`] = 'Low stock threshold must be a non-negative number';
          }
        }

        if (variant.is_active !== undefined && typeof variant.is_active !== 'boolean') {
          errors[`variants[${index}].is_active`] = 'is_active must be a boolean';
        }

        if (variant.images !== undefined) {
          if (!Array.isArray(variant.images)) {
            errors[`variants[${index}].images`] = 'Images must be an array';
          } else if (!variant.images.every((img: unknown) => typeof img === 'string')) {
            errors[`variants[${index}].images`] = 'All images must be strings';
          }
        }
      });
    }
  }

  if (data.images !== undefined) {
    if (!Array.isArray(data.images)) {
      errors.images = 'Images must be an array';
    } else if (!data.images.every((img: unknown) => typeof img === 'string')) {
      errors.images = 'All images must be strings';
    }
  }

  if (data.primaryImageIndex !== undefined) {
    if (typeof data.primaryImageIndex !== 'number' || data.primaryImageIndex < 0) {
      errors.primaryImageIndex = 'Primary image index must be a non-negative number';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  // Normalize categoryIds to category_ids
  const normalizedCategoryIds = data.category_ids as string[] | undefined || data.categoryIds as string[] | undefined;

  return {
    name: data.name !== undefined ? (data.name as string).trim() : undefined,
    description: data.description !== undefined ? (data.description as string).trim() : undefined,
    base_price: data.base_price as number | undefined,
    status: data.status as 'draft' | 'live' | undefined,
    featured: data.featured as boolean | undefined,
    category_ids: normalizedCategoryIds,
    variants: data.variants as CreateProductVariantRequest[] | undefined,
    images: data.images as string[] | undefined,
    primaryImageIndex: data.primaryImageIndex as number | undefined,
  };
}

