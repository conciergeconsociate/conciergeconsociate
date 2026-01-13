export const mockServices = [
  {
    id: "1",
    title: "Personal Concierge",
    shortDescription: "Dedicated assistance for all your personal needs",
    detailedDescription: "Our personal concierge service provides you with a dedicated professional who handles everything from scheduling appointments to managing your daily tasks. We ensure your life runs smoothly while you focus on what matters most.",
    category: "Lifestyle",
    images: ["/placeholder.svg"],
    videos: [],
    hidden: false,
  },
  {
    id: "2",
    title: "Event Planning",
    shortDescription: "Exquisite events tailored to perfection",
    detailedDescription: "From intimate gatherings to grand celebrations, our event planning service ensures every detail is meticulously crafted. We handle venue selection, catering, entertainment, and all logistics to create unforgettable experiences.",
    category: "Events",
    images: ["/placeholder.svg"],
    videos: [],
    hidden: false,
  },
  {
    id: "3",
    title: "Travel Arrangements",
    shortDescription: "Seamless luxury travel experiences",
    detailedDescription: "Experience stress-free travel with our comprehensive travel arrangement service. We handle flight bookings, hotel reservations, itinerary planning, and special requests to ensure your journey is comfortable and memorable.",
    category: "Travel",
    images: ["/placeholder.svg"],
    videos: [],
    hidden: false,
  },
  {
    id: "4",
    title: "Shopping Assistant",
    shortDescription: "Personal shopping for the discerning client",
    detailedDescription: "Our shopping assistants provide personalized shopping experiences, whether it's fashion, gifts, or specialty items. We source the finest products and handle all purchasing and delivery arrangements.",
    category: "Lifestyle",
    images: ["/placeholder.svg"],
    videos: [],
    hidden: false,
  },
];

export const mockVenues = [
  {
    id: "1",
    name: "The Grand Ballroom",
    shortDescription: "Elegant venue for prestigious events",
    detailedDescription: "A stunning ballroom featuring crystal chandeliers, marble floors, and capacity for up to 500 guests. Perfect for weddings, corporate events, and gala dinners.",
    category: "Event Spaces",
    niche: "Luxury",
    address: "123 Victoria Island, Lagos",
    weekdayHours: "9:00 AM - 11:00 PM",
    sundayHours: "10:00 AM - 10:00 PM",
    mapUrl: "https://maps.google.com",
    images: ["/placeholder.svg"],
    hidden: false,
  },
  {
    id: "2",
    name: "Skyline Restaurant",
    shortDescription: "Fine dining with panoramic city views",
    detailedDescription: "Experience culinary excellence at our rooftop restaurant offering breathtaking views and world-class cuisine prepared by award-winning chefs.",
    category: "Dining",
    niche: "Fine Dining",
    address: "456 Ikoyi Heights, Lagos",
    weekdayHours: "12:00 PM - 12:00 AM",
    sundayHours: "12:00 PM - 11:00 PM",
    mapUrl: "https://maps.google.com",
    images: ["/placeholder.svg"],
    hidden: false,
  },
];

export const mockBlogs = [
  {
    id: "1",
    title: "The Art of Luxury Living",
    excerpt: "Discover how our concierge services elevate your lifestyle to new heights of comfort and sophistication.",
    content: "Full blog content here...",
    author: "Consociate Team",
    date: "2025-01-15",
    image: "/placeholder.svg",
    category: "Lifestyle",
  },
  {
    id: "2",
    title: "Planning the Perfect Event",
    excerpt: "Expert tips and insights on creating memorable events that leave lasting impressions.",
    content: "Full blog content here...",
    author: "Consociate Team",
    date: "2025-01-10",
    image: "/placeholder.svg",
    category: "Events",
  },
];

export const mockMembershipPlans = [
  {
    id: "1",
    name: "Silver",
    duration: "Monthly",
    price: 50000,
    currency: "NGN",
    benefits: [
      "24/7 concierge support",
      "Basic event planning assistance",
      "Priority customer service",
      "Monthly lifestyle newsletter",
    ],
    coverImage: "/placeholder.svg",
    showOnWebsite: true,
  },
  {
    id: "2",
    name: "Gold",
    duration: "Monthly",
    price: 100000,
    currency: "NGN",
    benefits: [
      "All Silver benefits",
      "Personal shopping assistant",
      "Complimentary event planning (1 per quarter)",
      "Exclusive venue access",
      "Travel concierge services",
    ],
    coverImage: "/placeholder.svg",
    showOnWebsite: true,
  },
  {
    id: "3",
    name: "Platinum",
    duration: "Monthly",
    price: 250000,
    currency: "NGN",
    benefits: [
      "All Gold benefits",
      "Dedicated concierge manager",
      "Unlimited event planning",
      "VIP venue reservations",
      "Priority travel arrangements",
      "Luxury gift sourcing",
    ],
    coverImage: "/placeholder.svg",
    showOnWebsite: true,
  },
];

export const mockFAQs = [
  {
    id: "1",
    question: "What services does Consociate Concierge offer?",
    answer: "We offer a comprehensive range of concierge services including personal assistance, event planning, travel arrangements, shopping services, and exclusive venue access.",
  },
  {
    id: "2",
    question: "How do I become a member?",
    answer: "You can become a member by selecting a membership plan that suits your needs and completing the registration process. Our team will contact you to finalize your membership.",
  },
  {
    id: "3",
    question: "What are the membership benefits?",
    answer: "Membership benefits vary by tier and include 24/7 concierge support, priority services, exclusive venue access, and personalized assistance tailored to your lifestyle needs.",
  },
  {
    id: "4",
    question: "Can I cancel my membership?",
    answer: "Yes, you can cancel your membership at any time. Please contact our support team for assistance with cancellation procedures.",
  },
  {
    id: "5",
    question: "Do you offer corporate packages?",
    answer: "Yes, we offer customized corporate packages for businesses seeking premium concierge services for their executives and clients. Contact us for more information.",
  },
];

export const mockTestimonials = [
  {
    id: "1",
    name: "Chioma Adeleke",
    role: "Business Executive",
    content: "Consociate Concierge has transformed how I manage my busy life. Their attention to detail and professionalism is unmatched.",
    rating: 5,
    image: "/placeholder.svg",
  },
  {
    id: "2",
    name: "Tunde Okonkwo",
    role: "Entrepreneur",
    content: "The event planning service exceeded all expectations. Every detail was perfect, and our guests were thoroughly impressed.",
    rating: 5,
    image: "/placeholder.svg",
  },
  {
    id: "3",
    name: "Amara Johnson",
    role: "Creative Director",
    content: "Having a dedicated concierge service has given me more time to focus on my work. Highly recommended!",
    rating: 5,
    image: "/placeholder.svg",
  },
];

export const mockContactInfo = {
  address: "123 Victoria Island, Lagos, Nigeria",
  emails: ["info@consociateconcierge.com", "support@consociateconcierge.com"],
  phones: ["+234 123 456 7890", "+234 098 765 4321", "+234 111 222 3333"],
  socialMedia: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    whatsapp: "https://wa.me/234123456789",
  },
};
