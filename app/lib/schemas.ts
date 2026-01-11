import { z } from "zod";

// Zod schema for ticket creation
export const createTicketSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description must be less than 2000 characters"),
  category: z.enum(['plumbing', 'electrical', 'hvac', 'cleaning', 'other'], {
    message: "Category must be one of: plumbing, electrical, hvac, cleaning, other"
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    message: "Priority must be one of: low, medium, high, urgent"
  }),
  status: z.enum(['open', 'assigned', 'accepted', 'in_progress', 'completed']).optional(),
  location: z.string().min(1, "Location is required").max(200),
  contactPhone: z.string().optional(),
  imageUrls: z.array(z.string().url("Invalid image URL")).optional().default([]),
  imagePublicIds: z.array(z.string()).optional().default([]),
  createdByName: z.string().min(1, "Creator name is required"),
  buildingId: z.string().min(1, "Building ID is required"),
  uid: z.string().min(1, "User ID is required"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
