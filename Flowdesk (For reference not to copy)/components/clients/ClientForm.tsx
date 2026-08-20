"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Client } from "@/types";
import { useEffect } from "react";
import { X } from "lucide-react";

const clientFormSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  company: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().default("INR"),
  status: z.enum(["active", "inactive", "lead"]).default("active"),
  notes: z.string().optional(),
  tagsString: z.string().optional(), // processed to tags array
});

interface ClientFormProps {
  client?: Client | null;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

export default function ClientForm({ client, onSave, onClose }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      country: "",
      currency: "INR",
      status: "active" as const,
      notes: "",
      tagsString: "",
    },
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name || "",
        company: client.company || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        country: client.country || "",
        currency: client.currency || "INR",
        status: client.status || "active",
        notes: client.notes || "",
        tagsString: client.tags ? client.tags.join(", ") : "",
      });
    } else {
      reset({
        name: "",
        company: "",
        email: "",
        phone: "",
        address: "",
        country: "",
        currency: "INR",
        status: "active",
        notes: "",
        tagsString: "",
      });
    }
  }, [client, reset]);

  const onSubmit = async (values: any) => {
    const tags = values.tagsString
      ? values.tagsString
          .split(",")
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0)
      : [];
    
    const { tagsString, ...rest } = values;
    await onSave({ ...rest, tags });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-elevated border border-border rounded-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-surface">
          <h2 className="font-display text-[18px] text-text-primary">
            {client ? "Edit Client" : "New Client"}
          </h2>
          <button 
            onClick={onClose} 
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          {/* Row: Name & Company */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                Client Name *
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="Sofia Reyes"
                className={`w-full bg-subtle border ${errors.name ? 'border-danger' : 'border-border'} focus:border-border-accent rounded-md px-3 py-2 text-sm text-text-primary outline-none transition-colors`}
              />
              {errors.name && (
                <p className="text-[10px] text-danger mt-1">{errors.name.message as string}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                {...register("company")}
                placeholder="Reyes Digital"
                className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-sm text-text-primary outline-none transition-colors"
              />
            </div>
          </div>

          {/* Row: Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                Email Address
              </label>
              <input
                type="text"
                {...register("email")}
                placeholder="sofia@reyes.co"
                className={`w-full bg-subtle border ${errors.email ? 'border-danger' : 'border-border'} focus:border-border-accent rounded-md px-3 py-2 text-sm text-text-primary outline-none transition-colors`}
              />
              {errors.email && (
                <p className="text-[10px] text-danger mt-1">{errors.email.message as string}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                {...register("phone")}
                placeholder="+91 98765 43210"
                className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-sm text-text-primary outline-none transition-colors"
              />
            </div>
          </div>

          {/* Row: Address & Country */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                Billing Address
              </label>
              <input
                type="text"
                {...register("address")}
                placeholder="12 Barakhamba Rd"
                className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-sm text-text-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                Country
              </label>
              <input
                type="text"
                {...register("country")}
                placeholder="India"
                className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-sm text-text-primary outline-none transition-colors"
              />
            </div>
          </div>

          {/* Row: Preferred Currency & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                Preferred Currency
              </label>
              <select
                {...register("currency")}
                className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2.5 text-sm text-text-primary outline-none transition-colors"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED (Dh)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="SGD">SGD (S$)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                Client Status
              </label>
              <select
                {...register("status")}
                className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2.5 text-sm text-text-primary outline-none transition-colors"
              >
                <option value="active">Active</option>
                <option value="lead">Lead</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              {...register("tagsString")}
              placeholder="retainer, ui-ux, design"
              className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-sm text-text-primary outline-none transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
              Private Notes
            </label>
            <textarea
              {...register("notes")}
              placeholder="Any details about preferred billing schedules, references..."
              rows={3}
              className="w-full bg-subtle border border-border focus:border-border-accent rounded-md px-3 py-2 text-sm text-text-primary outline-none transition-colors resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent border border-border-strong text-text-primary text-[11px] font-semibold px-4 py-2.5 rounded-md hover:bg-subtle transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent text-[#0C0C0E] text-[11px] font-semibold px-4 py-2.5 rounded-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : client ? "Update Client" : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
