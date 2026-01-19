import { getSchedulingContext } from "../../../lib/autoScheduling.data";
import { formatDateWithWeekdayUTC } from "../../../lib/utils";
import SchedulingWizard from "../../../../_components/client-portal/scheduling/SchedulingWizard";
import { Card, CardContent } from "../../../../_components/ui/card";
import Image from "next/image";
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface SchedulePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function SchedulePage({
  searchParams,
}: SchedulePageProps) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;

  // No token provided
  if (!token) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <ExclamationTriangleIcon className="text-destructive h-8 w-8" />
            </div>
            <h1 className="text-foreground mb-2 text-xl font-semibold">
              Invalid Link
            </h1>
            <p className="text-muted-foreground mb-6">
              This scheduling link appears to be missing or invalid. Please use
              the link from your reminder email.
            </p>
            <p className="text-muted-foreground text-sm">
              Need help? Call us at{" "}
              <a
                href="tel:604-273-8717"
                className="text-primary hover:underline"
              >
                604-273-8717
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Validate token and get context
  const context = await getSchedulingContext(token);

  // Request already submitted - show success state
  if (!context.valid && context.existingRequest) {
    const req = context.existingRequest;
    const formatTime = (time: { hour: number; minute: number }): string => {
      const period = time.hour >= 12 ? "PM" : "AM";
      const displayHour = time.hour % 12 || 12;
      return `${displayHour}:${time.minute.toString().padStart(2, "0")} ${period}`;
    };

    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-500" />
            </div>
            <h1 className="text-foreground mb-2 text-xl font-semibold">
              Request Already Submitted
            </h1>
            <p className="text-muted-foreground mb-6">
              You&apos;ve already submitted a scheduling request for this job.
              We&apos;ll confirm your appointment within 24 hours.
            </p>

            {/* Show submitted times */}
            <div className="bg-muted/50 mb-6 rounded-lg p-4 text-left">
              <h3 className="text-foreground mb-3 text-sm font-medium">
                Your Requested Times
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs">
                    1
                  </span>
                  <div>
                    <p className="text-foreground text-sm font-medium">
                      {formatDateWithWeekdayUTC(req.primarySelection.date)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatTime(req.primarySelection.requestedTime)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-muted text-muted-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs">
                    2
                  </span>
                  <div>
                    <p className="text-foreground text-sm font-medium">
                      {formatDateWithWeekdayUTC(req.backupSelection.date)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatTime(req.backupSelection.requestedTime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground text-sm">
              Need to change your request? Call us at{" "}
              <a
                href="tel:604-273-8717"
                className="text-primary hover:underline"
              >
                604-273-8717
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid or expired token
  if (!context.valid) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
              <ClockIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
            </div>
            <h1 className="text-foreground mb-2 text-xl font-semibold">
              Link Expired or Invalid
            </h1>
            <p className="text-muted-foreground mb-6">
              {context.error ||
                "This scheduling link has expired or is no longer valid."}
            </p>
            <p className="text-muted-foreground text-sm">
              Please contact us to request a new scheduling link:
              <br />
              <a
                href="tel:604-273-8717"
                className="text-primary hover:underline"
              >
                604-273-8717
              </a>
              {" or "}
              <a
                href="mailto:adam@vancouverventcleaning.ca"
                className="text-primary hover:underline"
              >
                adam@vancouverventcleaning.ca
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid context - render scheduling wizard
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card rounded-t-lg border-b shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-3">
            <Image
              src="/images/logo.png"
              alt="VHD Logo"
              width={40}
              height={40}
              className="rounded-xl"
            />
            <div>
              <h1 className="text-foreground text-lg font-semibold">
                Vancouver Hood & Vent Cleaning
              </h1>
              <p className="text-muted-foreground text-sm">
                Schedule Your Service
              </p>
            </div>
          </div>
          <a
            href="tel:604-273-8717"
            className="text-primary hidden text-sm hover:underline sm:block"
          >
            604-273-8717
          </a>
        </div>
      </header>

      {/* Main Content - wider on desktop for horizontal stepper */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <SchedulingWizard
          token={token}
          jobsDueSoon={context.jobsDueSoon!}
          client={context.client!}
          invoice={context.invoice!}
          pattern={context.pattern}
          availableDays={context.availableDays || []}
        />
      </div>
    </div>
  );
}
