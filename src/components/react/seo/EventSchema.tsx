/**
 * EventSchema.tsx - React component for Event structured data
 * 
 * This component provides a specialized implementation for Event schema.org data
 * using the react-schemaorg library.
 */

import React from 'react';
import { JsonLd } from 'react-schemaorg';
import { Event, WithContext } from 'schema-dts';

export const EventSchema = ({
  name,
  startDate,
  endDate,
  location,
  description,
  image,
  organizer,
  offers,
  performer
}: {
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
}) => {
  const eventData: Event = {
    '@type': 'Event',
    name,
    startDate,
    endDate,
    description,
    image,
    location: {
      '@type': 'Place',
      name: location.name,
      address: location.address,
      url: location.url
    }
  };

  if (organizer) {
    eventData.organizer = {
      '@type': 'Organization',
      name: organizer.name,
      url: organizer.url
    };
  }

  if (offers) {
    eventData.offers = {
      '@type': 'Offer',
      price: offers.price,
      priceCurrency: offers.priceCurrency,
      availability: `https://schema.org/${offers.availability}`,
      url: offers.url,
      validFrom: offers.validFrom
    };
  }

  if (performer) {
    eventData.performer = {
      '@type': 'Person',
      name: performer.name,
      url: performer.url
    };
  }

  return (
    <JsonLd<WithContext<Event>>
      item={{
        '@context': 'https://schema.org',
        ...eventData
      }}
    />
  );
};