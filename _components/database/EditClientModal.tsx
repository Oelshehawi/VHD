"use client";
import toast from "react-hot-toast";
import { updateClient } from "../../app/lib/actions/actions";
import { useForm } from "react-hook-form";
import { getEmailForPurpose } from "../../app/lib/utils";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaStickyNote,
  FaSave,
  FaTimes,
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
    formState: { errors },
  } = useForm();

  // Get current email values for display and defaults - Fixed the bug here
  const primaryEmail =
    getEmailForPurpose(client, "primary") || client.email || "";
  const schedulingEmail = client.emails?.scheduling || "";
  const accountingEmail = client.emails?.accounting || "";

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
      };

      // Remove the individual email fields from the data
      delete updateData.primaryEmail;
      delete updateData.schedulingEmail;
      delete updateData.accountingEmail;

      await updateClientWithId(updateData);
      toast.success("Client updated successfully");
      toggleEdit();
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
    }
  };

  // Split fields into two columns for better layout
  const leftColumnFields = [
    {
      name: "clientName",
      label: "Client Name",
      type: "text",
      value: client.clientName,
      icon: FaUser,
      register: "clientName",
      required: true,
    },
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
              className={cn(
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
            <div className="bg-muted text-foreground flex-1 rounded-lg px-3 py-2 text-sm">
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
      <CardHeader>
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
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
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
                onClick={toggleEdit}
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
