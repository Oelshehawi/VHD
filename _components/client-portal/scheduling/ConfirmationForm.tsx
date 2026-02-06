"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Checkbox } from "../../ui/checkbox";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { Label } from "../../ui/label";

const confirmationSchema = z
  .object({
    addressConfirmed: z.boolean(),
    preferredContact: z.enum(["phone", "email", "either", "other"]),
    customContactMethod: z.string().optional(),
    onSiteContactName: z.string().min(1, "On-site contact name is required"),
    onSiteContactPhone: z
      .string()
      .min(1, "On-site contact phone is required")
      .regex(/^[\d\s\-().+]+$/, "Please enter a valid phone number")
      .refine(
        (val) => val.replace(/\D/g, "").length >= 10,
        "Phone number must have at least 10 digits",
      ),
    specialInstructions: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.addressConfirmed) {
        return true;
      }
      return Boolean(
        data.specialInstructions && data.specialInstructions.trim(),
      );
    },
    {
      message:
        "Address may be incorrect. Please add the correct service address in Special Instructions.",
      path: ["specialInstructions"],
    },
  )
  .refine(
    (data) => {
      if (data.preferredContact === "other") {
        return data.customContactMethod && data.customContactMethod.length > 0;
      }
      return true;
    },
    {
      message: "Please provide your preferred contact method",
      path: ["customContactMethod"],
    },
  );

export type ConfirmationDetails = z.infer<typeof confirmationSchema>;

interface ConfirmationFormProps {
  location: string;
  clientEmail?: string;
  clientPhone?: string;
  initialDetails?: Partial<ConfirmationDetails>;
  onSubmit: (details: ConfirmationDetails) => void;
  onBack: (currentValues: Partial<ConfirmationDetails>) => void;
}

export default function ConfirmationForm({
  location,
  clientEmail,
  clientPhone,
  initialDetails,
  onSubmit,
  onBack,
}: ConfirmationFormProps) {
  const form = useForm<ConfirmationDetails>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: {
      addressConfirmed: initialDetails?.addressConfirmed ?? false,
      preferredContact: initialDetails?.preferredContact ?? "either",
      customContactMethod: initialDetails?.customContactMethod ?? "",
      onSiteContactName: initialDetails?.onSiteContactName ?? "",
      onSiteContactPhone: initialDetails?.onSiteContactPhone ?? "",
      specialInstructions: initialDetails?.specialInstructions ?? "",
    },
  });

  const preferredContact = useWatch({
    control: form.control,
    name: "preferredContact",
  });
  const addressConfirmed = useWatch({
    control: form.control,
    name: "addressConfirmed",
  });

  const handleSubmit = (data: ConfirmationDetails) => {
    onSubmit(data);
  };

  const handleBack = () => {
    // Save current form values when going back
    onBack(form.getValues());
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Top Row: Service Address + Contact Preference (side by side on desktop) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Address Confirmation */}
          <Card>
            <CardContent>
              <h4 className="text-foreground mb-3 font-medium">
                Service Address
              </h4>
              <Input
                value={location}
                disabled
                className="text-foreground bg-muted mb-3"
              />
              <FormField
                control={form.control}
                name="addressConfirmed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>This is the correct service address</FormLabel>
                      <FormDescription>
                        If this is wrong, leave unchecked and add the correct
                        service address in Special Instructions below.
                      </FormDescription>
                      {!addressConfirmed && (
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Please include the full corrected service address
                          below so we can update it before scheduling.
                        </p>
                      )}
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Preference */}
          <Card>
            <CardContent>
              <FormField
                control={form.control}
                name="preferredContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      How should we contact you about your appointment?
                    </FormLabel>
                    {(clientEmail || clientPhone) && (
                      <FormDescription>
                        We have on file:{" "}
                        {clientPhone && (
                          <span className="font-medium">{clientPhone}</span>
                        )}
                        {clientPhone && clientEmail && " • "}
                        {clientEmail && (
                          <span className="font-medium">{clientEmail}</span>
                        )}
                      </FormDescription>
                    )}
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-wrap gap-2 pt-2"
                      >
                        {[
                          { value: "phone", label: "Phone" },
                          { value: "email", label: "Email" },
                          { value: "either", label: "Either" },
                          { value: "other", label: "Other" },
                        ].map((option) => (
                          <Label
                            key={option.value}
                            className={`flex cursor-pointer items-center space-x-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                              field.value === option.value
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border hover:border-primary/50"
                            } `}
                          >
                            <RadioGroupItem
                              value={option.value}
                              className="sr-only"
                            />
                            <span>{option.label}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom contact input - show when "other" is selected */}
              {preferredContact === "other" && (
                <FormField
                  control={form.control}
                  name="customContactMethod"
                  render={({ field }) => (
                    <FormItem className="mt-3">
                      <FormLabel>Your preferred contact method</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Text message to 604-555-1234"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <p className="text-muted-foreground mt-3 text-xs">
                Info on file incorrect? Let us know in the special instructions
                below.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* On-site Contact */}
        <Card>
          <CardContent>
            <h4 className="text-foreground mb-1 font-medium">
              On-Site Contact
            </h4>
            <p className="text-muted-foreground mb-4 text-sm">
              Who should our technicians ask for when they arrive?
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="onSiteContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="onSiteContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Contact phone"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Special Instructions */}
        <FormField
          control={form.control}
          name="specialInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Special Instructions{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., access codes, gate info, parking details, updated contact info, any special requirements..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="ghost" onClick={handleBack}>
            &larr; Back
          </Button>
          <Button type="submit">Continue &rarr;</Button>
        </div>
      </form>
    </Form>
  );
}
