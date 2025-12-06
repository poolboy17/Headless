// Tour and city data for Viator affiliate integration

export interface City {
  id: string;
  label: string;
  country: string;
  viatorDest: string;
  description: string;
  imageUrl: string;
}

export interface Tour {
  id: string;
  title: string;
  cityId: string;
  type: string;
  price: string;
  rating: number;
  reviewCount: number;
  duration: string;
  groupSize: string;
  imageUrl: string;
  viatorUrl: string;
  description: string;
}

// Viator affiliate Partner ID
export const VIATOR_PID = 'P00166886';

// Helper to append affiliate PID to Viator URLs
export function getAffiliateUrl(baseUrl: string): string {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}pid=${VIATOR_PID}`;
}

// Cities data - ordered by popularity
export const cities: City[] = [
  { 
    id: 'new-orleans', 
    label: 'New Orleans', 
    country: 'USA', 
    viatorDest: 'd675',
    description: 'The most haunted city in America, known for its voodoo history, above-ground cemeteries, and ghostly French Quarter.',
    imageUrl: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800&h=600&fit=crop'
  },
  { 
    id: 'london', 
    label: 'London', 
    country: 'UK', 
    viatorDest: 'd737',
    description: 'From Jack the Ripper to the Tower of London, experience centuries of dark history and paranormal activity.',
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop'
  },
  { 
    id: 'edinburgh', 
    label: 'Edinburgh', 
    country: 'UK', 
    viatorDest: 'd739',
    description: 'Explore the underground vaults, haunted closes, and centuries-old graveyards of Scotland\'s capital.',
    imageUrl: 'https://images.unsplash.com/photo-1594732832278-abd644401426?w=800&h=600&fit=crop'
  },
  { 
    id: 'savannah', 
    label: 'Savannah', 
    country: 'USA', 
    viatorDest: 'd4283',
    description: 'America\'s most haunted city with Spanish moss-draped squares and historic homes with resident spirits.',
    imageUrl: 'https://images.unsplash.com/photo-1596394723269-b2cbca4e6313?w=800&h=600&fit=crop'
  },
  { 
    id: 'salem', 
    label: 'Salem', 
    country: 'USA', 
    viatorDest: 'd50249',
    description: 'Site of the infamous witch trials, this historic city embraces its dark past year-round.',
    imageUrl: 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=800&h=600&fit=crop'
  },
  { 
    id: 'chicago', 
    label: 'Chicago', 
    country: 'USA', 
    viatorDest: 'd673',
    description: 'Gangster ghosts, haunted theaters, and paranormal hot spots throughout the Windy City.',
    imageUrl: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&h=600&fit=crop'
  },
  { 
    id: 'new-york', 
    label: 'New York', 
    country: 'USA', 
    viatorDest: 'd687',
    description: 'Haunted hotels, ghostly Greenwich Village, and centuries of dark history in the Big Apple.',
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop'
  },
  { 
    id: 'boston', 
    label: 'Boston', 
    country: 'USA', 
    viatorDest: 'd678',
    description: 'Revolutionary ghosts, haunted burial grounds, and centuries of American history come alive after dark.',
    imageUrl: 'https://images.unsplash.com/photo-1501979376754-1d09c6d5deef?w=800&h=600&fit=crop'
  },
  { 
    id: 'gettysburg', 
    label: 'Gettysburg', 
    country: 'USA', 
    viatorDest: 'd22093',
    description: 'One of the most paranormally active battlefields in the world, where Civil War spirits linger.',
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop'
  },
  { 
    id: 'st-augustine', 
    label: 'St. Augustine', 
    country: 'USA', 
    viatorDest: 'd4282',
    description: 'America\'s oldest city with 450 years of history, hauntings, and paranormal encounters.',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'
  },
  { 
    id: 'charleston', 
    label: 'Charleston', 
    country: 'USA', 
    viatorDest: 'd4384',
    description: 'Southern charm meets supernatural with haunted plantations and ghostly graveyards.',
    imageUrl: 'https://images.unsplash.com/photo-1569025743873-ea3a9ber956?w=800&h=600&fit=crop'
  },
  { 
    id: 'dublin', 
    label: 'Dublin', 
    country: 'Ireland', 
    viatorDest: 'd503',
    description: 'Celtic legends, haunted pubs, and centuries of ghostly tales in Ireland\'s capital.',
    imageUrl: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800&h=600&fit=crop'
  },
];

// Get city by ID
export function getCityById(id: string): City | undefined {
  return cities.find(city => city.id === id);
}

// Get all city IDs for static generation
export function getAllCityIds(): string[] {
  return cities.map(city => city.id);
}

// Tour types
export const tourTypes = [
  { id: 'walking', label: 'Walking Tours' },
  { id: 'bus', label: 'Bus Tours' },
  { id: 'ghost-hunt', label: 'Ghost Hunts' },
  { id: 'night', label: 'Night Tours' },
];

// Curated tours data
export const tours: Tour[] = [
  {
    id: '1',
    title: 'French Quarter Haunted Walking Tour',
    cityId: 'new-orleans',
    type: 'walking',
    price: '$25',
    rating: 4.8,
    reviewCount: 2450,
    duration: '2 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/New-Orleans/d675-ttd/g21-Walking-Tours?tag1=21&tag2=11292',
    description: 'Explore the haunted streets of the French Quarter with expert guides sharing tales of voodoo and ghosts.',
  },
  {
    id: '2',
    title: 'New Orleans Ghost Bus Tour',
    cityId: 'new-orleans',
    type: 'bus',
    price: '$35',
    rating: 4.7,
    reviewCount: 1890,
    duration: '2.5 hours',
    groupSize: 'Group tour',
    imageUrl: 'https://images.unsplash.com/photo-1509128841709-6c13b25058a3?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/New-Orleans/d675-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Cover more haunted ground in comfort on this comprehensive bus tour of New Orleans\' most paranormal locations.',
  },
  {
    id: '3',
    title: 'Cemetery and Voodoo Walking Tour',
    cityId: 'new-orleans',
    type: 'walking',
    price: '$30',
    rating: 4.9,
    reviewCount: 1567,
    duration: '2 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1509475826633-fed577a2c71b?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/New-Orleans/d675-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Visit the famous above-ground cemeteries and learn about New Orleans\' voodoo traditions.',
  },
  {
    id: '4',
    title: 'Savannah Ghost Walking Tour',
    cityId: 'savannah',
    type: 'walking',
    price: '$20',
    rating: 4.9,
    reviewCount: 3200,
    duration: '1.5 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1596394723269-b2cbca4e6313?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Savannah/d4283-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Discover why Savannah is considered America\'s most haunted city on this spine-chilling walking tour.',
  },
  {
    id: '5',
    title: 'Savannah Trolley Ghost Tour',
    cityId: 'savannah',
    type: 'bus',
    price: '$35',
    rating: 4.7,
    reviewCount: 1234,
    duration: '2 hours',
    groupSize: 'Group tour',
    imageUrl: 'https://images.unsplash.com/photo-1596394516628-96fe4c559c23?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Savannah/d4283-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Ride through Savannah\'s haunted squares and historic districts on an old-fashioned trolley.',
  },
  {
    id: '6',
    title: 'Salem Witch City Walking Tour',
    cityId: 'salem',
    type: 'walking',
    price: '$25',
    rating: 4.8,
    reviewCount: 1567,
    duration: '1.5 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Salem/d50249-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Walk the streets where the infamous witch trials took place and hear the real stories.',
  },
  {
    id: '7',
    title: 'Salem Night Ghost Hunt',
    cityId: 'salem',
    type: 'ghost-hunt',
    price: '$40',
    rating: 4.6,
    reviewCount: 890,
    duration: '2 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Salem/d50249-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Use paranormal investigation equipment to hunt for spirits in Salem\'s most haunted locations.',
  },
  {
    id: '8',
    title: 'Edinburgh Underground Vaults Tour',
    cityId: 'edinburgh',
    type: 'ghost-hunt',
    price: '$15',
    rating: 4.7,
    reviewCount: 2890,
    duration: '1.5 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1594732832278-abd644401426?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Edinburgh/d739-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Descend into the haunted underground vaults beneath Edinburgh\'s Royal Mile.',
  },
  {
    id: '9',
    title: 'Edinburgh Graveyard Night Tour',
    cityId: 'edinburgh',
    type: 'night',
    price: '$18',
    rating: 4.8,
    reviewCount: 1456,
    duration: '1.5 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1594732832278-abd644401426?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Edinburgh/d739-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Visit the famous Greyfriars Kirkyard and other haunted burial grounds after dark.',
  },
  {
    id: '10',
    title: 'Jack the Ripper Walking Tour',
    cityId: 'london',
    type: 'walking',
    price: '$15',
    rating: 4.6,
    reviewCount: 4560,
    duration: '2 hours',
    groupSize: 'Group tour',
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/searchResults/all?text=jack+the+ripper+london&destId=737',
    description: 'Follow in the footsteps of history\'s most infamous serial killer through Whitechapel.',
  },
  {
    id: '11',
    title: 'Tower of London Ghost Tour',
    cityId: 'london',
    type: 'night',
    price: '$25',
    rating: 4.7,
    reviewCount: 2345,
    duration: '2 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/London/d737-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Explore the Tower of London and hear tales of its many ghostly residents.',
  },
  {
    id: '12',
    title: 'Gettysburg Battlefield Ghost Tour',
    cityId: 'gettysburg',
    type: 'night',
    price: '$20',
    rating: 4.8,
    reviewCount: 1234,
    duration: '2 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Gettysburg/d22093-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Visit the most paranormally active Civil War battlefield in America after dark.',
  },
  {
    id: '13',
    title: 'Gettysburg Ghost Hunt Experience',
    cityId: 'gettysburg',
    type: 'ghost-hunt',
    price: '$45',
    rating: 4.9,
    reviewCount: 567,
    duration: '3 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Gettysburg/d22093-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Use professional paranormal equipment to investigate Gettysburg\'s most haunted locations.',
  },
  {
    id: '14',
    title: 'St. Augustine Ghost Trolley Tour',
    cityId: 'st-augustine',
    type: 'bus',
    price: '$25',
    rating: 4.7,
    reviewCount: 987,
    duration: '1.5 hours',
    groupSize: 'Group tour',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/St-Augustine/d4282-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Tour America\'s oldest city and its most haunted locations by trolley.',
  },
  {
    id: '15',
    title: 'St. Augustine Walking Ghost Tour',
    cityId: 'st-augustine',
    type: 'walking',
    price: '$20',
    rating: 4.8,
    reviewCount: 1123,
    duration: '1.5 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/St-Augustine/d4282-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Walk through 450 years of history and hauntings in America\'s oldest city.',
  },
  {
    id: '16',
    title: 'Chicago Gangsters & Ghosts Tour',
    cityId: 'chicago',
    type: 'bus',
    price: '$40',
    rating: 4.7,
    reviewCount: 1567,
    duration: '2.5 hours',
    groupSize: 'Group tour',
    imageUrl: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Chicago/d673-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Explore Chicago\'s dark history of gangsters, ghosts, and unsolved mysteries.',
  },
  {
    id: '17',
    title: 'Chicago Haunted Pub Tour',
    cityId: 'chicago',
    type: 'walking',
    price: '$35',
    rating: 4.6,
    reviewCount: 890,
    duration: '2 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Chicago/d673-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Visit Chicago\'s most haunted bars and pubs while enjoying local spirits.',
  },
  {
    id: '18',
    title: 'NYC Greenwich Village Ghost Walk',
    cityId: 'new-york',
    type: 'walking',
    price: '$25',
    rating: 4.7,
    reviewCount: 2345,
    duration: '2 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/New-York/d687-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Explore the haunted history of Greenwich Village on this atmospheric walking tour.',
  },
  {
    id: '19',
    title: 'Boston Freedom Trail Ghost Tour',
    cityId: 'boston',
    type: 'walking',
    price: '$25',
    rating: 4.8,
    reviewCount: 1234,
    duration: '1.5 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1501979376754-1d09c6d5deef?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Boston/d678-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Walk the Freedom Trail after dark and encounter revolutionary ghosts.',
  },
  {
    id: '20',
    title: 'Charleston Ghost & Graveyard Tour',
    cityId: 'charleston',
    type: 'walking',
    price: '$25',
    rating: 4.8,
    reviewCount: 1567,
    duration: '1.5 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1569025743873-ea3a9ber956?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Charleston/d4384-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Explore Charleston\'s haunted streets and historic graveyards after dark.',
  },
  {
    id: '21',
    title: 'Dublin Haunted Pub Tour',
    cityId: 'dublin',
    type: 'walking',
    price: '$20',
    rating: 4.6,
    reviewCount: 890,
    duration: '2 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Dublin/d503-ttd/g6-Ghost-and-Vampire-Tours',
    description: 'Visit Dublin\'s most haunted pubs and hear tales of ghostly encounters.',
  },
];

// Get tours by city ID with pagination
export function getToursByCity(cityId: string, page: number = 1, perPage: number = 6): {
  tours: Tour[];
  totalTours: number;
  totalPages: number;
  currentPage: number;
} {
  const cityTours = tours.filter(tour => tour.cityId === cityId);
  const totalTours = cityTours.length;
  const totalPages = Math.max(1, Math.ceil(totalTours / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedTours = cityTours.slice(startIndex, startIndex + perPage);
  
  return {
    tours: paginatedTours,
    totalTours,
    totalPages,
    currentPage,
  };
}

// Get Viator search URL for a city
export function getCityViatorUrl(city: City): string {
  return getAffiliateUrl(`https://www.viator.com/searchResults/all?text=ghost+haunted+tour&destId=${city.viatorDest.replace('d', '')}`);
}
