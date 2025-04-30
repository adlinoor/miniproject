"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "@/lib/api";
import { Event } from "@/interfaces/event.interface";
import Image from "next/image";
import { formatDate } from "@/utils/helpers";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "@/lib/redux/hooks";
import { selectUser } from "@/lib/redux/features/userSlice";

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`/api/events/${id}`);
        setEvent(response.data);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch event details",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleBookNow = async () => {
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "You need to login to book this event",
      });
      return;
    }

    if (!selectedTicket) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a ticket type",
      });
      return;
    }

    try {
      const response = await axios.post("/api/transactions", {
        eventId: event?.id,
        ticketId: selectedTicket,
        quantity,
      });

      Swal.fire({
        icon: "success",
        title: "Booking Successful",
        text: "Your booking has been created. Please complete the payment.",
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Booking Failed",
        text: error.response?.data?.message || "Something went wrong",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!event) {
    return <div className="text-center py-8">Event not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="relative h-96 rounded-lg overflow-hidden mb-4">
            <Image
              src={event.images[0]?.url || "/placeholder-event.jpg"}
              alt={event.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {event.images.slice(1).map((image) => (
              <div
                key={image.id}
                className="relative h-32 rounded overflow-hidden"
              >
                <Image
                  src={image.url}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          <p className="text-gray-600 mb-4">
            Organized by: {event.organizer.first_name}{" "}
            {event.organizer.last_name}
          </p>

          <div className="flex items-center mb-4">
            <div className="mr-4">
              <span className="block text-sm text-gray-500">Start Date</span>
              <span className="font-medium">{formatDate(event.startDate)}</span>
            </div>
            <div>
              <span className="block text-sm text-gray-500">End Date</span>
              <span className="font-medium">{formatDate(event.endDate)}</span>
            </div>
          </div>

          <div className="mb-4">
            <span className="block text-sm text-gray-500">Location</span>
            <span className="font-medium">{event.location}</span>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">About this event</h2>
            <p className="text-gray-700">{event.description}</p>
          </div>

          {event.tickets && event.tickets.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Tickets</h2>
              <div className="space-y-2">
                {event.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedTicket === ticket.id
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => setSelectedTicket(ticket.id)}
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{ticket.type}</h3>
                        <p className="text-sm text-gray-600">
                          IDR {ticket.price.toLocaleString()}
                        </p>
                      </div>
                      <span className="text-sm text-gray-600">
                        {ticket.quantity} available
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedTicket && (
                <div className="mt-4 flex items-center">
                  <label htmlFor="quantity" className="mr-2">
                    Quantity:
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    max={
                      event.tickets.find((t) => t.id === selectedTicket)
                        ?.quantity
                    }
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border rounded"
                  />
                  <button
                    onClick={handleBookNow}
                    className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
