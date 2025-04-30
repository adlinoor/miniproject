import { useState, useEffect } from "react";
import api from "@/lib/redux/api"; // Using the imported api instance
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/redux/hook";

interface TicketType {
  id: string;
  type: string;
  price: number;
  quantity: number;
}

interface Event {
  id: string;
}

interface PointsResponse {
  balance: number;
}

interface PromotionValidationResponse {
  valid: boolean;
  discount?: number;
  message?: string;
}

interface TransactionResponse {
  transaction: {
    id: string;
    // Add other transaction fields as needed
  };
}

export default function BookingForm({
  event,
  ticketTypes,
}: {
  event: Event;
  ticketTypes: TicketType[];
}) {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const [selectedTicket, setSelectedTicket] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [promoCode, setPromoCode] = useState<string>("");
  const [usePoints, setUsePoints] = useState<boolean>(false);
  const [pointsToUse, setPointsToUse] = useState<number>(0);
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [discountApplied, setDiscountApplied] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchUserPoints();
    }
  }, [user]);

  const fetchUserPoints = async () => {
    try {
      const response = await api.get<PointsResponse>(
        "/api/users/points/balance"
      );
      setAvailablePoints(response.data.balance);
    } catch (error) {
      console.error("Error fetching points balance:", error);
    }
  };

  const validatePromoCode = async () => {
    if (!promoCode) return;

    try {
      const response = await api.post<PromotionValidationResponse>(
        "/api/promotions/validate",
        {
          code: promoCode,
          eventId: event.id,
        }
      );

      if (response.data.valid) {
        setDiscountApplied(response.data.discount || 0);
        setPromoMessage(
          `Promo applied: IDR ${response.data.discount?.toLocaleString()} discount`
        );
      } else {
        setDiscountApplied(0);
        setPromoMessage(response.data.message || "Invalid promo code");
      }
    } catch (error) {
      setDiscountApplied(0);
      setPromoMessage("Error validating promo code");
    }
  };

  const calculateTotal = (): number => {
    if (!selectedTicket) return 0;

    const ticket = ticketTypes.find((t) => t.id === selectedTicket);
    if (!ticket) return 0;

    let total = ticket.price * quantity;
    total -= discountApplied;

    if (usePoints && pointsToUse > 0) {
      total = Math.max(0, total - pointsToUse);
    }

    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      Swal.fire({
        title: "Login Required",
        text: "You need to login to book this event",
        icon: "warning",
        confirmButtonText: "Login",
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/login");
        }
      });
      return;
    }

    try {
      const response = await api.post<TransactionResponse>(
        "/api/transactions",
        {
          eventId: event.id,
          ticketId: selectedTicket,
          quantity,
          voucherCode: promoCode || undefined,
          pointsUsed: usePoints ? pointsToUse : 0,
        }
      );

      Swal.fire({
        title: "Booking Successful!",
        html: `
          <p>Your booking reference: <strong>${
            response.data.transaction.id
          }</strong></p>
          <p>Total: <strong>IDR ${calculateTotal().toLocaleString()}</strong></p>
          <p>Please complete payment within 2 hours</p>
        `,
        icon: "success",
      }).then(() => {
        router.push(`/transactions/${response.data.transaction.id}`);
      });
    } catch (error: any) {
      Swal.fire({
        title: "Booking Failed",
        text: error.response?.data?.message || "Something went wrong",
        icon: "error",
      });
    }
  };

  // ... rest of your JSX remains the same ...
}
