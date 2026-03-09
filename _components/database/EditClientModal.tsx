"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { updateClient } from "../../app/lib/actions/actions";
import { useForm } from "react-hook-form";
import { getEmailForPurpose, isTextKey } from "../../app/lib/utils";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaStickyNote,
  FaTag,
  FaSave,
  FaTimes,
  FaPenSquare,
} from "react-icons/fa";
import { ClientType } from "../../app/lib/typeDefinitions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

/**
 * @param {Object} props
 * @param {any} props.client
 * @param {boolean} props.isEditing
 * @param {() => void} props.toggleEdit
 */
const InlineEditClient = ({
  client,
  isEditing,
  toggleEdit,
}: {
  client: ClientType;
  isEditing: boolean;
  toggleEdit: () => void;
}) => {
  const updateClientWithId = updateClient.bind(null, client._id as string);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Workflow profile state
  const wp = client.workflowProfile;
  const [portalMode, setPortalMode] = useState<
    "internal" | "external" | "none"
  >(wp?.portalMode || "internal");

  // Get current email values for display and defaults - Fixed the bug here
  const primaryEmail =
    getEmailForPurpose(client, "primary") || client.email || "";
  const schedulingEmail = client.emails?.scheduling || "";
  const accountingEmail = client.emails?.accounting || "";
  const defaultFormValues = useMemo(
    () => ({
      clientName: client.clientName,
      prefix: client.prefix,
      primaryEmail,
      phoneNumber: client.phoneNumber,
      accountingEmail,
      schedulingEmail,
      notes: client.notes,
      externalPortalNotes: wp?.externalPortalNotes || "",
    }),
    [
      accountingEmail,
      client.clientName,
      client.notes,
      client.phoneNumber,
      client.prefix,
      primaryEmail,
      schedulingEmail,
      wp?.externalPortalNotes,
    ],
  );

  useEffect(() => {
    if (!isEditing) return;

    reset(defaultFormValues);
  }, [defaultFormValues, isEditing, reset]);

  const handleStartEdit = () => {
    setPortalMode(wp?.portalMode || "internal");
    reset(defaultFormValues);
    toggleEdit();
  };

  const handleCancelEdit = () => {
    reset(defaultFormValues);
    setPortalMode(wp?.portalMode || "internal");
    toggleEdit();
  };

  /**
   * @param {any} formData
   */
  const onSubmit = async (formData: any) => {
    try {
      // Transform the form data to include emails object
      const updateData = {
        ...formData,
        emails: {
          primary: formData.primaryEmail,
          scheduling: formData.schedulingEmail || formData.primaryEmail,
          accounting: formData.accountingEmail || formData.primaryEmail,
        },
        // Keep the old email field for backward compatibility
        email: formData.primaryEmail,
        workflowProfile: {
          portalMode,
          externalPortalNotes:
            portalMode === "external"
              ? formData.externalPortalNotes || ""
              : undefined,
        },
      };

      // Remove the individual email fields from the data
      delete updateData.primaryEmail;
      delete updateData.schedulingEmail;
      delete updateData.accountingEmail;
      delete updateData.externalPortalNotes;

      await updateClientWithId(updateData);
      toast.success("Client updated successfully");
      toggleEdit();
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
    }
  };

  // Split fields into two columns for better layout
  const clientNameField = {
    name: "clientName",
    label: "Client Name",
    type: "text",
    value: client.clientName,
    icon: FaUser,
    register: "clientName",
    required: true,
    description: "Full name or company name",
  };

  const prefixField = {
    name: "prefix",
    label: "Invoice Prefix",
    type: "text",
    value: client.prefix,
    icon: FaTag,
    register: "prefix",
    required: true,
    description: "3-letter code for invoices (e.g., ABC-001)",
    minLength: 3,
    maxLength: 3,
    onKeyDown: isTextKey,
  };

  const leftColumnFields = [
    {
      name: "primaryEmail",
      label: "Primary Email",
      type: "email",
      value: primaryEmail,
      icon: FaEnvelope,
      register: "primaryEmail",
      required: true,
    },
    {
      name: "phoneNumber",
      label: "Phone Number",
      type: "tel",
      value: client.phoneNumber,
      icon: FaPhone,
      register: "phoneNumber",
      required: true,
    },
  ];

  const rightColumnFields = [
    {
      name: "accountingEmail",
      label: "Accounting Email",
      type: "email",
      value: accountingEmail,
      icon: FaEnvelope,
      register: "accountingEmail",
      required: false,
      placeholder: "Uses primary email if empty",
    },
    {
      name: "schedulingEmail",
      label: "Scheduling Email",
      type: "email",
      value: schedulingEmail,
      icon: FaEnvelope,
      register: "schedulingEmail",
      required: false,
      placeholder: "Uses primary email if empty",
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      value: client.notes,
      icon: FaStickyNote,
      register: "notes",
      required: false,
    },
  ];

  /**
   * @param {any} field
   */
  const renderField = (field: any) => (
    <div key={field.name} className="space-y-2">
      <div className="flex items-center gap-2">
        <field.icon className="text-muted-foreground h-4 w-4" />
        <Label htmlFor={field.name} className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>

      {field.description && (
        <p className="text-muted-foreground ml-6 text-xs">
          {field.description}
        </p>
      )}

      {isEditing ? (
        <div className="ml-6">
          {field.type === "textarea" ? (
            <Textarea
              id={field.name}
              {...register(field.register, { required: field.required })}
              defaultValue={field.value}
              placeholder={field.placeholder}
              className={cn(
                "min-h-[60px]",
                errors[field.register] &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
          ) : (
            <Input
              id={field.name}
              type={field.type}
              {...register(field.register, { required: field.required })}
              defaultValue={field.value}
              placeholder={field.placeholder}
              onKeyDown={field.onKeyDown}
              className={cn(
                field.name === "prefix" && "font-mono tracking-wider uppercase",
                errors[field.register] &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
          )}
          {errors[field.register] && (
            <p className="text-destructive mt-1 text-xs">
              {field.label} is required
            </p>
          )}
        </div>
      ) : (
        <div className="ml-6">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "bg-muted text-foreground min-w-0 flex-1 rounded-lg px-3 py-2 text-sm break-words",
                field.name === "notes" && "whitespace-pre-wrap",
              )}
            >
              {field.value || (
                <span className="text-muted-foreground italic">
                  Not provided
                </span>
              )}
            </div>
            {/* Show email type indicators */}
            {field.name === "accountingEmail" &&
              field.value &&
              field.value !== primaryEmail && (
                <Badge variant="accounting">Accounting</Badge>
              )}
            {field.name === "schedulingEmail" &&
              field.value &&
              field.value !== primaryEmail &&
              field.value !== accountingEmail && (
                <Badge variant="scheduling">Scheduling</Badge>
              )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <FaUser className="text-primary h-4 w-4" />
            </div>
            <div>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>
                {isEditing ? "Edit client details" : "View client information"}
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={isEditing ? handleCancelEdit : handleStartEdit}
            variant={isEditing ? "outline" : "default"}
            size="sm"
          >
            <FaPenSquare className="h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">
              {isEditing ? "Cancel Edit" : "Edit Client"}
            </span>
            <span className="sm:hidden">{isEditing ? "Cancel" : "Edit"}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {renderField(clientNameField)}

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <prefixField.icon className="text-muted-foreground h-4 w-4" />
                  <Label
                    htmlFor={prefixField.name}
                    className="text-sm font-medium"
                  >
                    {prefixField.label}
                    {prefixField.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                </div>
                {prefixField.description && (
                  <p className="text-muted-foreground ml-6 text-xs">
                    {prefixField.description}
                  </p>
                )}
                {isEditing ? (
                  <div className="ml-6">
                    <Input
                      id={prefixField.name}
                      type={prefixField.type}
                      {...register(prefixField.register, {
                        required: prefixField.required,
                        minLength: prefixField.minLength,
                        maxLength: prefixField.maxLength,
                      })}
                      defaultValue={prefixField.value}
                      placeholder="ABC"
                      onKeyDown={prefixField.onKeyDown}
                      className={cn(
                        "font-mono tracking-wider uppercase",
                        errors[prefixField.register] &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                    {errors[prefixField.register] && (
                      <p className="text-destructive mt-1 text-xs">
                        {errors[prefixField.register]?.type === "required" &&
                          `${prefixField.label} is required`}
                        {errors[prefixField.register]?.type === "minLength" &&
                          `${prefixField.label} must be at least ${prefixField.minLength} characters`}
                        {errors[prefixField.register]?.type === "maxLength" &&
                          `${prefixField.label} cannot exceed ${prefixField.maxLength} characters`}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="ml-6">
                    <div className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm font-medium tracking-wider uppercase">
                      {prefixField.value}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FaGlobe className="text-muted-foreground h-4 w-4" />
                  <Label className="text-sm font-medium">Portal Mode</Label>
                </div>
                <p className="text-muted-foreground ml-6 text-xs">
                  Controls portal access and office communication workflow
                </p>
                {isEditing ? (
                  <div className="ml-6">
                    <Select
                      value={portalMode}
                      onValueChange={(v) =>
                        setPortalMode(v as "internal" | "external" | "none")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="external">External</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="ml-6">
                    <div className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm capitalize">
                      {wp?.portalMode || "internal"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(isEditing
              ? portalMode === "external"
              : wp?.portalMode === "external" && wp.externalPortalNotes) && (
              <div className="space-y-2 pb-3">
                <div className="flex items-center gap-2">
                  <FaStickyNote className="text-muted-foreground h-4 w-4" />
                  <Label className="text-xs">External Portal Notes</Label>
                </div>
                {isEditing ? (
                  <Textarea
                    {...register("externalPortalNotes")}
                    defaultValue={wp?.externalPortalNotes || ""}
                    placeholder="e.g., Use ServiceChannel for billing/reminders. Contact Jane at..."
                    className="ml-6 min-h-[60px]"
                  />
                ) : (
                  <p className="text-foreground ml-6 text-sm whitespace-pre-wrap">
                    {wp?.externalPortalNotes}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-4">{leftColumnFields.map(renderField)}</div>
            <div className="space-y-4">
              {rightColumnFields.map(renderField)}
            </div>
          </div>

          {isEditing && (
            <div className="mt-4 flex space-x-3 border-t pt-4">
              <Button type="submit" className="flex-1">
                <FaSave className="mr-2 h-3 w-3" />
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                className="flex-1"
              >
                <FaTimes className="mr-2 h-3 w-3" />
                Cancel
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default InlineEditClient;
