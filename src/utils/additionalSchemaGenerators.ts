/**
 * Additional schema generators for JSON-LD structured data
 * Implements missing schema types from the requirements
 */

interface Product {
  name: string;
  description: string;
  image: string;
  brand: {
    name: string;
    url?: string;
  };
  offers?: {
    price: number;
    priceCurrency: string;
    availability: string;
    url: string;
  };
  sku?: string;
  gtin?: string;
  category?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

interface Event {
  name: string;
  startDate: string;
  endDate?: string;
  location: {
    name: string;
    address: string;
    url?: string;
  };
  description?: string;
  image?: string;
  organizer?: {
    name: string;
    url?: string;
  };
  offers?: {
    price: number;
    priceCurrency: string;
    availability: string;
    url: string;
    validFrom?: string;
  };
  performer?: {
    name: string;
    url?: string;
  };
}

interface Recipe {
  name: string;
  image: string;
  author: {
    name: string;
    url?: string;
  };
  description: string;
  prepTime: string; // ISO 8601 duration format
  cookTime: string; // ISO 8601 duration format
  totalTime: string; // ISO 8601 duration format
  recipeYield: string;
  recipeIngredient: string[];
  recipeInstructions: string[];
  recipeCategory?: string;
  recipeCuisine?: string;
  nutrition?: {
    calories: string;
    fatContent?: string;
    proteinContent?: string;
    carbohydrateContent?: string;
  };
  keywords?: string[];
  suitableForDiet?: string[];
}

interface VideoObject {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration: string; // ISO 8601 duration format
  contentUrl?: string;
  embedUrl?: string;
  publisher: {
    name: string;
    url?: string;
    logo?: string;
  };
  author?: {
    name: string;
    url?: string;
  };
}

/**
 * Generate Product schema
 */
export function generateProductSchema(product: Product) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: product.brand.name
    }
  };

  if (product.brand.url) {
    schema.brand.url = product.brand.url;
  }

  if (product.offers) {
    schema.offers = {
      '@type': 'Offer',
      price: product.offers.price,
      priceCurrency: product.offers.priceCurrency,
      availability: `https://schema.org/${product.offers.availability}`,
      url: product.offers.url
    };
  }

  if (product.sku) {
    schema.sku = product.sku;
  }

  if (product.gtin) {
    schema.gtin = product.gtin;
  }

  if (product.category) {
    schema.category = product.category;
  }

  if (product.aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.aggregateRating.ratingValue,
      reviewCount: product.aggregateRating.reviewCount
    };
  }

  return schema;
}

/**
 * Generate Event schema
 */
export function generateEventSchema(event: Event) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    startDate: event.startDate,
    location: {
      '@type': 'Place',
      name: event.location.name,
      address: event.location.address
    }
  };

  if (event.endDate) {
    schema.endDate = event.endDate;
  }

  if (event.location.url) {
    schema.location.url = event.location.url;
  }

  if (event.description) {
    schema.description = event.description;
  }

  if (event.image) {
    schema.image = event.image;
  }

  if (event.organizer) {
    schema.organizer = {
      '@type': 'Organization',
      name: event.organizer.name
    };

    if (event.organizer.url) {
      schema.organizer.url = event.organizer.url;
    }
  }

  if (event.offers) {
    schema.offers = {
      '@type': 'Offer',
      price: event.offers.price,
      priceCurrency: event.offers.priceCurrency,
      availability: `https://schema.org/${event.offers.availability}`,
      url: event.offers.url
    };

    if (event.offers.validFrom) {
      schema.offers.validFrom = event.offers.validFrom;
    }
  }

  if (event.performer) {
    schema.performer = {
      '@type': 'Person',
      name: event.performer.name
    };

    if (event.performer.url) {
      schema.performer.url = event.performer.url;
    }
  }

  return schema;
}

/**
 * Generate Recipe schema
 */
export function generateRecipeSchema(recipe: Recipe) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    image: recipe.image,
    author: {
      '@type': 'Person',
      name: recipe.author.name
    },
    description: recipe.description,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    totalTime: recipe.totalTime,
    recipeYield: recipe.recipeYield,
    recipeIngredient: recipe.recipeIngredient,
    recipeInstructions: recipe.recipeInstructions.map(instruction => ({
      '@type': 'HowToStep',
      text: instruction
    }))
  };

  if (recipe.author.url) {
    schema.author.url = recipe.author.url;
  }

  if (recipe.recipeCategory) {
    schema.recipeCategory = recipe.recipeCategory;
  }

  if (recipe.recipeCuisine) {
    schema.recipeCuisine = recipe.recipeCuisine;
  }

  if (recipe.nutrition) {
    schema.nutrition = {
      '@type': 'NutritionInformation',
      calories: recipe.nutrition.calories
    };

    if (recipe.nutrition.fatContent) {
      schema.nutrition.fatContent = recipe.nutrition.fatContent;
    }

    if (recipe.nutrition.proteinContent) {
      schema.nutrition.proteinContent = recipe.nutrition.proteinContent;
    }

    if (recipe.nutrition.carbohydrateContent) {
      schema.nutrition.carbohydrateContent = recipe.nutrition.carbohydrateContent;
    }
  }

  if (recipe.keywords && recipe.keywords.length > 0) {
    schema.keywords = recipe.keywords.join(', ');
  }

  if (recipe.suitableForDiet && recipe.suitableForDiet.length > 0) {
    schema.suitableForDiet = recipe.suitableForDiet.map(diet => `https://schema.org/${diet}`);
  }

  return schema;
}

/**
 * Generate VideoObject schema
 */
export function generateVideoSchema(video: VideoObject) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    duration: video.duration,
    publisher: {
      '@type': 'Organization',
      name: video.publisher.name
    }
  };

  if (video.contentUrl) {
    schema.contentUrl = video.contentUrl;
  }

  if (video.embedUrl) {
    schema.embedUrl = video.embedUrl;
  }

  if (video.publisher.url) {
    schema.publisher.url = video.publisher.url;
  }

  if (video.publisher.logo) {
    schema.publisher.logo = {
      '@type': 'ImageObject',
      url: video.publisher.logo
    };
  }

  if (video.author) {
    schema.author = {
      '@type': 'Person',
      name: video.author.name
    };

    if (video.author.url) {
      schema.author.url = video.author.url;
    }
  }

  return schema;
}

interface JobPosting {
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  employmentType: string; // FULL_TIME, PART_TIME, CONTRACTOR, TEMPORARY, INTERN, VOLUNTEER, PER_DIEM, OTHER
  hiringOrganization: {
    name: string;
    sameAs?: string;
    logo?: string;
  };
  jobLocation: {
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
    streetAddress?: string;
  };
  baseSalary?: {
    currency: string;
    value: number | string;
    unitText: string; // HOUR, DAY, WEEK, MONTH, YEAR
  };
  skills?: string;
  qualifications?: string;
  educationRequirements?: string;
  experienceRequirements?: string;
}

/**
 * Generate Product schema
 */
export function generateProductSchema(product: Product) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: product.brand.name
    }
  };

  if (product.brand.url) {
    schema.brand.url = product.brand.url;
  }

  if (product.offers) {
    schema.offers = {
      '@type': 'Offer',
      price: product.offers.price,
      priceCurrency: product.offers.priceCurrency,
      availability: `https://schema.org/${product.offers.availability}`,
      url: product.offers.url
    };
  }

  if (product.sku) schema.sku = product.sku;
  if (product.gtin) schema.gtin = product.gtin;
  if (product.category) schema.category = product.category;

  if (product.aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.aggregateRating.ratingValue,
      reviewCount: product.aggregateRating.reviewCount
    };
  }

  return schema;
}

/**
 * Generate Event schema
 */
export function generateEventSchema(event: Event) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    startDate: event.startDate,
    location: {
      '@type': 'Place',
      name: event.location.name,
      address: event.location.address
    }
  };

  if (event.location.url) {
    schema.location.url = event.location.url;
  }

  if (event.endDate) schema.endDate = event.endDate;
  if (event.description) schema.description = event.description;
  if (event.image) schema.image = event.image;

  if (event.organizer) {
    schema.organizer = {
      '@type': 'Organization',
      name: event.organizer.name
    };
    if (event.organizer.url) schema.organizer.url = event.organizer.url;
  }

  if (event.offers) {
    schema.offers = {
      '@type': 'Offer',
      price: event.offers.price,
      priceCurrency: event.offers.priceCurrency,
      availability: `https://schema.org/${event.offers.availability}`,
      url: event.offers.url
    };
    if (event.offers.validFrom) schema.offers.validFrom = event.offers.validFrom;
  }

  if (event.performer) {
    schema.performer = {
      '@type': 'Person',
      name: event.performer.name
    };
    if (event.performer.url) schema.performer.url = event.performer.url;
  }

  return schema;
}

/**
 * Generate Recipe schema
 */
export function generateRecipeSchema(recipe: Recipe) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    image: recipe.image,
    author: {
      '@type': 'Person',
      name: recipe.author.name
    },
    description: recipe.description,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    totalTime: recipe.totalTime,
    recipeYield: recipe.recipeYield,
    recipeIngredient: recipe.recipeIngredient,
    recipeInstructions: recipe.recipeInstructions.map(step => ({
      '@type': 'HowToStep',
      text: step
    }))
  };

  if (recipe.author.url) schema.author.url = recipe.author.url;
  if (recipe.recipeCategory) schema.recipeCategory = recipe.recipeCategory;
  if (recipe.recipeCuisine) schema.recipeCuisine = recipe.recipeCuisine;
  if (recipe.keywords) schema.keywords = recipe.keywords.join(',');
  if (recipe.suitableForDiet) schema.suitableForDiet = recipe.suitableForDiet.map(diet => `https://schema.org/${diet}`);

  if (recipe.nutrition) {
    schema.nutrition = {
      '@type': 'NutritionInformation',
      calories: recipe.nutrition.calories
    };
    if (recipe.nutrition.fatContent) schema.nutrition.fatContent = recipe.nutrition.fatContent;
    if (recipe.nutrition.proteinContent) schema.nutrition.proteinContent = recipe.nutrition.proteinContent;
    if (recipe.nutrition.carbohydrateContent) schema.nutrition.carbohydrateContent = recipe.nutrition.carbohydrateContent;
  }

  return schema;
}

/**
 * Generate VideoObject schema
 */
export function generateVideoSchema(video: VideoObject) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    duration: video.duration,
    publisher: {
      '@type': 'Organization',
      name: video.publisher.name
    }
  };

  if (video.contentUrl) schema.contentUrl = video.contentUrl;
  if (video.embedUrl) schema.embedUrl = video.embedUrl;
  if (video.publisher.url) schema.publisher.url = video.publisher.url;
  if (video.publisher.logo) {
    schema.publisher.logo = {
      '@type': 'ImageObject',
      url: video.publisher.logo
    };
  }

  if (video.author) {
    schema.author = {
      '@type': 'Person',
      name: video.author.name
    };
    if (video.author.url) schema.author.url = video.author.url;
  }

  return schema;
}

/**
 * Generate JobPosting schema
 */
export function generateJobPostingSchema(job: JobPosting) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.datePosted,
    employmentType: job.employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.hiringOrganization.name
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.jobLocation.addressLocality
      }
    }
  };

  if (job.validThrough) schema.validThrough = job.validThrough;
  if (job.hiringOrganization.sameAs) schema.hiringOrganization.sameAs = job.hiringOrganization.sameAs;
  if (job.hiringOrganization.logo) {
    schema.hiringOrganization.logo = {
      '@type': 'ImageObject',
      url: job.hiringOrganization.logo
    };
  }

  if (job.jobLocation.addressRegion) schema.jobLocation.address.addressRegion = job.jobLocation.addressRegion;
  if (job.jobLocation.postalCode) schema.jobLocation.address.postalCode = job.jobLocation.postalCode;
  if (job.jobLocation.addressCountry) schema.jobLocation.address.addressCountry = job.jobLocation.addressCountry;
  if (job.jobLocation.streetAddress) schema.jobLocation.address.streetAddress = job.jobLocation.streetAddress;

  if (job.baseSalary) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.baseSalary.currency,
      value: {
        '@type': 'QuantitativeValue',
        value: job.baseSalary.value,
        unitText: job.baseSalary.unitText
      }
    };
  }

  if (job.skills) schema.skills = job.skills;
  if (job.qualifications) schema.qualifications = job.qualifications;
  if (job.educationRequirements) schema.educationRequirements = job.educationRequirements;
  if (job.experienceRequirements) schema.experienceRequirements = job.experienceRequirements;

  return schema;
}

/**
 * Schema validation utility
 */
export const SCHEMA_REQUIREMENTS = {
  Article: ['headline', 'datePublished', 'author'],
  Product: ['name', 'description', 'brand'],
  Event: ['name', 'startDate', 'location'],
  Recipe: ['name', 'image', 'author', 'recipeIngredient', 'recipeInstructions'],
  VideoObject: ['name', 'description', 'thumbnailUrl', 'uploadDate', 'duration'],
  JobPosting: ['title', 'description', 'datePosted', 'hiringOrganization', 'jobLocation']
};

/**
 * Validate schema data against requirements
 * Handles both top-level and nested properties
 * @param type - The schema type to validate against
 * @param data - The data object to validate
 * @returns Validation result with missing fields
 */
export function validateSchemaData(type: string, data: any): { valid: boolean; missing: string[] } {
  const requirements = SCHEMA_REQUIREMENTS[type as keyof typeof SCHEMA_REQUIREMENTS];
  
  if (!requirements) {
    return { valid: false, missing: [`Unknown schema type: ${type}`] };
  }
  
  // Handle case where data is null or undefined
  if (data === null || data === undefined) {
    return { valid: false, missing: requirements };
  }
  
  const missing = requirements.filter(field => {
    // Handle nested properties with dot notation (e.g., 'author.name')
    const fieldParts = field.split('.');
    let value = data;
    
    for (const part of fieldParts) {
      if (value === undefined || value === null) return true;
      value = value[part];
    }
    
    // Check if the final value exists and is not empty string
    return value === undefined || value === null || 
           (typeof value === 'string' && value.trim() === '');
  });
  
  return {
    valid: missing.length === 0,
    missing
  };
}