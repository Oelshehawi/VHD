"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  FaPlus,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaStickyNote,
  FaTag,
} from "react-icons/fa";
import { createClient } from "../../app/lib/actions/actions";
import { isTextKey, isNumberKey } from "../../app/lib/utils";
import { useDebounceSubmit } from "../../app/hooks/useDebounceSubmit";
import { useIsMobile } from "../../app/hooks/use-mobile";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const AddClient = () => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const { isProcessing, debouncedSubmit } = useDebounceSubmit({
    onSubmit: async (values: any) => {
      // Transform the form data to include emails object
      const clientData = {
        ...values,
        emails: {
          primary: values.primaryEmail,
          scheduling: values.schedulingEmail || values.primaryEmail,
          accounting: values.accountingEmail || values.primaryEmail,
        },
        // Keep the old email field for backward compatibility
        email: values.primaryEmail,
      };

      // Remove the individual email fields from the data
      delete clientData.primaryEmail;
      delete clientData.schedulingEmail;
      delete clientData.accountingEmail;

      await createClient(clientData);
      setOpen(false);
      reset();
    },
    successMessage: "New client has been successfully added",
  });

  const inputFields = [
    {
      name: "clientName",
      type: "text",
      placeholder: "Enter client's full name",
      isRequired: true,
      minLength: false,
      icon: FaUser,
      label: "Client Name",
      description: "Full name or company name",
    },
    {
      name: "prefix",
      type: "text",
      placeholder: "ABC",
      isRequired: true,
      minLength: 3,
      maxLength: 3,
      onKeyDown: isTextKey,
      icon: FaTag,
      label: "Invoice Prefix",
      description: "3-letter code for invoice numbering (e.g., ABC-001)",
    },
    {
      name: "primaryEmail",
      type: "email",
      placeholder: "client@example.com",
      isRequired: true,
      label: "Primary Email",
      description:
        "Main email address for client portal access and communications",
      icon: FaEnvelope,
    },
    {
      name: "accountingEmail",
      type: "email",
      placeholder: "accounting@example.com",
      isRequired: false,
      label: "Accounting Email",
      description:
        "Dedicated email for payment reminders and invoices (optional)",
      icon: FaEnvelope,
    },
    {
      name: "schedulingEmail",
      type: "email",
      placeholder: "scheduling@example.com",
      isRequired: false,
      label: "Scheduling Email",
      description:
        "Dedicated email for job scheduling notifications (optional)",
      icon: FaEnvelope,
    },
    {
      name: "phoneNumber",
      type: "tel",
      placeholder: "(555) 123-4567",
      isRequired: true,
      onKeyDown: isNumberKey,
      icon: FaPhone,
      label: "Phone Number",
      description: "Primary contact number",
    },
    {
      name: "notes",
      type: "textarea",
      placeholder: "Additional notes, preferences, or special instructions...",
      isRequired: false,
      icon: FaStickyNote,
      label: "Notes",
      description: "Optional notes about the client or account",
    },
  ];

  const handleSave = (values: any) => {
    debouncedSubmit(values);
  };

  return (
    <>
      {/* Header Section */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg">
            <FaUser className="text-primary-foreground h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-foreground truncate text-xl font-bold sm:text-2xl">
              Clients
            </h1>
            <p className="text-muted-foreground text-xs">
              Manage your client database
            </p>
          </div>
        </div>
        <Drawer
          open={open}
          onOpenChange={setOpen}
          direction={isMobile ? "bottom" : "right"}
        >
          <DrawerTrigger asChild>
            <Button className="w-full gap-2 sm:w-auto">
              <FaPlus className="h-3 w-3" />
              Add Client
            </Button>
          </DrawerTrigger>
          <DrawerContent
            className={cn(
              isMobile
                ? "inset-x-0 bottom-0 max-h-[96vh] rounded-t-[10px]"
                : "top-0 right-0 bottom-0 left-auto mt-0 h-full w-full max-w-lg rounded-none border-l",
            )}
          >
            <DrawerHeader
              className={cn(
                "bg-primary text-primary-foreground",
                isMobile && "text-center",
              )}
            >
              <div
                className={cn(
                  "flex items-center",
                  isMobile ? "flex-col gap-3" : "justify-between",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2",
                    isMobile && "flex-col",
                  )}
                >
                  <div className="bg-primary-foreground/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <FaUser className="h-4 w-4" />
                  </div>
                  <div className={isMobile ? "text-center" : ""}>
                    <DrawerTitle>Add New Client</DrawerTitle>
                    <DrawerDescription className="text-primary-foreground/80">
                      Create a new client profile
                    </DrawerDescription>
                  </div>
                </div>
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>
            <div className="bg-background flex-1 overflow-y-auto p-4 sm:p-6">
              <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
                {inputFields.map(
                  ({
                    name,
                    type,
                    placeholder,
                    isRequired,
                    maxLength,
                    minLength,
                    onKeyDown,
                    label,
                    description,
                    icon: Icon,
                  }) => (
                    <div key={name} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon className="text-muted-foreground h-4 w-4" />
                        <Label htmlFor={name} className="text-sm font-medium">
                          {label}
                          {isRequired && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                      </div>
                      {description && (
                        <p className="text-muted-foreground ml-6 text-xs">
                          {description}
                        </p>
                      )}
                      {type === "textarea" ? (
                        <Textarea
                          id={name}
                          {...register(name, { required: isRequired })}
                          placeholder={placeholder}
                          className={cn(
                            "min-h-[80px]",
                            errors[name] &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                      ) : (
                        <Input
                          id={name}
                          {...register(name, {
                            required: isRequired,
                            minLength: minLength as number,
                            maxLength: maxLength as number,
                          })}
                          type={type}
                          placeholder={placeholder}
                          onKeyDown={onKeyDown}
                          className={cn(
                            name === "prefix" &&
                              "font-mono tracking-wider uppercase",
                            errors[name] &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                      )}
                      {errors[name] && (
                        <p className="text-destructive ml-6 text-xs">
                          {errors[name]?.type === "required" &&
                            `${label} is required`}
                          {errors[name]?.type === "minLength" &&
                            `${label} must be at least ${minLength} characters`}
                          {errors[name]?.type === "maxLength" &&
                            `${label} cannot exceed ${maxLength} characters`}
                        </p>
                      )}
                    </div>
                  ),
                )}
              </form>
            </div>
            <DrawerFooter className="bg-background border-t">
              <Button
                onClick={handleSubmit(handleSave)}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Client...
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-2 h-3 w-3" />
                    Add Client
                  </>
                )}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
};

export default AddClient;
