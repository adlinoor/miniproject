import { DateTime } from "luxon";

type TransactionStatus =
  | "waiting_for_payment"
  | "waiting_for_admin_confirmation"
  | "done"
  | "rejected"
  | "expired"
  | "canceled";

interface StatusTrackerProps {
  status: TransactionStatus;
  expiresAt?: Date | string;
}

const statusOrder: TransactionStatus[] = [
  "waiting_for_payment",
  "waiting_for_admin_confirmation",
  "done",
  "rejected",
  "expired",
  "canceled",
];

interface StatusInfoItem {
  title: string;
  description: string;
  color: string;
}

const statusInfo: Record<TransactionStatus, StatusInfoItem> = {
  waiting_for_payment: {
    title: "Waiting for Payment",
    description: "Please upload your payment proof within 2 hours",
    color: "bg-yellow-500",
  },
  waiting_for_admin_confirmation: {
    title: "Pending Approval",
    description: "Waiting for organizer to confirm your payment",
    color: "bg-blue-500",
  },
  done: {
    title: "Completed",
    description: "Your booking is confirmed",
    color: "bg-green-500",
  },
  rejected: {
    title: "Rejected",
    description: "Your payment was rejected by organizer",
    color: "bg-red-500",
  },
  expired: {
    title: "Expired",
    description: "You didn't complete payment in time",
    color: "bg-gray-500",
  },
  canceled: {
    title: "Canceled",
    description: "Transaction was canceled",
    color: "bg-gray-500",
  },
};

export default function StatusTracker({
  status,
  expiresAt,
}: StatusTrackerProps) {
  const currentStatusIndex = statusOrder.indexOf(status);
  const isActive = (index: number) => index <= currentStatusIndex;

  const { remainingMinutes, percentage } = (() => {
    if (!expiresAt || status !== "waiting_for_payment") {
      return { remainingMinutes: 0, percentage: 0 };
    }

    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const totalDuration = 2 * 60 * 60 * 1000; // 2 hours
    const remainingTime = expirationDate.getTime() - now.getTime();
    const remainingMinutes = Math.max(
      0,
      Math.floor(remainingTime / (1000 * 60))
    );
    const percentage = Math.max(
      0,
      Math.min(100, (remainingTime / totalDuration) * 100)
    );

    return { remainingMinutes, percentage };
  })();

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        {statusOrder.slice(0, 3).map((s, index) => (
          <div key={s} className="flex flex-col items-center w-1/3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                isActive(index) ? statusInfo[s].color : "bg-gray-300"
              }`}
            >
              {index + 1}
            </div>
            <div
              className={`text-sm mt-2 text-center ${
                isActive(index) ? "font-medium" : "text-gray-500"
              }`}
            >
              {statusInfo[s].title}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="font-semibold">{statusInfo[status].title}</h4>
        <p className="text-gray-600">{statusInfo[status].description}</p>

        {status === "waiting_for_payment" && expiresAt && (
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Time remaining:</span>
              <span>{remainingMinutes} minutes</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
